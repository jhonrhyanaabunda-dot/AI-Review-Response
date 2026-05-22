import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisBlocking: Redis | undefined;
}

const url = process.env.REDIS_URL ?? "redis://localhost:6379";

function build() {
  // lazyConnect so importing this module during a Next.js prerender
  // doesn't open a TCP connection at build time. The real connection is
  // opened on first command. We silently absorb the connection-error
  // event so it doesn't crash the build when Redis is unreachable.
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  client.on("error", () => {});
  return client;
}

export const redis = global.__redis ?? build();
// BullMQ requires a separate connection for blocking commands.
export const redisBlocking = global.__redisBlocking ?? build();

if (process.env.NODE_ENV !== "production") {
  global.__redis = redis;
  global.__redisBlocking = redisBlocking;
}
