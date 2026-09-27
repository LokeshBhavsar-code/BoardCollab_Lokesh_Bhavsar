import collaborationService from "../../services/collaboration.service.js";
import Room from "../../models/room.model.js";
import { AppError, CapacityLimitError } from "../../middleware/error.middleware.js";

/**
 * H-2: Sanitize socket error messages — only forward known AppError/CapacityLimitError
 * messages to the client; mask all other internal errors.
 */
function safeErrorMessage(err) {
  if (err instanceof AppError || err instanceof CapacityLimitError) {
    return err.message;
  }
  return "An internal server error occurred";
}

/**
 * H-4: Resolve the role of the current socket user within a given room.
 * Returns the role string ("owner"|"editor"|"viewer") or null if not a member.
 */
async function getUserRoleInRoom(roomId, userId) {
  const room = await Room.findOne({ _id: roomId, isArchived: false })
    .select("ownerId members")
    .lean();
  if (!room) return null;
  if (room.ownerId.toString() === userId.toString()) return "owner";
  const member = room.members.find((m) => m.userId.toString() === userId.toString());
  return member ? member.role : null;
}

export function registerDrawHandlers(io, socket) {
  // Real-time drawing stroke / element creation or update
  socket.on("draw-stroke", (data, ack) => {
    try {
      const roomId = data?.roomId || socket.data.roomId;
      const element = data?.element;

      if (!roomId) {
        const error = { code: "NO_ACTIVE_ROOM", message: "Client is not in an active room" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      if (!element || (!element.id && !element.elementId)) {
        const error = { code: "INVALID_ELEMENT", message: "Element with valid id is required" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      const updatedElement = collaborationService.applyStroke(
        roomId,
        socket.user.id,
        element,
        socket.data.sessionId // C-3: now correctly populated from join-room
      );

      // Broadcast to all other peers in the room
      socket.to(roomId).emit("draw-stroke", {
        roomId,
        element: updatedElement,
        userId: socket.user.id
      });

      if (typeof ack === "function") {
        ack({
          success: true,
          element: updatedElement,
          version: updatedElement.version
        });
      }
    } catch (err) {
      console.error("[Socket] draw-stroke error:", err.message);
      const error = { code: "DRAW_ERROR", message: safeErrorMessage(err) }; // H-2
      socket.emit("room:error", error);
      if (typeof ack === "function") ack({ error });
    }
  });

  // User-scoped Undo
  socket.on("undo", (data, ack) => {
    try {
      const roomId = data?.roomId || socket.data.roomId;
      if (!roomId) {
        const error = { code: "NO_ACTIVE_ROOM", message: "Client is not in an active room" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      const affectedElement = collaborationService.undo(roomId, socket.user.id);

      if (affectedElement) {
        // Broadcast element update (e.g. isDeleted: true or previous state)
        io.to(roomId).emit("element:updated", {
          roomId,
          element: affectedElement,
          action: "undo",
          userId: socket.user.id
        });
      }

      if (typeof ack === "function") {
        ack({
          success: Boolean(affectedElement),
          element: affectedElement
        });
      }
    } catch (err) {
      console.error("[Socket] undo error:", err.message);
      const error = { code: "UNDO_ERROR", message: safeErrorMessage(err) }; // H-2
      socket.emit("room:error", error);
      if (typeof ack === "function") ack({ error });
    }
  });

  // User-scoped Redo
  socket.on("redo", (data, ack) => {
    try {
      const roomId = data?.roomId || socket.data.roomId;
      if (!roomId) {
        const error = { code: "NO_ACTIVE_ROOM", message: "Client is not in an active room" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      const affectedElement = collaborationService.redo(roomId, socket.user.id);

      if (affectedElement) {
        io.to(roomId).emit("element:updated", {
          roomId,
          element: affectedElement,
          action: "redo",
          userId: socket.user.id
        });
      }

      if (typeof ack === "function") {
        ack({
          success: Boolean(affectedElement),
          element: affectedElement
        });
      }
    } catch (err) {
      console.error("[Socket] redo error:", err.message);
      const error = { code: "REDO_ERROR", message: safeErrorMessage(err) }; // H-2
      socket.emit("room:error", error);
      if (typeof ack === "function") ack({ error });
    }
  });

  // Clear canvas for room — H-4: only owner or editor can clear
  socket.on("clear-canvas", async (data, ack) => {
    try {
      const roomId = data?.roomId || socket.data.roomId;
      if (!roomId) {
        const error = { code: "NO_ACTIVE_ROOM", message: "Client is not in an active room" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      // H-4: authorization check — viewers may not clear the canvas
      const role = await getUserRoleInRoom(roomId, socket.user.id);
      if (!role || role === "viewer") {
        const error = { code: "FORBIDDEN", message: "Only owners and editors can clear the canvas" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      const cleared = collaborationService.clearCanvas(roomId, socket.user.id);

      io.to(roomId).emit("canvas:cleared", {
        roomId,
        clearedCount: cleared.length,
        clearedBy: socket.user.id
      });

      if (typeof ack === "function") {
        ack({ success: true, clearedCount: cleared.length });
      }
    } catch (err) {
      console.error("[Socket] clear-canvas error:", err.message);
      const error = { code: "CLEAR_ERROR", message: safeErrorMessage(err) }; // H-2
      socket.emit("room:error", error);
      if (typeof ack === "function") ack({ error });
    }
  });

  // Offline Sync: Replay offline operation batch upon client reconnection
  socket.on("sync-offline-batch", (data, ack) => {
    try {
      const roomId = data?.roomId || socket.data.roomId;
      const operations = data?.operations || [];
      const clientBaseVersion = data?.clientBaseVersion || 0;

      if (!roomId) {
        const error = { code: "NO_ACTIVE_ROOM", message: "Client is not in an active room" };
        socket.emit("room:error", error);
        if (typeof ack === "function") ack({ error });
        return;
      }

      const syncResult = collaborationService.syncOfflineBatch(
        roomId,
        socket.user.id,
        operations,
        clientBaseVersion,
        socket.data.sessionId // C-3: correctly populated
      );

      // Broadcast applied elements to all other room participants
      if (syncResult.appliedElements.length > 0) {
        socket.to(roomId).emit("room:batch-updated", {
          roomId,
          elements: syncResult.appliedElements,
          userId: socket.user.id,
          serverVersion: syncResult.serverVersion
        });
      }

      if (typeof ack === "function") {
        ack({
          success: true,
          ...syncResult
        });
      }
    } catch (err) {
      console.error("[Socket] sync-offline-batch error:", err.message);
      const error = { code: "OFFLINE_SYNC_ERROR", message: safeErrorMessage(err) }; // H-2
      socket.emit("room:error", error);
      if (typeof ack === "function") ack({ error });
    }
  });
}

export default registerDrawHandlers;
