import type { Job } from "bullmq";
import { prisma } from "@/lib/db/prisma";
import {
  jobDefaults,
  syncReviewsQueue,
  type SchedulerJob,
} from "../queues";
import { logger } from "@/lib/utils/logger";

/**
 * Fan-out scheduler: on each tick, enqueue one poll job per active source.
 * Trigger this from BullMQ's repeatable jobs (every SYNC_INTERVAL_MINUTES).
 */
export async function processScheduler(_job: Job<SchedulerJob>) {
  const sources = await prisma.reviewSource.findMany({
    where: { isActive: true },
    select: { id: true, locationId: true, location: { select: { dealership: { select: { organizationId: true, id: true } } } } },
  });

  let enqueued = 0;
  for (const s of sources) {
    await syncReviewsQueue.add(
      "poll",
      {
        sourceId: s.id,
        organizationId: s.location.dealership.organizationId,
        dealershipId: s.location.dealership.id,
        kind: "poll",
      },
      { ...jobDefaults, jobId: `poll:${s.id}:${Math.floor(Date.now() / 60_000)}` },
    );
    enqueued += 1;
  }
  logger.info({ enqueued }, "scheduler.tick");
  return { enqueued };
}
