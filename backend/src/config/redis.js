import { createClient } from "redis";

let client = null;
let publisher = null;
let subscriber = null;
let isReady = false;

export function getRedisUrl() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST || "localhost";
  const port = process.env.REDIS_PORT || "6379";
  const password = process.env.REDIS_PASSWORD;

  if (password) {
    return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
  }

  return `redis://${host}:${port}`;
}

export async function initRedis() {
  if (client && isReady) {
    return { client, publisher, subscriber, isReady };
  }

  const url = getRedisUrl();

  try {
    client = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => (retries > 5 ? false : 1000)
      }
    });

    client.on("error", (err) => {
      console.warn(`[Redis] Connection warning: ${err.message}`);
      isReady = false;
    });

    client.on("ready", () => {
      console.log("[Redis] Connected and ready");
      isReady = true;
    });

    await client.connect();
    isReady = true;

    publisher = client.duplicate();
    subscriber = client.duplicate();
    await Promise.all([publisher.connect(), subscriber.connect()]);

    return { client, publisher, subscriber, isReady: true };
  } catch (err) {
    console.warn(`[Redis] Redis connection notice: ${err.message}. Running in in-memory mode.`);
    return { client: null, publisher: null, subscriber: null, isReady: false };
  }
}

export function getRedisClient() {
  return isReady ? client : null;
}

export function getRedisPublisher() {
  return isReady ? publisher : null;
}

export function getRedisSubscriber() {
  return isReady ? subscriber : null;
}

export function isRedisReady() {
  return isReady;
}

export async function closeRedis() {
  if (subscriber) await subscriber.quit().catch(() => {});
  if (publisher) await publisher.quit().catch(() => {});
  if (client) await client.quit().catch(() => {});
  isReady = false;
}

export default {
  initRedis,
  getRedisClient,
  getRedisPublisher,
  getRedisSubscriber,
  isRedisReady,
  closeRedis,
  getRedisUrl
};
