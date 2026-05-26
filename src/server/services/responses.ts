import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import {
  decideReview,
  bulkApproveReviews,
  regenerateResponse,
} from "@/lib/demo/store";

export async function regenerate(args: {
  organizationId: string;
  reviewId: string;
  actorId: string;
}) {
  const next = regenerateResponse(args.reviewId);
  if (!next) throw new NotFoundError("Review not found");
}

export async function decide(args: {
  organizationId: string;
  reviewId: string;
  actorId: string;
  decision: "APPROVED" | "REJECTED";
  comment?: string;
  finalBody?: string;
}) {
  const result = decideReview({
    reviewId: args.reviewId,
    decision: args.decision,
    finalBody: args.finalBody,
  });
  if (!result) throw new NotFoundError("No pending response to decide on");
  return result;
}

export async function bulkApprove(args: {
  organizationId: string;
  reviewIds: string[];
  actorId: string;
}) {
  const result = bulkApproveReviews(args.reviewIds);
  if (result.approved === 0) throw new ConflictError("Nothing to approve");
  return result;
}
