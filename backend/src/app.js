import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet"; // M-11: security headers
import rateLimit from "express-rate-limit"; // M-1: brute-force protection
import { isDbConnected } from "./config/db.js";
import { isRedisReady } from "./config/redis.js";
import authRoutes from "./modules/auth/auth.routes.js";
import roomsRoutes from "./modules/rooms/rooms.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

const app = express();

// M-11: Apply security headers (X-Content-Type-Options, X-Frame-Options, CSP, HSTS, etc.)
app.use(helmet());

const clientOrigin = process.env.CLIENT_ORIGIN
  ? (process.env.CLIENT_ORIGIN.includes(",")
      ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
      : process.env.CLIENT_ORIGIN)
  : "*";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);

app.use(express.json({ limit: "5mb" }));

// M-1: Global API rate limiter — 300 req/15min per IP (generous for general endpoints)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" } }
});
app.use("/api", globalLimiter);

// Health check endpoint (exempt from rate limiting via positioning before limiter if needed,
// but it is cheap enough to leave under the global limiter)
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "boardcollab-api",
    timestamp: new Date().toISOString(),
    services: {
      database: isDbConnected() ? "connected" : "disconnected",
      cache: isRedisReady() ? "connected" : "degraded/in-memory"
    }
  });
});

// Mount feature modules
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);

// Catch 404 routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
