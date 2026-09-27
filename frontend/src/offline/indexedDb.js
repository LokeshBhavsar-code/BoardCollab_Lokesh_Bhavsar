const DB_NAME = "boardcollab_offline_db";
const DB_VERSION = 1;

/**
 * Opens or upgrades the IndexedDB database instance.
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Rooms store
      if (!db.objectStoreNames.contains("rooms")) {
        db.createObjectStore("rooms", { keyPath: "id" });
      }

      // 2. Elements store with roomId index
      if (!db.objectStoreNames.contains("elements")) {
        const elementStore = db.createObjectStore("elements", { keyPath: "id" });
        elementStore.createIndex("roomId", "roomId", { unique: false });
        elementStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      // 3. Pending offline operations queue
      if (!db.objectStoreNames.contains("pendingQueue")) {
        const queueStore = db.createObjectStore("pendingQueue", {
          keyPath: "id",
          autoIncrement: true
        });
        queueStore.createIndex("roomId", "roomId", { unique: false });
        queueStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache elements for a room in IndexedDB.
 */
export async function cacheRoomElements(roomId, elements) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("elements", "readwrite");
    const store = tx.objectStore("elements");

    for (const el of elements) {
      store.put({
        ...el,
        roomId: String(roomId),
        updatedAt: el.updatedAt || new Date().toISOString()
      });
    }

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Load cached elements for a room from IndexedDB.
 */
export async function getCachedRoomElements(roomId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("elements", "readonly");
    const store = tx.objectStore("elements");
    const index = store.index("roomId");
    const request = index.getAll(String(roomId));

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enqueue an offline operation (e.g. stroke drawn while disconnected).
 */
export async function enqueueOfflineOp(roomId, type, payload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pendingQueue", "readwrite");
    const store = tx.objectStore("pendingQueue");

    const record = {
      roomId: String(roomId),
      type,
      payload,
      timestamp: Date.now(),
      status: "pending"
    };

    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all pending operations for a given room or all rooms.
 */
export async function getPendingOps(roomId = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pendingQueue", "readonly");
    const store = tx.objectStore("pendingQueue");

    if (roomId) {
      const index = store.index("roomId");
      const request = index.getAll(String(roomId));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } else {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    }
  });
}

/**
 * Clear replayed operations from the pending queue.
 */
export async function removePendingOp(opId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pendingQueue", "readwrite");
    const store = tx.objectStore("pendingQueue");
    const request = store.delete(opId);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all pending operations for a room.
 */
export async function clearPendingQueue(roomId = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pendingQueue", "readwrite");
    const store = tx.objectStore("pendingQueue");

    if (!roomId) {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    } else {
      const index = store.index("roomId");
      const request = index.openCursor(IDBKeyRange.only(String(roomId)));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve(true);
        }
      };
      request.onerror = () => reject(request.error);
    }
  });
}

export default {
  openDB,
  cacheRoomElements,
  getCachedRoomElements,
  enqueueOfflineOp,
  getPendingOps,
  removePendingOp,
  clearPendingQueue
};
