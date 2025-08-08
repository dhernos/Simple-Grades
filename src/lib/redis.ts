// src/lib/redis.ts

import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis;

declare global {
  var __redis: Redis | undefined;
}

// In development, use a global variable to avoid multiple connections
if (process.env.NODE_ENV === "production") {
  redis = new Redis(redisUrl);
} else {
  if (!global.__redis) {
    global.__redis = new Redis(redisUrl);
  }
  redis = global.__redis;
}

redis.on('connect', () => {
  console.log('Connected to Redis successfully!');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;