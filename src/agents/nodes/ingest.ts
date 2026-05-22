import { prisma } from "@/lib/db/prisma";
import type { AgentState, Node } from "../types";

/**
 * Loads the review + dealership configuration into the agent state.
 * Throws if the review or dealership has been deleted between
 * enqueue and execution — the worker will fail the job in that case.
 */
export const ingestNode: Node = async (state: AgentState) => {
  const review = await prisma.review.findUnique({
    where: { id: state.reviewId },
    include: { dealership: true },
  });
  if (!review) throw new Error(`review ${state.reviewId} not found`);

  return {
    ...state,
    organizationId: review.organizationId,
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
    next: "sentiment",
  };
};
