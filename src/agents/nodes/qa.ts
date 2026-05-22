import { prisma } from "@/lib/db/prisma";
import { ResponseStatus } from "@prisma/client";
import { chatJson } from "../openai";
import { QA_SYSTEM } from "../prompts/system";
import type { AgentState, Node } from "../types";

type QaOut = {
  pass: boolean;
  revisedBody: string;
  issues: string[];
};

/**
 * Runs a second-pass editor model. If the editor revises the body, we update
 * the active AiResponse draft. After QA we decide between auto-publish and
 * approval based on dealership policy.
 */
export const qaNode: Node = async (state) => {
  const user = [
    `Tone preset: ${state.dealership.tonePreset}`,
    state.dealership.aiInstructions
      ? `Custom instructions: ${state.dealership.aiInstructions}`
      : "",
    `Original review:\n${state.review.body}`,
    `Draft response:\n${state.draftBody ?? ""}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const out = await chatJson<QaOut>({
    system: QA_SYSTEM,
    user,
    temperature: 0,
  });

  const updated = out.revisedBody?.trim() || state.draftBody || "";
  const flagged = [...(state.flaggedReasons ?? []), ...out.issues];

  await prisma.aiResponse.updateMany({
    where: { reviewId: state.reviewId, supersededAt: null },
    data: {
      draftBody: updated,
      flaggedReasons: flagged,
    },
  });

  // Routing: auto-publish if policy allows and we're highly confident.
  const allowAutoPublish =
    !state.dealership.requireApproval &&
    !state.legalRisk &&
    !state.containsPii &&
    out.pass &&
    (state.confidence ?? 0) >= 0.8 &&
    state.review.rating >= state.dealership.autoPublishThreshold;

  if (allowAutoPublish) {
    await prisma.aiResponse.updateMany({
      where: { reviewId: state.reviewId, supersededAt: null },
      data: { status: ResponseStatus.APPROVED, finalBody: updated },
    });
    return { ...state, draftBody: updated, finalBody: updated, next: "publish" };
  }

  await prisma.aiResponse.updateMany({
    where: { reviewId: state.reviewId, supersededAt: null },
    data: { status: ResponseStatus.PENDING_APPROVAL },
  });

  return { ...state, draftBody: updated, next: "approval" };
};
