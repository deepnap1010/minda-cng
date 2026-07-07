// src/config/redis.js
import { createClient } from "redis";
import { config } from "../config.js";

// Why these socket options:
// - connectTimeout 2000ms: production Redis (cloud) had DNS failures
//   (`ENOTFOUND`) that hung the default 5s connect attempt on EVERY cache
//   call. Short timeout means a dead Redis adds only 2s, not 5s+.
// - reconnectStrategy returns false after 3 retries so the client gives up
//   instead of an infinite reconnect loop chewing CPU and logging spam.

// Wrapped in try/catch so an invalid REDIS_URL in .env (e.g. someone pasted
// the whole `redis-cli -u redis://...` command instead of just the URL)
// does NOT crash the entire process. Without this, a single typo in .env
// would put PM2 into a hard crash loop where the API is completely down.
let redisClientInstance = null;
try {
  redisClientInstance = createClient({
    url: config.REDIS_URL || "redis://127.0.0.1:6379",
    socket: {
      connectTimeout: 2000,
      reconnectStrategy: (retries) => {
        if (retries > 3) return false;
        return Math.min(retries * 200, 1000);
      },
    },
  });

  redisClientInstance.on("error", (err) => {
    console.error("Redis Error:", err.message);
  });

  redisClientInstance.on("connect", () => {
    console.log("Redis Connected");
  });
} catch (err) {
  console.error(
    "Redis client could not be initialised (check REDIS_URL in .env):",
    err?.message || err
  );
  redisClientInstance = null;
}

export const redisClient = redisClientInstance;

let isConnected = false;

export async function ensureRedisConnected() {
  if (!redisClient) return null;
  try {
    if (isConnected && redisClient.isOpen) return redisClient;

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    await redisClient.ping();
    isConnected = true;
    return redisClient;
  } catch (error) {
    isConnected = false;
    return null;
  }
}

export async function isRedisReady() {
  const client = await ensureRedisConnected();
  return Boolean(client?.isOpen);
}