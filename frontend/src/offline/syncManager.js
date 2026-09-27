import {
  enqueueOfflineOp,
  getPendingOps,
  removePendingOp,
  cacheRoomElements
} from "./indexedDb.js";

export class SyncManager {
  constructor(socket = null) {
    this.socket = socket;
    this.isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    this.isReplaying = false;
    this.listeners = new Set();

    this.initNetworkListeners();
  }

  setSocket(socket) {
    this.socket = socket;
    if (this.socket) {
      this.socket.on("connect", () => {
        this.handleOnline();
      });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error("[SyncManager] Listener error:", e);
      }
    }
  }

  initNetworkListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());

    // Listen for Service Worker background sync triggers
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "TRIGGER_OFFLINE_SYNC") {
          this.replayPendingQueue();
        }
      });
    }
  }

  handleOffline() {
    this.isOnline = false;
    this.notify({ type: "NETWORK_STATUS_CHANGE", isOnline: false });
  }

  handleOnline() {
    this.isOnline = true;
    this.notify({ type: "NETWORK_STATUS_CHANGE", isOnline: true });
    this.replayPendingQueue();
  }

  /**
   * Dispatches a draw action: emits over socket if online, otherwise enqueues in IndexedDB.
   */
  async dispatchDraw(roomId, element) {
    if (this.isOnline && this.socket && this.socket.connected) {
      return new Promise((resolve) => {
        this.socket.emit("draw-stroke", { roomId, element }, (ack) => {
          resolve({ status: "synced", response: ack });
        });
      });
    } else {
      // Offline fallback: save in IndexedDB pending queue
      const opId = await enqueueOfflineOp(roomId, "draw-stroke", element);
      this.notify({ type: "OP_ENQUEUED", opId, element });
      return { status: "queued", opId };
    }
  }

  /**
   * Replays pending offline operations when connection is re-established.
   */
  async replayPendingQueue(roomId = null) {
    if (this.isReplaying || !this.socket || !this.socket.connected) {
      return;
    }

    this.isReplaying = true;
    this.notify({ type: "REPLAY_START" });

    try {
      const pendingOps = await getPendingOps(roomId);

      for (const op of pendingOps) {
        if (!this.socket.connected) {
          console.warn("[SyncManager] Connection lost during replay, pausing queue.");
          break;
        }

        await new Promise((resolve) => {
          this.socket.emit(op.type, { roomId: op.roomId, element: op.payload }, async (ack) => {
            if (ack && (ack.success || !ack.error)) {
              await removePendingOp(op.id);
            }
            resolve();
          });
        });
      }

      this.notify({ type: "REPLAY_COMPLETE" });
    } catch (err) {
      console.error("[SyncManager] Replay error:", err);
      this.notify({ type: "REPLAY_ERROR", error: err.message });
    } finally {
      this.isReplaying = false;
    }
  }
}

export const syncManager = new SyncManager();
export default syncManager;
