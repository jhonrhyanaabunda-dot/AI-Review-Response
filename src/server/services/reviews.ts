import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import type { ReviewFilter } from "@/lib/validation";

export async function listReviews(
  organizationId: string,
  filter: ReviewFilter,
  cursor: string | undefined,
  limit: number,
  scope: { dealershipId?: string | null } = {},
) {
  const where: Prisma.ReviewWhereInput = {
    organizationId,
    ...(scope.dealershipId ? { dealershipId: scope.dealershipId } : {}),
    ...(filter.dealershipId ? { dealershipId: filter.dealershipId } : {}),
    ...(filter.platform ? { platform: filter.platform } : {}),
    ...(filter.sentiment ? { sentiment: filter.sentiment } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.rating ? { rating: filter.rating } : {}),
    ...(filter.q
      ? {
          OR: [
            { body: { contains: filter.q, mode: "insensitive" } },
            { title: { contains: filter.q, mode: "insensitive" } },
            { authorName: { contains: filter.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.review.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ postedAt: "desc" }, { id: "desc" }],
    include: {
      dealership: { select: { id: true, name: true, brand: true } },
      responses: {
        where: { supersededAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, -1) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
}

export async function getReviewDetail(organizationId: string, reviewId: string) {
  return prisma.review.findFirst({
    where: { id: reviewId, organizationId },
    include: {
      dealership: true,
      location: true,
      assignee: { select: { id: true, name: true, image: true } },
      notes: { orderBy: { createdAt: "desc" } },
      responses: { orderBy: { createdAt: "desc" } },
      escalations: { orderBy: { createdAt: "desc" } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}
