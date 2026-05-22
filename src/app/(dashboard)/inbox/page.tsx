import { requirePermission } from "@/server/rbac/guard";
import { prisma } from "@/lib/db/prisma";
import { ResponseStatus } from "@prisma/client";
import { InboxClient } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const ctx = await requirePermission("responses:read");
  const tenantWhere = {
    organizationId: ctx.organizationId,
    ...(ctx.dealershipId ? { dealershipId: ctx.dealershipId } : {}),
  };

  const [items, recent] = await Promise.all([
    prisma.review.findMany({
      where: {
        ...tenantWhere,
        responses: {
          some: {
            supersededAt: null,
            status: { in: [ResponseStatus.PENDING_APPROVAL, ResponseStatus.DRAFT] },
          },
        },
      },
      take: 50,
      orderBy: [{ postedAt: "desc" }],
      select: {
        id: true,
        platform: true,
        rating: true,
        authorName: true,
        body: true,
        postedAt: true,
        status: true,
        sentiment: true,
        externalUrl: true,
        dealership: { select: { name: true } },
        responses: {
          where: { supersededAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            draftBody: true,
            finalBody: true,
            confidence: true,
            flaggedReasons: true,
          },
        },
      },
    }),
    prisma.aiResponse.findMany({
      where: {
        ...tenantWhere,
        status: ResponseStatus.PUBLISHED,
        publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: 6,
      orderBy: { publishedAt: "desc" },
      select: {
        reviewId: true,
        publishedAt: true,
        review: {
          select: {
            platform: true,
            authorName: true,
            dealership: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const published = recent
    .filter((r) => r.publishedAt)
    .map((r) => ({
      reviewId: r.reviewId,
      platform: r.review.platform,
      authorName: r.review.authorName,
      dealership: r.review.dealership.name,
      publishedAt: r.publishedAt!,
    }));

  return <InboxClient items={items} published={published} />;
}
