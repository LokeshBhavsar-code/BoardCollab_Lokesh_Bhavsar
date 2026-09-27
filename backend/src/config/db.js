import mongoose from "mongoose";

let isConnected = false;

export function getMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const host = process.env.MONGO_HOST || "localhost";
  const port = process.env.MONGO_PORT || "27017";
  const database = process.env.MONGO_DATABASE || "boardcollab";
  const username = process.env.MONGO_ROOT_USERNAME;
  const password = process.env.MONGO_ROOT_PASSWORD;

  if (username && password) {
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?authSource=admin`;
  }

  return `mongodb://${host}:${port}/${database}`;
}

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = getMongoUri();

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error(`[Database] Fatal: MongoDB connection failed — ${error.message}`);
    throw error; // C-4: Propagate so server.js can call process.exit(1)
  }
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("[Database] MongoDB disconnected cleanly");
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export default { connectDB, disconnectDB, isDbConnected, getMongoUri };