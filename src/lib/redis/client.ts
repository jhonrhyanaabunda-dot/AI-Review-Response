import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisBlocking: Redis | undefined;
}

const url = process.env.REDIS_URL ?? "redis://localhost:6379";

function build() {
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });
}

export const redis = global.__redis ?? build();
// BullMQ requires a separate connection for blocking commands.
export const redisBlocking = global.__redisBlocking ?? build();

if (process.env.NODE_ENV !== "production") {
  global.__redis = redis;
  global.__redisBlocking = redisBlocking;
}
