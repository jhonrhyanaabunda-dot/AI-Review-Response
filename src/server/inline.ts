/**
 * Inline (no-queue) execution shims for prototype/demo mode.
 *
 * In production, regenerate and publish are enqueued onto BullMQ and a
 * separate worker fleet processes them. For demos we don't want to require
 * Redis + worker just to see the UI in action — so when DEMO_MODE is on
 * (or REDIS is unreachable), the API routes run the agent and publish steps
 * synchronously inside the request handler.
 */
import { runAgent } from "@/agents/graph";
import { logger } from "@/lib/utils/logger";
import { prisma } from "@/lib/db/prisma";
import {
  ActivityKind,
  ResponseStatus,
  ReviewStatus,
} from "@prisma/client";

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  // No Redis configured → default to demo/inline mode.
  return !process.env.REDIS_URL || process.env.REDIS_URL.includes("localhost:6379")
    ? true
    : false;
}

/**
 * Regenerate the active draft for a review. In demo mode this runs the
 * agent graph inline (~1-3s). In real mode this enqueues a job.
 */
export async function regenerateInline(reviewId: string, organizationId: string) {
  logger.info({ reviewId }, "inline.regenerate.start");
  const state = await runAgent({ reviewId, organizationId });
  logger.info({ reviewId, next: state.next }, "inline.regenerate.done");
  return state;
}

/**
 * Mock-publish: marks the approved response as PUBLISHED and the review
 * as RESPONDED. In prod the worker would call the provider's reply API;
 * here we simulate that to keep the demo end-to-end without external creds.
 */
export async function publishInline(reviewId: string) {
  const response = await prisma.aiResponse.findFirst({
    where: {
      reviewId,
      supersededAt: null,
      status: ResponseStatus.APPROVED,
    },
  });
  if (!response) return null;

  const updated = await prisma.aiResponse.update({
    where: { id: response.id },
    data: {
      status: ResponseStatus.PUBLISHED,
      publishedAt: new Date(),
      publishError: null,
    },
    include: { review: { select: { platform: true, organizationId: true } } },
  });

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: ReviewStatus.RESPONDED },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: updated.review.organizationId,
      reviewId,
      kind: ActivityKind.RESPONSE_PUBLISHED,
      message: `Published reply to ${updated.review.platform}`,
      metadata: { mode: "inline", platform: updated.review.platform },
    },
  });

  return updated;
}
