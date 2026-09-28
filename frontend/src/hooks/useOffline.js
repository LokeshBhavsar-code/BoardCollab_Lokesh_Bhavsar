/**
 * useOffline — React hook that wires SyncManager into React state.
 *
 * Returns:
 *   isOnline       : boolean — current network status
 *   isReplaying    : boolean — true while queued ops are being replayed
 *   pendingCount   : number  — number of ops waiting in the offline queue
 *   dispatchDraw   : fn      — (roomId, element) -> calls syncManager.dispatchDraw
 */

import { useCallback, useEffect, useState } from "react";
import { syncManager } from "../offline/syncManager.js";
import { getPendingOps } from "../offline/indexedDb.js";

export function useOffline(socket, roomId) {
  const [isOnline, setIsOnline] = useState(syncManager.isOnline);
  const [isReplaying, setIsReplaying] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Keep syncManager's socket reference up to date
  useEffect(() => {
    syncManager.setSocket(socket);
  }, [socket]);

  // Refresh pending count from IndexedDB
  const refreshPendingCount = useCallback(async () => {
    try {
      const ops = await getPendingOps(roomId || null);
      setPendingCount(ops.length);
    } catch {
      setPendingCount(0);
    }
  }, [roomId]);

  // Subscribe to syncManager events
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === "NETWORK_STATUS_CHANGE") {
        setIsOnline(event.isOnline);
        refreshPendingCount();
      }
      if (event.type === "OP_ENQUEUED") {
        refreshPendingCount();
      }
      if (event.type === "REPLAY_START") {
        setIsReplaying(true);
      }
      if (event.type === "REPLAY_COMPLETE" || event.type === "REPLAY_ERROR") {
        setIsReplaying(false);
        refreshPendingCount();
      }
    });

    // Initial count
    refreshPendingCount();

    return unsubscribe;
  }, [refreshPendingCount]);

  const dispatchDraw = useCallback(
    (rId, element) => syncManager.dispatchDraw(rId, element),
    []
  );

  return { isOnline, isReplaying, pendingCount, dispatchDraw };
}
