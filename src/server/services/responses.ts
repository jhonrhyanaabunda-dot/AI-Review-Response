/**
 * Mutation services. In demo mode the "persistence" is the visitor's
 * a3_demo_state cookie - so each handler returns both the result AND
 * the new cookie state, and the route serializes one Set-Cookie header.
 */
import { cookies } from "next/headers";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import {
  reviewExists,
  findResponseById,
} from "@/lib/demo/store";
import {
  DEMO_COOKIE,
  decodeState,
  withDecision,
  withRegen,
  type DemoState,
  type DemoDecision,
} from "@/lib/demo/state-cookie";

async function readState(): Promise<DemoState> {
  const jar = await cookies();
  return decodeState(jar.get(DEMO_COOKIE)?.value);
}

export async function decide(args: {
  organizationId: string;
  reviewId: string;
  actorId: string;
  decision: DemoDecision;
  comment?: string;
  finalBody?: string;
}): Promise<{ state: DemoState; result: { id: string; status: string; finalBody?: string } }> {
  if (!reviewExists(args.reviewId)) throw new NotFoundError("Review not found");

  const state = await readState();
  let nextState = withDecision(state, args.reviewId, args.decision);

  if (args.decision === "APPROVED" && args.finalBody?.trim()) {
    nextState = withRegen(nextState, args.reviewId, args.finalBody.trim());
  }

  const response = findResponseById(`resp-${args.reviewId.replace(/^r-/, "")}`);
  const responseId = response?.id ?? `resp-${args.reviewId}`;

  return {
    state: nextState,
    result: {
      id: responseId,
      status: args.decision === "APPROVED" ? "PUBLISHED" : "REJECTED",
      finalBody: args.finalBody,
    },
  };
}

export async function bulkApprove(args: {
  organizationId: string;
  reviewIds: string[];
  actorId: string;
}): Promise<{ state: DemoState; result: { approved: number } }> {
  let state = await readState();
  let approved = 0;
  for (const reviewId of args.reviewIds) {
    if (!reviewExists(reviewId)) continue;
    state = withDecision(state, reviewId, "APPROVED");
    approved += 1;
  }
  if (approved === 0) throw new ConflictError("Nothing to approve");
  return { state, result: { approved } };
}

export async function regenerate(args: {
  organizationId: string;
  reviewId: string;
  actorId: string;
  newBody: string;
}): Promise<{ state: DemoState }> {
  if (!reviewExists(args.reviewId)) throw new NotFoundError("Review not found");
  const state = await readState();
  return { state: withRegen(state, args.reviewId, args.newBody) };
}
