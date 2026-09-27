import Room from "../../models/room.model.js";
import Session from "../../models/session.model.js";
import collaborationService from "../../services/collaboration.service.js";

export function registerRoomHandlers(io, socket) {
  // Join room event
  socket.on("join-room", async (data, ack) => {
    try {
      const { roomId } = data || {};
      if (!roomId) {
        const error = { code: "INVALID_ROOM_ID", message: "roomId is required" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      // Check room existence and authorization
      let room;
      if (roomId.length === 6) {
        room = await Room.findOne({ code: roomId.toUpperCase(), isArchived: false });
      } else {
        room = await Room.findOne({ _id: roomId, isArchived: false }); // H-6: always filter isArchived
      }

      if (!room || room.isArchived) {
        const error = { code: "ROOM_NOT_FOUND", message: "Room not found or archived" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      const userId = socket.user.id;
      const isOwner = room.ownerId.toString() === userId.toString();
      const isMember = room.members.some((m) => m.userId.toString() === userId.toString());

      if (room.visibility === "private" && !isOwner && !isMember) {
        const error = {
          code: "FORBIDDEN",
          message: "You are not authorized to join this private room"
        };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      // Auto-add to members if public room and not member yet
      if (!isOwner && !isMember && room.visibility === "public") {
        room.members.push({ userId, role: "editor", joinedAt: new Date() });
        await room.save().catch(() => {});
      }

      const actualRoomId = room._id.toString();

      // Ensure active session
      let session = await Session.findOne({ roomId: actualRoomId, status: "active" }).sort({ version: -1 });
      if (!session) {
        session = await Session.create({ roomId: actualRoomId, version: 1, status: "active" });
      }

      // Leave previous rooms if any
      const currentRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      for (const prevRoom of currentRooms) {
        socket.leave(prevRoom);
        collaborationService.removeParticipant(prevRoom, socket.id);
        io.to(prevRoom).emit("presence:update", {
          presence: collaborationService.getPresence(prevRoom)
        });
      }

      // Join socket room
      socket.join(actualRoomId);
      socket.data.roomId = actualRoomId;
      socket.data.sessionId = session._id.toString(); // C-3: store sessionId so draw handlers can reference it

      // Ensure room elements are loaded from DB
      await collaborationService.ensureRoomLoaded(actualRoomId, session._id.toString());

      // Register participant presence
      const presence = collaborationService.addParticipant(actualRoomId, socket.id, socket.user);

      // Emit full room state to the joining user
      const snapshot = collaborationService.getSnapshot(actualRoomId);
      socket.emit("room:state", {
        roomId: actualRoomId,
        roomName: room.name,
        elements: snapshot.elements,
        version: snapshot.version,
        presence
      });

      // Broadcast presence update to everyone in the room
      io.to(actualRoomId).emit("presence:update", { presence });

      if (typeof ack === "function") {
        ack({
          success: true,
          roomId: actualRoomId,
          version: snapshot.version,
          elementCount: snapshot.elements.length
        });
      }
    } catch (err) {
      console.error("[Socket] join-room error:", err);
      const error = { code: "SERVER_ERROR", message: "Failed to join room" };
      socket.emit("room:error", error);
      if (typeof ack === "function") ack({ error });
    }
  });

  // Leave room event
  socket.on("leave-room", (data, ack) => {
    const roomId = data?.roomId || socket.data.roomId;
    if (roomId) {
      socket.leave(roomId);
      const { presence } = collaborationService.removeParticipant(roomId, socket.id);
      io.to(roomId).emit("presence:update", { presence });
      delete socket.data.roomId;
    }
    if (typeof ack === "function") ack({ success: true });
  });

  // Ephemeral cursor movement
  socket.on("cursor:move", (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !data) return;

    const cursorData = collaborationService.updateCursor(roomId, socket.id, {
      x: data.x,
      y: data.y
    });

    if (cursorData) {
      socket.to(roomId).emit("cursor:update", cursorData);
    }
  });

  // Heartbeat signal
  socket.on("heartbeat", (_data, ack) => {
    if (typeof ack === "function") {
      ack({ timestamp: Date.now() });
    } else {
      socket.emit("heartbeat:ack", { timestamp: Date.now() });
    }
  });
}

export default registerRoomHandlers;
