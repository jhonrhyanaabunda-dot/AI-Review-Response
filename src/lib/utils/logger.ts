import pino from "pino";

/**
 * Plain pino — no `transport: pino-pretty` because that runs in a worker
 * thread that Next.js dev reaps, after which every subsequent log call
 * throws. Pipe through `pino-pretty` from the shell in dev if you want
 * the colorized output.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "*.password",
      "*.passwordHash",
      "*.access_token",
      "*.refresh_token",
      "*.cipherText",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
});

export type Logger = typeof logger;
