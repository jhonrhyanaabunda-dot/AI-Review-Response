export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

// Demo mode: rate limiting is disabled (no Redis available).
export async function rateLimit(
  _identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  return {
    allowed: true,
    remaining: limit,
    resetAt: Date.now() + windowSeconds * 1000,
  };
}
