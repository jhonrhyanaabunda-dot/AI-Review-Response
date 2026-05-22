import { requirePermission } from "@/server/rbac/guard";
import { listReviews } from "@/server/services/reviews";
import { reviewFilterSchema } from "@/lib/validation";
import { ReviewsClient } from "./reviews-client";

export const dynamic = "force-dynamic";

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await requirePermission("reviews:read");
  const sp = await searchParams;
  const filter = reviewFilterSchema.parse(sp);
  const { items, nextCursor } = await listReviews(
    ctx.organizationId,
    filter,
    sp.cursor,
    50,
    { dealershipId: ctx.dealershipId },
  );

  return <ReviewsClient initial={items} initialNextCursor={nextCursor} filter={filter} />;
}
