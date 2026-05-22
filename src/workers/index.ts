import { Worker } from "bullmq";
import { redisBlocking } from "@/lib/redis/client";
import { logger } from "@/lib/utils/logger";
import { QUEUE_NAMES, schedulerQueue, jobDefaults } from "./queues";
import { processSyncReviews } from "./processors/sync-reviews";
import { processGenerateResponse } from "./processors/generate-response";
import { processPublishResponse } from "./processors/publish-response";
import { processScheduler } from "./processors/scheduler";

const connection = { connection: redisBlocking };

function start() {
  const workers = [
    new Worker(QUEUE_NAMES.syncReviews, processSyncReviews, {
      ...connection,
      concurrency: 8,
    }),
    new Worker(QUEUE_NAMES.generateResponse, processGenerateResponse, {
      ...connection,
      concurrency: Number(process.env.AI_GENERATION_CONCURRENCY ?? 4),
    }),
    new Worker(QUEUE_NAMES.publishResponse, processPublishResponse, {
      ...connection,
      concurrency: Number(process.env.PUBLISH_CONCURRENCY ?? 2),
    }),
    new Worker(QUEUE_NAMES.scheduler, processScheduler, { ...connection, concurrency: 1 }),
  ];

  for (const w of workers) {
    w.on("completed", (job) => logger.debug({ queue: w.name, jobId: job.id }, "job.completed"));
    w.on("failed", (job, err) =>
      logger.error({ queue: w.name, jobId: job?.id, err: err.message }, "job.failed"),
    );
  }

  // Self-registering repeatable scheduler tick.
  const everyMinutes = Number(process.env.SYNC_INTERVAL_MINUTES ?? 5);
  schedulerQueue
    .add(
      "fan-out-poll",
      { kind: "fan-out-poll" },
      {
        ...jobDefaults,
        repeat: { every: everyMinutes * 60_000 },
        jobId: "scheduler:fan-out-poll",
      },
    )
    .catch((e) => logger.error({ err: e }, "scheduler.register.failed"));

  logger.info({ everyMinutes }, "workers.started");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "workers.shutdown");
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
