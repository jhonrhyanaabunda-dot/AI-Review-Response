/**
 * Per-visitor demo state, persisted in a single base64-JSON cookie.
 *
 * Why a cookie: on Vercel the Node process resets across cold starts, so
 * approvals made during a sales demo would otherwise vanish if the visitor
 * idled and the function went cold. Storing the diff in a cookie pins the
 * state to the browser session for as long as the visitor has the tab open.
 *
 * Budget: cookies max out at ~4 KB. We cap decisions at 80 events and
 * regenerated bodies at the most-recent 12 - safely under the limit.
 */
import type { ResponseStatus, ReviewStatus } from "@prisma/client";

export const DEMO_COOKIE = "a3_demo_state";
const MAX_DECISIONS = 80;
const MAX_REGEN = 12;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type DemoDecision = "APPROVED" | "REJECTED";

export type DemoState = {
  // Most-recent first. Each entry overlays a review's response.
  decisions: Array<{ r: string; d: DemoDecision; t: number }>;
  // reviewId -> regenerated draft body (most recent only).
  regen: Record<string, string>;
  // Prospect slug for the per-prospect demo overlay.
  p?: string;
};

export const EMPTY_STATE: DemoState = { decisions: [], regen: {} };

export function decodeState(raw: string | undefined): DemoState {
  if (!raw) return EMPTY_STATE;
  try {
    const json = Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as DemoState;
    if (!Array.isArray(parsed.decisions)) return EMPTY_STATE;
    if (typeof parsed.regen !== "object" || parsed.regen == null) {
      parsed.regen = {};
    }
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

export function encodeState(state: DemoState): string {
  // Cap entries to stay under the 4 KB cookie ceiling.
  const trimmed: DemoState = {
    decisions: state.decisions.slice(0, MAX_DECISIONS),
    regen: Object.fromEntries(Object.entries(state.regen).slice(-MAX_REGEN)),
    p: state.p,
  };
  return Buffer.from(JSON.stringify(trimmed), "utf8").toString("base64");
}

export function cookieSerialize(state: DemoState): string {
  const value = encodeState(state);
  return `${DEMO_COOKIE}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function cookieClear(): string {
  return `${DEMO_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// ─────────────────────────── Reducers ───────────────────────────

export function withDecision(
  state: DemoState,
  reviewId: string,
  decision: DemoDecision,
): DemoState {
  return {
    ...state,
    decisions: [
      { r: reviewId, d: decision, t: Date.now() },
      ...state.decisions.filter((x) => x.r !== reviewId),
    ],
  };
}

export function withRegen(state: DemoState, reviewId: string, body: string): DemoState {
  return {
    ...state,
    regen: { ...state.regen, [reviewId]: body.slice(0, 1200) },
  };
}

export function withProspect(state: DemoState, slug: string | undefined): DemoState {
  return { ...state, p: slug };
}

// ─────────────────────────── Overlay helpers ───────────────────────────

export type OverlayShape = {
  responseStatus: ResponseStatus;
  reviewStatus: ReviewStatus;
  finalBody: string | null;
  publishedAt: Date | null;
  draftBody?: string;
};

export function overlayForReview(
  state: DemoState,
  reviewId: string,
  base: { responseStatus: ResponseStatus; reviewStatus: ReviewStatus },
): OverlayShape {
  const decision = state.decisions.find((d) => d.r === reviewId);
  const regenBody = state.regen[reviewId];

  if (decision?.d === "APPROVED") {
    return {
      responseStatus: "PUBLISHED",
      reviewStatus: "RESPONDED",
      finalBody: regenBody ?? null,
      publishedAt: new Date(decision.t),
      draftBody: regenBody,
    };
  }
  if (decision?.d === "REJECTED") {
    return {
      responseStatus: "REJECTED",
      reviewStatus: "IGNORED",
      finalBody: null,
      publishedAt: null,
      draftBody: regenBody,
    };
  }
  return {
    responseStatus: base.responseStatus,
    reviewStatus: base.reviewStatus,
    finalBody: null,
    publishedAt: null,
    draftBody: regenBody,
  };
}
