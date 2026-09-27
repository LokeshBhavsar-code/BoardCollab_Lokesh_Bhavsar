import "dotenv/config";

const requiredEnvVars = [
  "JWT_SECRET"
];

export function validateEnv() {
  const missing = [];
  for (const v of requiredEnvVars) {
    if (!process.env[v]) {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[Configuration] Fatal: Missing required environment variable(s): ${missing.join(", ")}`;
    console.error(errorMsg);
    if (process.env.NODE_ENV === "production") {
      throw new Error(errorMsg);
    }
  }
}

export const env = {
  // App
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || process.env.BACKEND_PORT || 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  // Security
  JWT_SECRET: process.env.JWT_SECRET || "default_dev_jwt_secret_do_not_use_in_prod",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",

  // Database (MongoDB)
  MONGO_HOST: process.env.MONGO_HOST || "localhost",
  MONGO_PORT: process.env.MONGO_PORT || "27017",
  MONGO_ROOT_USERNAME: process.env.MONGO_ROOT_USERNAME || "",
  MONGO_ROOT_PASSWORD: process.env.MONGO_ROOT_PASSWORD || "",
  MONGO_DATABASE: process.env.MONGO_DATABASE || "boardcollab",
  MONGODB_URI: process.env.MONGODB_URI,

  // Cache & Pub/Sub (Redis)
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || "6379",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_URL: process.env.REDIS_URL,

  // Scalability, Capacity & Operating Limits
  // Max elements stored and rendered per canvas room session
  ROOM_MAX_ELEMENTS: Number(process.env.ROOM_MAX_ELEMENTS || 10000),
  // Max points allowed for a single freehand stroke
  STROKE_MAX_POINTS: Number(process.env.STROKE_MAX_POINTS || 5000),
  // Depth of user-scoped undo/redo stack
  COLLAB_UNDO_LIMIT: Number(process.env.COLLAB_UNDO_LIMIT || 50),
  // Debounce window in ms for batching canvas element writes to MongoDB
  PERSISTENCE_FLUSH_INTERVAL_MS: Number(process.env.PERSISTENCE_FLUSH_INTERVAL_MS || 500),
  // Maximum batch operations flushed at once
  PERSISTENCE_BATCH_LIMIT: Number(process.env.PERSISTENCE_BATCH_LIMIT || 100),
  // Maximum offline sync operations processed in a single batch
  OFFLINE_SYNC_BATCH_LIMIT: Number(process.env.OFFLINE_SYNC_BATCH_LIMIT || 1000),
  // AI Shape Recognition threshold
  AI_CONFIDENCE_THRESHOLD: Number(process.env.AI_CONFIDENCE_THRESHOLD || 0.70)
};

validateEnv();

export default env;
