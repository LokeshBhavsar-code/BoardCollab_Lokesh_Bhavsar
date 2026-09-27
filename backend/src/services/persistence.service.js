import CanvasElement from "../models/element.model.js";
import Session from "../models/session.model.js";

export class PersistenceService {
  constructor(flushIntervalMs = 500) {
    // Map of elementId -> { elementData, roomId, sessionId, type, createdBy, properties, version, isDeleted }
    this.pendingQueue = new Map();
    this.flushIntervalMs = flushIntervalMs;
    this.timer = null;
    this.isFlushing = false;

    this.startAutoFlush();
  }

  startAutoFlush() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.flush().catch((err) => {
        console.error("[Persistence] Auto-flush error:", err.message);
      });
    }, this.flushIntervalMs);
    // Don't keep the Node.js event loop alive solely for persistence timer
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  stopAutoFlush() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  queueElement(element) {
    const key = `${element.roomId}:${element.elementId || element.id}`;
    this.pendingQueue.set(key, {
      ...element,
      elementId: element.elementId || element.id,
      queuedAt: Date.now()
    });
  }

  async flush() {
    if (this.isFlushing || this.pendingQueue.size === 0) {
      return;
    }

    this.isFlushing = true;
    const batch = Array.from(this.pendingQueue.values());
    this.pendingQueue.clear();

    try {
      const bulkOps = batch.map((item) => ({
        updateOne: {
          filter: { roomId: item.roomId, elementId: item.elementId },
          update: {
            $set: {
              sessionId: item.sessionId,
              type: item.type,
              createdBy: item.createdBy,
              properties: item.properties,
              version: item.version || 1,
              isDeleted: Boolean(item.isDeleted),
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
            }
          },
          upsert: true
        }
      }));

      if (bulkOps.length > 0) {
        await CanvasElement.bulkWrite(bulkOps, { ordered: false });
        // Update session lastOperationAt
        const sessionIds = [...new Set(batch.map((b) => b.sessionId).filter(Boolean))];
        if (sessionIds.length > 0) {
          await Session.updateMany(
            { _id: { $in: sessionIds } },
            { $set: { lastOperationAt: new Date() } }
          );
        }
      }
    } catch (err) {
      console.error("[Persistence] Bulk write failed:", err.message);
      // Re-queue items that failed if appropriate
      for (const item of batch) {
        const key = `${item.roomId}:${item.elementId}`;
        if (!this.pendingQueue.has(key)) {
          this.pendingQueue.set(key, item);
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }

  async flushRoom(roomId) {
    const batch = [];
    for (const [key, item] of this.pendingQueue.entries()) {
      if (String(item.roomId) === String(roomId)) {
        batch.push(item);
        this.pendingQueue.delete(key);
      }
    }

    if (batch.length === 0) return;

    const bulkOps = batch.map((item) => ({
      updateOne: {
        filter: { roomId: item.roomId, elementId: item.elementId },
        update: {
          $set: {
            sessionId: item.sessionId,
            type: item.type,
            createdBy: item.createdBy,
            properties: item.properties,
            version: item.version || 1,
            isDeleted: Boolean(item.isDeleted),
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
          }
        },
        upsert: true
      }
    }));

    await CanvasElement.bulkWrite(bulkOps, { ordered: false });
  }
}

export const persistenceService = new PersistenceService();
export default persistenceService;
