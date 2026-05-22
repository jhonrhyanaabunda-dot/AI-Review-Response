import { prisma } from "@/lib/db/prisma";
import { ActivityKind, ResponseStatus } from "@prisma/client";
import { chatJson } from "../openai";
import { PROMPT_VERSION, RESPONSE_SYSTEM } from "../prompts/system";
import type { AgentState, Node } from "../types";

type RespondOut = {
  body: string;
  confidence: number;
  flaggedReasons: string[];
};

function toneInstruction(state: AgentState): string {
  switch (state.dealership.tonePreset) {
    case "LUXURY":
      return "Use a refined, gracious, premium tone. Subtle, warm, never effusive.";
    case "FRIENDLY":
      return "Use a warm, conversational, approachable tone. Use the reviewer's first name.";
    case "CORPORATE":
      return "Use a polished, professional, brand-safe tone. No slang or casualisms.";
    case "OEM_COMPLIANT":
      return `Follow ${state.dealership.brand ?? "OEM"} brand voice guidelines: factual,
        on-brand, no slogans, no promotional language, no unverified claims.`;
    case "CUSTOM":
      return state.dealership.customTone ?? "Use a friendly, professional tone.";
    default:
      return "Use a friendly, professional tone.";
  }
}

export const respondNode: Node = async (state) => {
  const userPrompt = [
    `Dealership: ${state.dealership.name}${state.dealership.brand ? ` (${state.dealership.brand})` : ""}`,
    `Tone: ${state.dealership.tonePreset}`,
    `Tone guidance: ${toneInstruction(state)}`,
    state.dealership.aiInstructions
      ? `Custom instructions: ${state.dealership.aiInstructions}`
      : "",
    state.dealership.signOff ? `Sign off as: ${state.dealership.signOff}` : "",
    "",
    `Reviewer name: ${state.review.authorName ?? "Unknown"}`,
    `Rating: ${state.review.rating}/5`,
    `Platform: ${state.review.platform}`,
    state.review.title ? `Review title: ${state.review.title}` : "",
    `Review body:\n${state.review.body}`,
  ]
    .filter(Boolean)
    .join("\n");

  const out = await chatJson<RespondOut>({
    system: RESPONSE_SYSTEM,
    user: userPrompt,
    temperature: 0.4,
  });

  // mark prior drafts as superseded
  await prisma.aiResponse.updateMany({
    where: { reviewId: state.reviewId, supersededAt: null },
    data: { supersededAt: new Date() },
  });

  await prisma.aiResponse.create({
    data: {
      organizationId: state.organizationId,
      reviewId: state.reviewId,
      status: ResponseStatus.DRAFT,
      draftBody: out.body,
      sentiment: state.sentiment ?? null,
      confidence: out.confidence,
      legalRisk: state.legalRisk ?? false,
      containsPii: state.containsPii ?? false,
      flaggedReasons: out.flaggedReasons ?? [],
      model: out._meta.model,
      promptVersion: PROMPT_VERSION,
      tokensIn: out._meta.tokensIn,
      tokensOut: out._meta.tokensOut,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: state.organizationId,
      reviewId: state.reviewId,
      kind: ActivityKind.RESPONSE_GENERATED,
      metadata: {
        confidence: out.confidence,
        model: out._meta.model,
        promptVersion: PROMPT_VERSION,
      },
    },
  });

  return {
    ...state,
    draftBody: out.body,
    confidence: out.confidence,
    flaggedReasons: out.flaggedReasons,
    model: out._meta.model,
    promptVersion: PROMPT_VERSION,
    tokensIn: out._meta.tokensIn,
    tokensOut: out._meta.tokensOut,
    next: "qa",
  };
};
