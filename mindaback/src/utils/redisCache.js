// src/utils/redisCache.js
import { redisClient, isRedisReady } from "../config/redis.js";

// ─────────────────────────────────────────────────────────────────────────────
// Circuit breaker
//
// Without this every cache call paid a Redis ping on each invocation. When
// Redis is unreachable (DNS failure, network blip, expired free-tier cluster)
// the ping itself blocks for `connectTimeout` ms. Page that hits 5 cached
// endpoints = 5 × ping-timeout added to every request. That alone made
// production feel "stuck at 25+ seconds" for the user even though caching
// was supposed to be FASTER, not slower.
//
// The breaker remembers when a health check failed and short-circuits all
// cache reads/writes for COOLDOWN_MS, returning null immediately so the
// caller falls through to the DB. Every COOLDOWN_MS we re-probe; if Redis
// is back the breaker closes and caching resumes automatically.
// ─────────────────────────────────────────────────────────────────────────────
const COOLDOWN_MS = 60_000; // 1 minute "Redis is down" memory
let lastFailureAt = 0;

async function readyOrShortCircuit() {
  if (Date.now() - lastFailureAt < COOLDOWN_MS) {
    return false; // recently failed, skip all Redis work
  }
  const ready = await isRedisReady();
  if (!ready) {
    lastFailureAt = Date.now();
    return false;
  }
  return true;
}

export async function cacheGet(key) {
  if (!(await readyOrShortCircuit())) return null;
  try {
    return await redisClient.get(key);
  } catch {
    lastFailureAt = Date.now();
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  if (!(await readyOrShortCircuit())) return false;
  try {
    await redisClient.set(key, value, { EX: ttlSeconds });
    return true;
  } catch {
    lastFailureAt = Date.now();
    return false;
  }
}

export async function cacheDel(key) {
  if (!(await readyOrShortCircuit())) return;
  try {
    await redisClient.del(key);
  } catch {
    lastFailureAt = Date.now();
  }
}

export async function cacheDelByPrefix(prefix) {
  if (!(await readyOrShortCircuit())) return;
  try {
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch {
    lastFailureAt = Date.now();
  }
}

export async function getOrSetJSON(key, ttlSeconds, fetchFn) {
  const cached = await cacheGet(key);
  if (cached) {
    try {
      return { data: JSON.parse(cached), fromCache: true };
    } catch {
      // Corrupted cache value — treat as miss.
    }
  }

  const data = await fetchFn();
  await cacheSet(key, JSON.stringify(data), ttlSeconds);
  return { data, fromCache: false };
}