import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createAdapter } from "@socket.io/redis-adapter";
import registerRoomHandlers from "./handlers/room.handler.js";
import registerDrawHandlers from "./handlers/draw.handler.js";
import collaborationService from "../services/collaboration.service.js";
import { getRedisPublisher, getRedisSubscriber, isRedisReady } from "../config/redis.js";
import logger from "../utils/logger.js";

export function initializeSockets(server) {
  const clientOrigin = process.env.CLIENT_ORIGIN
    ? (process.env.CLIENT_ORIGIN.includes(",")
        ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
        : process.env.CLIENT_ORIGIN)
    : "*";

  const jwtSecret = process.env.JWT_SECRET;

  const io = new Server(server, {
    cors: {
      origin: clientOrigin,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  //  Wire Redis adapter for horizontal scaling (pub/sub across multiple Node processes/pods).
  // Falls back to in-process adapter gracefully when Redis is unavailable.
  if (isRedisReady()) {
    const pubClient = getRedisPublisher();
    const subClient = getRedisSubscriber();
    if (pubClient && subClient) {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info("[Socket.IO] Redis adapter attached — horizontal scaling enabled");
    }
  } else {
    logger.warn("[Socket.IO] Redis unavailable — using in-memory adapter (single-process only)");
  }

  // JWT Socket Authentication Middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required: token missing"));
    }

    try {
      if (!jwtSecret) {
        throw new Error("Server misconfigured: JWT_SECRET missing in environment");
      }
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  io.on("connection", (socket) => {
    socket.emit("server-ready", {
      connected: true,
      user: {
        id: socket.user.id,
        username: socket.user.username
      }
    });

    // Register modular socket handlers
    registerRoomHandlers(io, socket);
    registerDrawHandlers(io, socket);

    // Handle disconnect cleanup
    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        const { presence } = collaborationService.removeParticipant(roomId, socket.id);
        io.to(roomId).emit("presence:update", { presence });
      }
    });
  });

  return io;
}

export default initializeSockets;
