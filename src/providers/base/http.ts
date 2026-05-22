import pRetry, { AbortError } from "p-retry";
import { ProviderError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

export type HttpOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  // Treat these status codes as non-retryable
  nonRetryableStatuses?: number[];
};

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_NON_RETRYABLE = [400, 401, 403, 404, 422];

/**
 * Wraps fetch with timeout + exponential-backoff retry, mapping failures
 * into a {@link ProviderError} so the worker layer can classify retryable
 * vs terminal errors uniformly across all third-party APIs.
 */
export async function httpRequest<T>(
  url: string,
  opts: HttpOptions = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 3,
    nonRetryableStatuses = DEFAULT_NON_RETRYABLE,
    ...init
  } = opts;

  return pRetry(
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          if (nonRetryableStatuses.includes(res.status)) {
            throw new AbortError(
              new ProviderError(
                `Upstream ${res.status} from ${url}: ${body.slice(0, 500)}`,
                false,
                { status: res.status },
              ),
            );
          }
          throw new ProviderError(
            `Upstream ${res.status} from ${url}: ${body.slice(0, 500)}`,
            true,
            { status: res.status },
          );
        }
        const text = await res.text();
        return (text ? JSON.parse(text) : {}) as T;
      } finally {
        clearTimeout(timeout);
      }
    },
    {
      retries,
      factor: 2,
      minTimeout: 500,
      maxTimeout: 8_000,
      onFailedAttempt: (err) => {
        logger.warn({ url, attempt: err.attemptNumber, msg: err.message }, "http retry");
      },
    },
  );
}
