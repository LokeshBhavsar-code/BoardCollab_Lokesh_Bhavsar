import "dotenv/config";
import http from "node:http";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { initRedis, closeRedis } from "./config/redis.js";
import { initializeSockets } from "./sockets/index.js";
import persistenceService from "./services/persistence.service.js";

const port = Number(process.env.PORT || process.env.BACKEND_PORT || 5000);
const server = http.createServer(app);
const io = initializeSockets(server);
// M-6: Register io on app so RoomsController can fetch it via req.app.get("io")
app.set("io", io);

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Redis (non-blocking fallback to in-memory caching if Redis container is not running)
    await initRedis();

    server.listen(port, () => {
      console.log(`[Server] BoardCollab API & Realtime Server listening on port ${port}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("[Server] Fatal error during bootstrap:", error);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);

  try {
    // 1. Flush any pending canvas operations to MongoDB
    console.log("[Server] Flushing persistence queue...");
    persistenceService.stopAutoFlush();
    await persistenceService.flush();

    // 2. Close Socket.io & HTTP server
    io.close();
    await new Promise((resolve) => server.close(resolve));
    console.log("[Server] HTTP and Socket server closed");

    // 3. Close Redis & Mongo connections
    await closeRedis();
    await disconnectDB();

    console.log("[Server] Graceful shutdown completed cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("[Server] Error during graceful shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// M-12: Catch any uncaught exception or unhandled promise rejection
// so the graceful shutdown routine (persistence flush, DB/Redis close) always runs.
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught Exception:", err);
  gracefulShutdown("uncaughtException").catch(() => process.exit(1));
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection").catch(() => process.exit(1));
});

startServer();

export { server, io };
