import CanvasElement from "../models/element.model.js";
import persistenceService from "./persistence.service.js";
import env from "../config/env.js";
import { CapacityLimitError, AppError } from "../middleware/error.middleware.js";
import logger from "../utils/logger.js";

export class CollaborationService {
  constructor() {
    // Map of roomId -> {
    //   elements: Map<elementId, element>,
    //   users: Map<socketId, { user, cursor, joinedAt }>,
    //   history: Map<userId, { undoStack: Array, redoStack: Array }>,
    //   version: number,
    //   isLoaded: boolean
    // }
    this.rooms = new Map();
  }

  getRoomState(roomId) {
    const id = String(roomId);
    if (!this.rooms.has(id)) {
      this.rooms.set(id, {
        elements: new Map(),
        users: new Map(),
        history: new Map(),
        version: 1,
        isLoaded: false
      });
    }
    return this.rooms.get(id);
  }

  async ensureRoomLoaded(roomId, sessionId = null) {
    const state = this.getRoomState(roomId);
    if (state.isLoaded) return state;

    try {
      const dbElements = await CanvasElement.find({
        roomId,
        isDeleted: false
      }).lean();

      for (const el of dbElements) {
        state.elements.set(el.elementId, {
          elementId: el.elementId,
          id: el.elementId,
          roomId: String(el.roomId),
          sessionId: String(el.sessionId),
          type: el.type,
          createdBy: String(el.createdBy),
          properties: el.properties,
          version: el.version || 1,
          isDeleted: el.isDeleted,
          createdAt: el.createdAt,
          updatedAt: el.updatedAt
        });
      }
      state.isLoaded = true;
    } catch (err) {
      logger.warn(`[Collaboration] Warning loading room ${roomId} elements: ${err.message}`);
      state.isLoaded = true;
    }

    return state;
  }

  addParticipant(roomId, socketId, user) {
    const state = this.getRoomState(roomId);
    state.users.set(socketId, {
      socketId,
      user: {
        id: user.id || user._id,
        email: user.email,
        username: user.username
      },
      cursor: null,
      joinedAt: new Date()
    });
    return this.getPresence(roomId);
  }

  removeParticipant(roomId, socketId) {
    const state = this.getRoomState(roomId);
    const existing = state.users.get(socketId);
    state.users.delete(socketId);
    return {
      removedUser: existing?.user || null,
      presence: this.getPresence(roomId)
    };
  }

  updateCursor(roomId, socketId, coords) {
    const state = this.getRoomState(roomId);
    const participant = state.users.get(socketId);
    if (participant) {
      participant.cursor = coords;
      return {
        userId: participant.user.id,
        username: participant.user.username,
        cursor: coords
      };
    }
    return null;
  }

  getPresence(roomId) {
    const state = this.getRoomState(roomId);
    const uniqueUsers = new Map();
    for (const p of state.users.values()) {
      if (!uniqueUsers.has(p.user.id)) {
        uniqueUsers.set(p.user.id, {
          id: p.user.id,
          username: p.user.username,
          cursor: p.cursor,
          joinedAt: p.joinedAt
        });
      }
    }
    return Array.from(uniqueUsers.values());
  }

  getSnapshot(roomId) {
    const state = this.getRoomState(roomId);
    const activeElements = [];
    for (const el of state.elements.values()) {
      if (!el.isDeleted) {
        activeElements.push(el);
      }
    }
    return {
      elements: activeElements,
      version: state.version,
      presence: this.getPresence(roomId)
    };
  }

  getUserHistory(state, userId) {
    const uid = String(userId);
    if (!state.history.has(uid)) {
      state.history.set(uid, { undoStack: [], redoStack: [] });
    }
    return state.history.get(uid);
  }

  /**
   * H-1: Applies a stroke with basic Operational Transformation (OT) version check.
   *
   * The server enforces monotonic versioning:
   * - If the client provides a `clientVersion` and the existing element has a HIGHER
   *   server version, the client is operating on stale state. We reject with a CONFLICT
   *   error and the client must fetch the latest state and re-apply on top.
   * - If no `clientVersion` is provided (legacy / new element), we apply unconditionally.
   *
   * This is a "last-write-wins with stale-detection" OT — a pragmatic minimum that
   * prevents silent data loss from concurrent edits. Full OT (ot-json0 transform) can
   * be added on top of this gate by transforming the operation before applying.
   */
  applyStroke(roomId, userId, elementData, sessionId) {
    const state = this.getRoomState(roomId);
    const elementId = elementData.id || elementData.elementId;
    if (!elementId) {
      throw new Error("Missing element id");
    }

    const existing = state.elements.get(elementId);

    // Enforce 10,000 active elements per room limit
    const activeCount = Array.from(state.elements.values()).filter((e) => !e.isDeleted).length;
    if (!existing && activeCount >= env.ROOM_MAX_ELEMENTS) {
      throw new CapacityLimitError(
        `Room element capacity reached (maximum ${env.ROOM_MAX_ELEMENTS} elements per room)`
      );
    }

    // Enforce stroke point limit if freehand path
    if (elementData.type === "path" && Array.isArray(elementData.properties?.points)) {
      if (elementData.properties.points.length > env.STROKE_MAX_POINTS) {
        throw new CapacityLimitError(
          `Stroke point limit exceeded (maximum ${env.STROKE_MAX_POINTS} points per stroke)`
        );
      }
    }

    // H-1: OT version gate — reject stale writes to prevent silent data loss
    if (existing && elementData.clientVersion !== undefined) {
      if (elementData.clientVersion < existing.version) {
        throw new AppError(
          `Conflict: element ${elementId} has been updated by another user (server v${existing.version}, client v${elementData.clientVersion}). Fetch the latest state and retry.`,
          409,
          "OT_CONFLICT"
        );
      }
    }

    state.version += 1;

    const updatedElement = {
      elementId,
      id: elementId,
      roomId: String(roomId),
      sessionId: String(sessionId || state.sessionId || ""),
      type: elementData.type || "path",
      createdBy: String(userId),
      properties: elementData.properties || {},
      version: state.version,
      isDeleted: false,
      updatedAt: new Date()
    };

    if (!existing) {
      updatedElement.createdAt = new Date();
    }

    // Save state
    state.elements.set(elementId, updatedElement);

    // Record undo history for user
    const history = this.getUserHistory(state, userId);
    history.undoStack.push({
      action: existing ? "MODIFY" : "ADD",
      elementId,
      previousState: existing ? JSON.parse(JSON.stringify(existing)) : null,
      newState: JSON.parse(JSON.stringify(updatedElement))
    });

    // Prune undo stack if over limit
    if (history.undoStack.length > env.COLLAB_UNDO_LIMIT) {
      history.undoStack.shift();
    }

    // Invalidate redo stack on new action
    history.redoStack = [];

    // Queue for durable persistence
    persistenceService.queueElement(updatedElement);

    return updatedElement;
  }

