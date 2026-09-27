import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import {
  applyElementUpdate,
  clearCanvas,
  hydrateCanvas,
  mergeRemoteElements
} from "../redux/canvasSlice.js";
import {
  setConnectionStatus,
  setRoomError,
  setUsers
} from "../redux/roomSlice.js";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const socketUrl = import.meta.env.VITE_SOCKET_URL || new URL(apiUrl, window.location.origin).origin;

export function useSocket(token, roomId) {
  const dispatch = useDispatch();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token || !roomId) {
      setSocket(null);
      dispatch(setConnectionStatus(false));
      return undefined;
    }

    const client = io(socketUrl, {
      auth: { token },
      reconnection: true,
      transports: ["websocket", "polling"]
    });
    let pendingElements = [];
    let flushScheduled = false;

    const flushRemoteElements = () => {
      flushScheduled = false;
      if (pendingElements.length) {
        dispatch(mergeRemoteElements(pendingElements));
        pendingElements = [];
      }
    };

    const queueRemoteElement = (element) => {
      if (!element) return;
      pendingElements.push(element);
      if (!flushScheduled) {
        flushScheduled = true;
        queueMicrotask(flushRemoteElements);
      }
    };

    client.on("connect", () => {
      setSocket(client);
      dispatch(setConnectionStatus(true));
      dispatch(setRoomError(null));
      client.emit("join-room", { roomId }, (ack) => {
        if (ack?.error) dispatch(setRoomError(ack.error.message));
      });
    });
    client.on("disconnect", () => dispatch(setConnectionStatus(false)));
    client.on("connect_error", (error) => {
      dispatch(setConnectionStatus(false));
      dispatch(setRoomError(error.message));
    });
    client.on("room:state", (snapshot) => {
      dispatch(hydrateCanvas({ roomId: snapshot.roomId, elements: snapshot.elements || [] }));
      dispatch(setUsers(snapshot.presence || []));
    });
    client.on("presence:update", (payload) => dispatch(setUsers(payload.presence || [])));
    client.on("draw-stroke", (payload) => queueRemoteElement(payload.element));
    client.on("room:batch-updated", (payload) => {
      for (const element of payload.elements || []) queueRemoteElement(element);
    });
    client.on("element:updated", (payload) => dispatch(applyElementUpdate(payload.element)));
    client.on("canvas:cleared", () => dispatch(clearCanvas()));
    client.on("room:error", (error) => dispatch(setRoomError(error.message || "Room error")));

    return () => {
      client.emit("leave-room", { roomId });
      client.disconnect();
      dispatch(setConnectionStatus(false));
    };
  }, [dispatch, roomId, token]);

  return socket;
}