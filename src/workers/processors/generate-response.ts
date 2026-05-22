import type { Job } from "bullmq";
import { prisma } from "@/lib/db/prisma";
import { ResponseStatus, ReviewStatus } from "@prisma/client";
import { runAgent } from "@/agents/graph";
import { logger } from "@/lib/utils/logger";
import {
  jobDefaults,
  publishResponseQueue,
  type GenerateResponseJob,
} from "../queues";

export async function processGenerateResponse(job: Job<GenerateResponseJob>) {
  const { reviewId, organizationId } = job.data;
  const log = logger.child({ jobId: job.id, reviewId });

  // mark review IN_PROGRESS so the inbox shows it's being worked
  await prisma.review.update({
    where: { id: reviewId },
    data: { status: ReviewStatus.IN_PROGRESS },
  });

  const state = await runAgent({ reviewId, organizationId });

  if (state.next === "done" && !state.escalate && state.finalBody) {
    // auto-publish path
    const draft = await prisma.aiResponse.findFirst({
      where: { reviewId, supersededAt: null, status: ResponseStatus.APPROVED },
    });
    if (draft) {
      await publishResponseQueue.add(
        "publish",
        { responseId: draft.id, reviewId, organizationId },
        { ...jobDefaults, jobId: `publish:${draft.id}` },
      );
    }
  }

  log.info({ result: state.next }, "agent.completed");
  return { node: state.next, escalated: !!state.escalate };
}
