import type { Sentiment } from "@prisma/client";

/**
 * The full state object that flows through the agent graph.
 * Nodes read from and write to this shared state; the graph driver
 * persists checkpoints back to the database between hops.
 */
export type AgentState = {
  reviewId: string;
  organizationId: string;
  dealershipId: string;
  // hydrated context
  review: {
    rating: number;
    title?: string | null;
    body: string;
    platform: string;
    authorName?: string | null;
    postedAt: Date;
  };
  dealership: {
    name: string;
    brand?: string | null;
    tonePreset: string;
    customTone?: string | null;
    aiInstructions?: string | null;
    signOff?: string | null;
    escalationKeywords: string[];
    autoPublishThreshold: number;
    requireApproval: boolean;
  };
  // produced as the graph executes
  sentiment?: Sentiment;
  legalRisk?: boolean;
  containsPii?: boolean;
  escalate?: { reason: string; matched: string[] };
  draftBody?: string;
  finalBody?: string;
  confidence?: number;
  flaggedReasons?: string[];
  model?: string;
  promptVersion?: string;
  tokensIn?: number;
  tokensOut?: number;
  // routing
  next?: "sentiment" | "respond" | "escalate" | "qa" | "publish" | "approval" | "done";
};

export type NodeName =
  | "ingest"
  | "sentiment"
  | "respond"
  | "escalate"
  | "qa"
  | "publish"
  | "approval"
  | "done";

export type Node = (state: AgentState) => Promise<AgentState>;
