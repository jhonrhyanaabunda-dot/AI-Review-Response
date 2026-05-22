import { redis } from "./client";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Sliding-window token bucket using a single atomic Lua script.
 * limit / windowSeconds defines the rate.
 */
const SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window * 1000)
local count = redis.call('ZCARD', key)
if count >= limit then
  return {0, 0, redis.call('PTTL', key)}
end
redis.call('ZADD', key, now, now .. ':' .. math.random())
redis.call('PEXPIRE', key, window * 1000)
return {1, limit - count - 1, window * 1000}
`;

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `rl:${identifier}`;
  const result = (await redis.eval(
    SCRIPT,
    1,
    key,
    now.toString(),
    windowSeconds.toString(),
    limit.toString(),
  )) as [number, number, number];

  return {
    allowed: result[0] === 1,
    remaining: Math.max(0, result[1]),
    resetAt: now + result[2],
  };
}
