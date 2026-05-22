import { prisma } from "@/lib/db/prisma";
import { Sentiment } from "@prisma/client";
import { chatJson } from "../openai";
import { SENTIMENT_SYSTEM } from "../prompts/system";
import type { AgentState, Node } from "../types";

type SentimentOut = {
  sentiment: keyof typeof Sentiment;
  legalRisk: boolean;
  containsPii: boolean;
  summary: string;
  keywords: string[];
};

export const sentimentNode: Node = async (state) => {
  const userPrompt = [
    `Review platform: ${state.review.platform}`,
    `Rating: ${state.review.rating}/5`,
    state.review.title ? `Title: ${state.review.title}` : "",
    `Body:\n${state.review.body}`,
  ]
    .filter(Boolean)
    .join("\n");

  const out = await chatJson<SentimentOut>({
    system: SENTIMENT_SYSTEM,
    user: userPrompt,
    temperature: 0,
  });

  await prisma.review.update({
    where: { id: state.reviewId },
    data: { sentiment: Sentiment[out.sentiment] },
  });

  const next: AgentState["next"] =
    out.legalRisk || out.sentiment === "ANGRY" ? "escalate" : "respond";

  return {
    ...state,
    sentiment: Sentiment[out.sentiment],
    legalRisk: out.legalRisk,
    containsPii: out.containsPii,
    next,
  };
};
