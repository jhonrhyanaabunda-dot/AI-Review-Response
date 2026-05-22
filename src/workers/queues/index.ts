import { Queue, QueueEvents } from "bullmq";
import { redis } from "@/lib/redis/client";

export const QUEUE_NAMES = {
  syncReviews: "sync-reviews",
  generateResponse: "generate-response",
  publishResponse: "publish-response",
  scheduler: "scheduler",
} as const;

export type SyncReviewsJob = {
  sourceId: string;
  organizationId: string;
  dealershipId: string;
  kind: "poll" | "backfill" | "webhook";
};

export type GenerateResponseJob = {
  reviewId: string;
  organizationId: string;
};

export type PublishResponseJob = {
  responseId: string;
  reviewId: string;
  organizationId: string;
};

export type SchedulerJob = {
  kind: "fan-out-poll";
};

const connection = { connection: redis };

export const syncReviewsQueue = new Queue<SyncReviewsJob>(QUEUE_NAMES.syncReviews, connection);
export const generateResponseQueue = new Queue<GenerateResponseJob>(QUEUE_NAMES.generateResponse, connection);
export const publishResponseQueue = new Queue<PublishResponseJob>(QUEUE_NAMES.publishResponse, connection);
export const schedulerQueue = new Queue<SchedulerJob>(QUEUE_NAMES.scheduler, connection);

export const queueEvents = {
  syncReviews: new QueueEvents(QUEUE_NAMES.syncReviews, connection),
  generateResponse: new QueueEvents(QUEUE_NAMES.generateResponse, connection),
  publishResponse: new QueueEvents(QUEUE_NAMES.publishResponse, connection),
};

const DEFAULT_JOB_OPTS = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 2_000 },
  removeOnComplete: { age: 24 * 3600, count: 5_000 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

export const jobDefaults = DEFAULT_JOB_OPTS;
