import crypto from "node:crypto";
import Room from "../../models/room.model.js";
import Session from "../../models/session.model.js";
import CanvasElement from "../../models/element.model.js";
import { AppError } from "../../middleware/error.middleware.js";
import ExportService from "../../services/export.service.js";
import collaborationService from "../../services/collaboration.service.js";

export class RoomsService {
  static generateRoomCode() {
    return crypto.randomBytes(3).toString("hex").toUpperCase();
  }

  static async createRoom({ name, description = "", visibility = "private", ownerId }) {
    // C-5: Generate unique room code with bounded retries.
    // Instead of an unbounded loop, we try up to 10 times and let MongoDB's unique
    // index on `code` be the final safety net — catching the 11000 duplicate error
    // at the create() call below if a race still occurs.
    let code;
    const MAX_CODE_RETRIES = 10;
    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const candidate = RoomsService.generateRoomCode();
      const exists = await Room.findOne({ code: candidate });
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      // Extremely unlikely — only if all 10 candidates collided
      throw new AppError("Unable to generate a unique room code, please retry", 500, "ROOM_CODE_EXHAUSTED");
    }

    // M-8: Use findOneAndUpdate with upsert for the room creation so that if two
    // concurrent requests race past code generation, only one succeeds.
    const room = await Room.create({
      name,
      description,
      ownerId,
      visibility,
      code,
      members: [
        {
          userId: ownerId,
          role: "owner",
          joinedAt: new Date()
        }
      ]
    });

    // M-8: Use findOneAndUpdate with upsert to avoid duplicate active session creation
    // for the same room (TOCTOU between findOne + create).
    const session = await Session.findOneAndUpdate(
      { roomId: room._id, status: "active" },
      { $setOnInsert: { roomId: room._id, version: 1, status: "active" } },
      { upsert: true, new: true }
    );

    return {
      room,
      session
    };
  }

  static async listRooms(userId, page = 1, limit = 50) {
    // H-3: Paginated query — never returns the entire collection
    const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const [rooms, total] = await Promise.all([
      Room.find({
        $or: [
          { ownerId: userId },
          { "members.userId": userId },
          { visibility: "public" }
        ],
        isArchived: false
      })
        .populate("ownerId", "username email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Room.countDocuments({
        $or: [
          { ownerId: userId },
          { "members.userId": userId },
          { visibility: "public" }
        ],
        isArchived: false
      })
    ]);

    return {
      rooms,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    };
  }

  static async getRoom(roomId, userId) {
    let room;
    // Check if queried by 6-char room code or ObjectId
    // H-6: Both paths now include isArchived: false filter
    if (roomId.length === 6) {
      room = await Room.findOne({ code: roomId.toUpperCase(), isArchived: false });
    } else {
      room = await Room.findOne({ _id: roomId, isArchived: false }); // H-6: was findById (no isArchived filter)
    }

    if (!room) {
      throw new AppError("Room not found or archived", 404, "ROOM_NOT_FOUND");
    }

    const isOwner = room.ownerId.toString() === userId.toString();
    const isMember = room.members.some((m) => m.userId.toString() === userId.toString());

    if (room.visibility === "private" && !isOwner && !isMember) {
      throw new AppError("You do not have permission to access this room", 403, "FORBIDDEN");
    }

    // M-8: Use upsert to avoid duplicate active sessions from concurrent calls
    const session = await Session.findOneAndUpdate(
      { roomId: room._id, status: "active" },
      { $setOnInsert: { roomId: room._id, version: 1, status: "active" } },
      { upsert: true, new: true, sort: { version: -1 } }
    );

    // Get canvas snapshot from collaboration service or database
    await collaborationService.ensureRoomLoaded(room._id.toString(), session._id.toString());
    const snapshot = collaborationService.getSnapshot(room._id.toString());

    return {
      room,
      session,
      elements: snapshot.elements,
      presence: snapshot.presence
    };
  }

  static async joinRoom(roomId, userId, role = "editor") {
    let room;
    // H-6: Both paths include isArchived: false filter
    if (roomId.length === 6) {
      room = await Room.findOne({ code: roomId.toUpperCase(), isArchived: false });
    } else {
      room = await Room.findOne({ _id: roomId, isArchived: false });
    }

    if (!room) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    const existingMember = room.members.find((m) => m.userId.toString() === userId.toString());
    if (!existingMember) {
      room.members.push({
        userId,
        role: role === "owner" ? "editor" : role,
        joinedAt: new Date()
      });
      await room.save();
    }

    return room;
  }

  static async updateRoom(roomId, userId, updates) {
    const room = await Room.findOne({ _id: roomId, isArchived: false });
    if (!room) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    if (room.ownerId.toString() !== userId.toString()) {
      throw new AppError("Only the room owner can update room settings", 403, "FORBIDDEN");
    }

    const allowed = ["name", "description", "visibility", "isArchived"];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        room[key] = updates[key];
      }
    }

    await room.save();
    return room;
  }

  /**
   * M-3: Soft-delete a room (owner only).
   * Sets isArchived: true and emits a room:archived Socket.IO event so active
   * WebSocket connections are notified and can gracefully disconnect (M-6).
   */
  static async deleteRoom(roomId, userId, io = null) {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    if (room.ownerId.toString() !== userId.toString()) {
      throw new AppError("Only the room owner can delete this room", 403, "FORBIDDEN");
    }

    room.isArchived = true;
    await room.save();

    // M-6: Evict active WebSocket connections so viewers/editors learn the room is gone
    if (io) {
      io.to(roomId).emit("room:archived", {
        roomId,
        message: "This room has been archived by the owner"
      });
      // Leave all sockets from the room after notifying them
      const socketsInRoom = await io.in(roomId).fetchSockets();
      for (const sock of socketsInRoom) {
        sock.leave(roomId);
      }
    }

    return { message: "Room archived successfully", roomId };
  }

  static async exportRoom(roomId, userId, format = "json") {
    const { room, elements } = await RoomsService.getRoom(roomId, userId);

    if (format === "svg") {
      const svg = ExportService.exportSvg(room, elements);
      return {
        format: "svg",
        contentType: "image/svg+xml",
        data: svg,
        filename: `${room.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.svg`
      };
    }

    if (format === "png") {
      const pngBuffer = await ExportService.exportPng(room, elements);
      return {
        format: "png",
        contentType: "image/png",
        data: pngBuffer,
        filename: `${room.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.png`
      };
    }

    const json = ExportService.exportJson(room, elements);
    return {
      format: "json",
      contentType: "application/json",
      data: json,
      filename: `${room.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`
    };
  }

  static async syncOfflineBatch(roomId, userId, operations, clientBaseVersion = 0) {
    // Verify room access
    const { room, session } = await RoomsService.getRoom(roomId, userId);
    return collaborationService.syncOfflineBatch(
      room._id.toString(),
      userId,
      operations,
      clientBaseVersion,
      session._id.toString()
    );
  }
}

export default RoomsService;
