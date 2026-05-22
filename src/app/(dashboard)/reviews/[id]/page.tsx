import { notFound } from "next/navigation";
import { requirePermission } from "@/server/rbac/guard";
import { getReviewDetail } from "@/server/services/reviews";
import { ReviewDetailClient } from "./detail-client";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("reviews:read");
  const { id } = await params;
  const review = await getReviewDetail(ctx.organizationId, id);
  if (!review) notFound();
  if (ctx.dealershipId && review.dealershipId !== ctx.dealershipId) notFound();

  return <ReviewDetailClient review={review} />;
}
