import { prisma } from "@/lib/db/prisma";
import { ActivityKind, ResponseStatus } from "@prisma/client";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import { isDemoMode, publishInline, regenerateInline } from "@/server/inline";
import { logger } from "@/lib/utils/logger";

export async function regenerate(args: {
  organizationId: string;
  reviewId: string;
  actorId: string;
}) {
  const review = await prisma.review.findFirst({
    where: { id: args.reviewId, organizationId: args.organizationId },
    select: { id: true },
  });
  if (!review) throw new NotFoundError("Review not found");

  if (isDemoMode()) {
    await regenerateInline(review.id, args.organizationId);
    return;
  }
  // Lazy-load to avoid Redis connection at import time in demo mode.
  const { generateResponseQueue, jobDefaults } = await import("@/workers/queues");
  await generateResponseQueue.add(
    "generate",
    { reviewId: review.id, organizationId: args.organizationId },
    { ...jobDefaults, jobId: `generate:${review.id}:${Date.now()}` },
  );
}

export async function decide(args: {
  organizationId: string;
  reviewId: string;
  actorId: string;
  decision: "APPROVED" | "REJECTED";
  comment?: string;
  finalBody?: string;
}) {
  const draft = await prisma.aiResponse.findFirst({
    where: {
      reviewId: args.reviewId,
      organizationId: args.organizationId,
      supersededAt: null,
      status: { in: [ResponseStatus.PENDING_APPROVAL, ResponseStatus.DRAFT] },
    },
  });
  if (!draft) throw new NotFoundError("No pending response to decide on");

  if (args.decision === "REJECTED") {
    await prisma.$transaction([
      prisma.aiResponse.update({
        where: { id: draft.id },
        data: { status: ResponseStatus.REJECTED },
      }),
      prisma.approval.create({
        data: {
          organizationId: args.organizationId,
          responseId: draft.id,
          actorId: args.actorId,
          decision: ResponseStatus.REJECTED,
          comment: args.comment,
        },
      }),
      prisma.activityLog.create({
        data: {
          organizationId: args.organizationId,
          actorId: args.actorId,
          reviewId: args.reviewId,
          kind: ActivityKind.RESPONSE_REJECTED,
          metadata: { responseId: draft.id, comment: args.comment ?? null },
        },
      }),
    ]);
    return { id: draft.id, status: "REJECTED" as const };
  }

  const finalBody = args.finalBody?.trim() || draft.draftBody;
  const edited = finalBody !== draft.draftBody;

  await prisma.$transaction([
    prisma.aiResponse.update({
      where: { id: draft.id },
      data: {
        status: ResponseStatus.APPROVED,
        finalBody,
        editedById: edited ? args.actorId : draft.editedById,
      },
    }),
    prisma.approval.create({
      data: {
        organizationId: args.organizationId,
        responseId: draft.id,
        actorId: args.actorId,
        decision: ResponseStatus.APPROVED,
        comment: args.comment,
      },
    }),
    prisma.activityLog.create({
      data: {
        organizationId: args.organizationId,
        actorId: args.actorId,
        reviewId: args.reviewId,
        kind: edited ? ActivityKind.RESPONSE_EDITED : ActivityKind.RESPONSE_APPROVED,
        metadata: { responseId: draft.id, edited },
      },
    }),
  ]);

  if (isDemoMode()) {
    try {
      await publishInline(args.reviewId);
    } catch (e) {
      logger.error({ err: e, reviewId: args.reviewId }, "inline.publish.failed");
    }
  } else {
    const { publishResponseQueue, jobDefaults } = await import("@/workers/queues");
    await publishResponseQueue.add(
      "publish",
      {
        responseId: draft.id,
        reviewId: args.reviewId,
        organizationId: args.organizationId,
      },
      { ...jobDefaults, jobId: `publish:${draft.id}` },
    );
  }

  return { id: draft.id, status: "APPROVED" as const, finalBody };
}

export async function bulkApprove(args: {
  organizationId: string;
  reviewIds: string[];
  actorId: string;
}) {
  const drafts = await prisma.aiResponse.findMany({
    where: {
      organizationId: args.organizationId,
      reviewId: { in: args.reviewIds },
      supersededAt: null,
      status: ResponseStatus.PENDING_APPROVAL,
    },
  });
  if (drafts.length === 0) throw new ConflictError("Nothing to approve");

  for (const d of drafts) {
    await decide({
      organizationId: args.organizationId,
      reviewId: d.reviewId,
      actorId: args.actorId,
      decision: "APPROVED",
    });
  }
  return { approved: drafts.length };
}
