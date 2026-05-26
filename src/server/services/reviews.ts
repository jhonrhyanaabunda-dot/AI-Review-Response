import type { ReviewFilter as ZodReviewFilter } from "@/lib/validation";
import {
  listReviews as listReviewsFromStore,
  getReviewDetail as getReviewDetailFromStore,
  type DemoReviewRow,
  type DemoReviewDetail,
} from "@/lib/demo/store";

export type ReviewListResult = {
  items: DemoReviewRow[];
  nextCursor?: string;
};

export async function listReviews(
  _organizationId: string,
  filter: ZodReviewFilter,
  cursor: string | undefined,
  limit: number,
  scope: { dealershipId?: string | null } = {},
): Promise<ReviewListResult> {
  const merged = {
    ...filter,
    ...(scope.dealershipId ? { dealershipId: scope.dealershipId } : {}),
  };
  return listReviewsFromStore(merged, cursor, limit);
}

export async function getReviewDetail(
  _organizationId: string,
  reviewId: string,
): Promise<DemoReviewDetail | null> {
  return getReviewDetailFromStore(reviewId);
}
