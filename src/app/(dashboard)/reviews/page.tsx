import { requirePermission } from "@/server/rbac/guard";
import { listReviews, reviewListStats } from "@/lib/demo/store";
import { reviewFilterSchema } from "@/lib/validation";
import { ReviewsClient } from "./reviews-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await requirePermission("reviews:read");
  const sp = await searchParams;
  const filter = reviewFilterSchema.parse(sp);
  const scopedFilter = {
    ...filter,
    ...(ctx.dealershipId ? { dealershipId: ctx.dealershipId } : {}),
  };
  const [{ items, nextCursor }, stats] = await Promise.all([
    listReviews(scopedFilter, sp.cursor, 50),
    reviewListStats(scopedFilter),
  ]);

  return (
    <ReviewsClient
      initial={items}
      initialNextCursor={nextCursor}
      filter={filter}
      stats={stats}
    />
  );
}
