import CanvasElement from "../models/element.model.js";
import Session from "../models/session.model.js";
import env from "../config/env.js";

export class PersistenceService {
  constructor(
    flushIntervalMs = env.PERSISTENCE_FLUSH_INTERVAL_MS,
    batchLimit = env.PERSISTENCE_BATCH_LIMIT
  ) {
    // Map of elementId -> { elementData, roomId, sessionId, type, createdBy, properties, version, isDeleted }
    this.pendingQueue = new Map();
    this.flushIntervalMs = flushIntervalMs;
    this.batchLimit = batchLimit;
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
    const batchEntries = Array.from(this.pendingQueue.entries()).slice(0, this.batchLimit);
    const batch = batchEntries.map(([key, item]) => {
      this.pendingQueue.delete(key);
      return item;
    });

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
    const batchEntries = Array.from(this.pendingQueue.entries())
      .filter(([, item]) => String(item.roomId) === String(roomId))
      .slice(0, this.batchLimit);
    const batch = batchEntries.map(([key, item]) => {
      this.pendingQueue.delete(key);
      return item;
    });

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
