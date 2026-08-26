import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  return globalForRedis.redis;
}
