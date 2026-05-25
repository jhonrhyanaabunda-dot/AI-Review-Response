import type { Job } from "bullmq";
import { prisma } from "@/lib/db/prisma";
import { publishNode } from "@/agents/nodes/publish";
import { logger } from "@/lib/utils/logger";
import type { AgentState } from "@/agents/types";
import type { PublishResponseJob } from "../queues";

/**
 * Publish-only worker. Hydrates just enough state for publishNode and
 * skips the rest of the agent graph - re-running sentiment/respond after
 * a human approval would regenerate the body and supersede the approved
 * draft, which is exactly what we don't want.
 */
export async function processPublishResponse(job: Job<PublishResponseJob>) {
  const { reviewId, organizationId } = job.data;
  const log = logger.child({ jobId: job.id, reviewId });

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { dealership: true },
  });
  if (!review) throw new Error(`review ${reviewId} not found during publish`);

  const state: AgentState = {
    reviewId,
    organizationId,
    dealershipId: review.dealershipId,
    review: {
      rating: review.rating,
      title: review.title,
      body: review.body,
      platform: review.platform,
      authorName: review.authorName,
      postedAt: review.postedAt,
    },
    dealership: {
      name: review.dealership.name,
      brand: review.dealership.brand,
      tonePreset: review.dealership.tonePreset,
      customTone: review.dealership.customTone,
      aiInstructions: review.dealership.aiInstructions,
      signOff: review.dealership.signOff,
      escalationKeywords: review.dealership.escalationKeywords,
      autoPublishThreshold: review.dealership.autoPublishThreshold,
      requireApproval: review.dealership.requireApproval,
    },
  };

  const result = await publishNode(state);
  log.info({ next: result.next }, "publish.completed");
  return { next: result.next };
}
