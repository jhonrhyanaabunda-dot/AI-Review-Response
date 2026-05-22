import { prisma } from "@/lib/db/prisma";
import { ActivityKind, EscalationSeverity, ResponseStatus, ReviewStatus } from "@prisma/client";
import type { AgentState, Node } from "../types";

function matchKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase()));
}

function severityFor(state: AgentState, matched: string[]): EscalationSeverity {
  if (state.legalRisk) return EscalationSeverity.CRITICAL;
  if (state.sentiment === "ANGRY" && state.review.rating <= 2) return EscalationSeverity.HIGH;
  if (matched.length > 0) return EscalationSeverity.MEDIUM;
  return EscalationSeverity.LOW;
}

/**
 * Creates an Escalation row, flips the Review to ESCALATED, and stops the
 * pipeline. The active AiResponse draft (if any) is marked ESCALATED so it
 * won't auto-publish. A human resolves and re-runs `respond` manually.
 */
export const escalateNode: Node = async (state) => {
  const text = `${state.review.title ?? ""}\n${state.review.body}`;
  const matched = matchKeywords(text, state.dealership.escalationKeywords);
  const severity = severityFor(state, matched);

  const reason = state.legalRisk
    ? "Legal risk detected by AI"
    : state.sentiment === "ANGRY"
      ? "Angry sentiment detected"
      : `Escalation keywords matched: ${matched.join(", ")}`;

  await prisma.$transaction([
    prisma.escalation.create({
      data: {
        organizationId: state.organizationId,
        dealershipId: state.dealershipId,
        reviewId: state.reviewId,
        severity,
        reason,
        matchedKeywords: matched,
      },
    }),
    prisma.review.update({
      where: { id: state.reviewId },
      data: { status: ReviewStatus.ESCALATED },
    }),
    prisma.aiResponse.updateMany({
      where: { reviewId: state.reviewId, supersededAt: null },
      data: { status: ResponseStatus.ESCALATED },
    }),
    prisma.activityLog.create({
      data: {
        organizationId: state.organizationId,
        reviewId: state.reviewId,
        kind: ActivityKind.ESCALATED,
        message: reason,
        metadata: { severity, matched },
      },
    }),
  ]);

  return { ...state, escalate: { reason, matched }, next: "done" };
};