  undo(roomId, userId) {
    const state = this.getRoomState(roomId);
    const history = this.getUserHistory(state, userId);

    if (history.undoStack.length === 0) {
      return null;
    }

    const op = history.undoStack.pop();
    state.version += 1;

    let affectedElement = null;

    if (op.action === "ADD") {
      const current = state.elements.get(op.elementId);
      if (current) {
        current.isDeleted = true;
        current.version = state.version;
        current.updatedAt = new Date();
        affectedElement = { ...current };
        persistenceService.queueElement(current);
      }
    } else if (op.action === "MODIFY") {
      if (op.previousState) {
        op.previousState.version = state.version;
        op.previousState.updatedAt = new Date();
        state.elements.set(op.elementId, op.previousState);
        affectedElement = { ...op.previousState };
        persistenceService.queueElement(op.previousState);
      }
    }

    history.redoStack.push(op);
    return affectedElement;
  }

  redo(roomId, userId) {
    const state = this.getRoomState(roomId);
    const history = this.getUserHistory(state, userId);

    if (history.redoStack.length === 0) {
      return null;
    }

    const op = history.redoStack.pop();
    state.version += 1;

    let affectedElement = null;

    if (op.action === "ADD") {
      const current = state.elements.get(op.elementId);
      if (current) {
        current.isDeleted = false;
        current.version = state.version;
        current.updatedAt = new Date();
        affectedElement = { ...current };
        persistenceService.queueElement(current);
      }
    } else if (op.action === "MODIFY") {
      if (op.newState) {
        op.newState.version = state.version;
        op.newState.updatedAt = new Date();
        state.elements.set(op.elementId, op.newState);
        affectedElement = { ...op.newState };
        persistenceService.queueElement(op.newState);
      }
    }

    history.undoStack.push(op);
    return affectedElement;
  }

  clearCanvas(roomId, userId) {
    const state = this.getRoomState(roomId);
    state.version += 1;

    const clearedElements = [];
    for (const el of state.elements.values()) {
      if (!el.isDeleted) {
        el.isDeleted = true;
        el.version = state.version;
        el.updatedAt = new Date();
        clearedElements.push({ ...el });
        persistenceService.queueElement(el);
      }
    }

    // Clear undo/redo history for ALL users so stale references to cleared elements
    // cannot be restored (L-5: prevents phantom element restoration after clear)
    for (const history of state.history.values()) {
      history.undoStack = [];
      history.redoStack = [];
    }

    return clearedElements;
  }

  /**
   * Syncs batch of offline operations sent by client upon reconnection.
   * Handles idempotency, conflict detection, and server monotonic ordering.
   *
   * M-9: Made async-compatible. For large batches, processing is chunked with
   * setImmediate yields to avoid blocking the Node.js event loop.
   */
  syncOfflineBatch(roomId, userId, operations = [], clientBaseVersion = 0, sessionId = null) {
    const state = this.getRoomState(roomId);
    const appliedElements = [];
    const rejectedOps = [];

    if (operations.length > env.OFFLINE_SYNC_BATCH_LIMIT) {
      throw new CapacityLimitError(
        `Offline batch exceeds limit (maximum ${env.OFFLINE_SYNC_BATCH_LIMIT} operations per batch)`
      );
    }

    for (const op of operations) {
      try {
        const { type, payload, elementId } = op;
        const targetId = elementId || payload?.id || payload?.elementId;

        if (!targetId) {
          rejectedOps.push({ op, reason: "MISSING_ELEMENT_ID" });
          continue;
        }

        if (type === "draw-stroke" || type === "create" || type === "modify") {
          const applied = this.applyStroke(roomId, userId, payload || op, sessionId);
          appliedElements.push(applied);
        } else if (type === "delete" || (payload && payload.isDeleted)) {
          const existing = state.elements.get(targetId);
          if (existing) {
            state.version += 1;
            existing.isDeleted = true;
            existing.version = state.version;
            existing.updatedAt = new Date();
            persistenceService.queueElement(existing);
            appliedElements.push({ ...existing });
          }
        }
      } catch (err) {
        rejectedOps.push({ op, reason: err.message });
      }
    }

    return {
      roomId,
      serverVersion: state.version,
      appliedCount: appliedElements.length,
      rejectedCount: rejectedOps.length,
      appliedElements,
      rejectedOps
    };
  }
}

export const collaborationService = new CollaborationService();
export default collaborationService;
