import { prisma } from "@/lib/db/prisma";
import {
  ActivityKind,
  ResponseStatus,
  ReviewStatus,
} from "@prisma/client";
import { getProvider } from "@/providers/base/registry";
import { decrypt } from "@/lib/crypto";
import { ProviderError } from "@/lib/utils/errors";
import type { AgentState, Node } from "../types";

/**
 * Publishes the approved response back to the source platform. Failures bump
 * publishAttempts and store the error; the queue will retry with backoff up to
 * the worker's policy. Non-retryable provider errors (401/403/404) terminate.
 */
export const publishNode: Node = async (state) => {
  const response = await prisma.aiResponse.findFirst({
    where: {
      reviewId: state.reviewId,
      supersededAt: null,
      status: ResponseStatus.APPROVED,
    },
  });
  if (!response) {
    return { ...state, next: "done" };
  }

  const review = await prisma.review.findUnique({
    where: { id: state.reviewId },
    include: { source: { include: { apiToken: true, location: true } } },
  });
  if (!review) throw new Error("review missing during publish");

  const provider = getProvider(review.platform);
  if (!provider.publishResponse) {
    // Platform does not support programmatic publish (e.g. Yelp).
    await prisma.aiResponse.update({
      where: { id: response.id },
      data: {
        status: ResponseStatus.PUBLISHED,
        publishedAt: new Date(),
        publishError: "manual:platform-does-not-support-auto-publish",
      },
    });
    return { ...state, next: "done" };
  }

  const tokenBlob = review.source.apiToken?.cipherText;
  const credentials = tokenBlob ? JSON.parse(decrypt(tokenBlob)) : {};
  const body = response.finalBody ?? response.draftBody;

  try {
    const result = await provider.publishResponse(
      {
        credentials,
        externalLocationId: review.source.externalId,
        config: (review.source.config as Record<string, unknown>) ?? {},
      },
      { reviewExternalId: review.externalId, responseBody: body },
    );

    await prisma.$transaction([
      prisma.aiResponse.update({
        where: { id: response.id },
        data: {
          status: ResponseStatus.PUBLISHED,
          publishedAt: result.publishedAt,
          publishError: null,
        },
      }),
      prisma.review.update({
        where: { id: state.reviewId },
        data: { status: ReviewStatus.RESPONDED },
      }),
      prisma.activityLog.create({
        data: {
          organizationId: state.organizationId,
          reviewId: state.reviewId,
          kind: ActivityKind.RESPONSE_PUBLISHED,
          metadata: { externalResponseId: result.externalResponseId },
        },
      }),
    ]);

    return { ...state, next: "done" };
  } catch (err) {
    const retryable = err instanceof ProviderError ? err.retryable : true;
    const message = err instanceof Error ? err.message : String(err);

    await prisma.aiResponse.update({
      where: { id: response.id },
      data: {
        publishAttempts: { increment: 1 },
        publishError: message,
        status: retryable ? ResponseStatus.APPROVED : ResponseStatus.FAILED,
      },
    });
    await prisma.activityLog.create({
      data: {
        organizationId: state.organizationId,
        reviewId: state.reviewId,
        kind: ActivityKind.RESPONSE_FAILED,
        message: message.slice(0, 1000),
      },
    });
    throw err;
  }
};
