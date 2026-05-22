import type { AgentState, Node, NodeName } from "../types";
import { ingestNode } from "../nodes/ingest";
import { sentimentNode } from "../nodes/sentiment";
import { respondNode } from "../nodes/respond";
import { escalateNode } from "../nodes/escalate";
import { qaNode } from "../nodes/qa";
import { publishNode } from "../nodes/publish";
import { logger } from "@/lib/utils/logger";

/**
 * Minimal directed-graph executor. Each node returns a partial state with
 * `next` pointing to the next node (or "done" / "approval" to pause).
 * Pausing at "approval" releases control back to the queue worker which
 * waits on a human decision before resuming with a new job to "publish".
 */
const NODES: Record<NodeName, Node> = {
  ingest: ingestNode,
  sentiment: sentimentNode,
  respond: respondNode,
  escalate: escalateNode,
  qa: qaNode,
  publish: publishNode,
  approval: async (s) => s, // terminal until human acts
  done: async (s) => s,
};

const MAX_HOPS = 12;

export async function runAgent(
  initial: Partial<AgentState> & { reviewId: string },
  start: NodeName = "ingest",
): Promise<AgentState> {
  let state = initial as AgentState;
  let cursor: NodeName = start;

  for (let i = 0; i < MAX_HOPS; i++) {
    logger.debug({ reviewId: state.reviewId, node: cursor }, "agent.run");
    const node = NODES[cursor];
    if (!node) throw new Error(`unknown node: ${cursor}`);
    state = await node(state);
    const next = state.next ?? "done";
    if (next === "done" || next === "approval") {
      return state;
    }
    cursor = next as NodeName;
  }
  throw new Error("agent exceeded max hops");
}
