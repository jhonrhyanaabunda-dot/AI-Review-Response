import { prisma } from "@/lib/db/prisma";
import { ResponseStatus, ReviewStatus } from "@prisma/client";

export type AnalyticsRange = { from: Date; to: Date };

export async function dashboardSummary(
  organizationId: string,
  range: AnalyticsRange,
  scope: { dealershipId?: string | null } = {},
) {
  const where = {
    organizationId,
    ...(scope.dealershipId ? { dealershipId: scope.dealershipId } : {}),
    postedAt: { gte: range.from, lte: range.to },
  };

  const [
    totalReviews,
    avgRatingAgg,
    sentimentGroups,
    statusGroups,
    publishedCount,
    approvedCount,
    pendingCount,
    escalated,
  ] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
    prisma.review.groupBy({
      by: ["sentiment"],
      where,
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.aiResponse.count({
      where: {
        organizationId,
        publishedAt: { gte: range.from, lte: range.to },
        status: ResponseStatus.PUBLISHED,
      },
    }),
    prisma.aiResponse.count({
      where: {
        organizationId,
        status: ResponseStatus.APPROVED,
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.aiResponse.count({
      where: {
        organizationId,
        status: ResponseStatus.PENDING_APPROVAL,
        supersededAt: null,
      },
    }),
    prisma.escalation.count({
      where: { organizationId, createdAt: { gte: range.from, lte: range.to } },
    }),
  ]);

  return {
    totalReviews,
    averageRating: avgRatingAgg._avg.rating ?? 0,
    sentiment: Object.fromEntries(sentimentGroups.map((s) => [s.sentiment ?? "UNCLASSIFIED", s._count._all])),
    status: Object.fromEntries(statusGroups.map((s) => [s.status, s._count._all])),
    publishedCount,
    approvedCount,
    pendingCount,
    escalated,
    aiApprovalRate:
      approvedCount + publishedCount > 0
        ? publishedCount / (publishedCount + approvedCount)
        : 0,
  };
}

export async function ratingTrend(
  organizationId: string,
  range: AnalyticsRange,
  scope: { dealershipId?: string | null } = {},
) {
  // Branch on parameterization to keep the query 100% bound — never
  // interpolate identifiers from variables into the SQL string.
  const rows = scope.dealershipId
    ? await prisma.$queryRaw<Array<{ day: Date; avg: number; count: bigint }>>`
        SELECT date_trunc('day', "postedAt") AS day,
               AVG(rating)::float AS avg,
               COUNT(*)::bigint AS count
        FROM "Review"
        WHERE "organizationId" = ${organizationId}
          AND "dealershipId" = ${scope.dealershipId}
          AND "postedAt" BETWEEN ${range.from} AND ${range.to}
        GROUP BY 1
        ORDER BY 1 ASC
      `
    : await prisma.$queryRaw<Array<{ day: Date; avg: number; count: bigint }>>`
        SELECT date_trunc('day', "postedAt") AS day,
               AVG(rating)::float AS avg,
               COUNT(*)::bigint AS count
        FROM "Review"
        WHERE "organizationId" = ${organizationId}
          AND "postedAt" BETWEEN ${range.from} AND ${range.to}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

  return rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    avg: Number(r.avg.toFixed(2)),
    count: Number(r.count),
  }));
}

export async function dealershipBreakdown(organizationId: string, range: AnalyticsRange) {
  const rows = await prisma.review.groupBy({
    by: ["dealershipId"],
    where: { organizationId, postedAt: { gte: range.from, lte: range.to } },
    _count: { _all: true },
    _avg: { rating: true },
  });
  const dealerships = await prisma.dealership.findMany({
    where: { organizationId, id: { in: rows.map((r) => r.dealershipId) } },
    select: { id: true, name: true, brand: true },
  });
  const lookup = new Map(dealerships.map((d) => [d.id, d]));
  return rows.map((r) => ({
    dealership: lookup.get(r.dealershipId) ?? null,
    reviews: r._count._all,
    avgRating: r._avg.rating ?? 0,
  }));
}

export async function responseTimeP50(
  organizationId: string,
  range: AnalyticsRange,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ p50: number | null }>>`
    SELECT
      percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (a."publishedAt" - r."postedAt"))
      ) AS p50
    FROM "AiResponse" a
    JOIN "Review" r ON r.id = a."reviewId"
    WHERE a."organizationId" = ${organizationId}
      AND a."publishedAt" IS NOT NULL
      AND r."postedAt" BETWEEN ${range.from} AND ${range.to}
  `;
  return rows[0]?.p50 ?? 0;
}

export { ReviewStatus };
