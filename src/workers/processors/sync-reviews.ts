import type { Job } from "bullmq";
import { prisma } from "@/lib/db/prisma";
import { ActivityKind, ReviewStatus, SyncJobStatus } from "@prisma/client";
import { decrypt } from "@/lib/crypto";
import { getProvider } from "@/providers/base/registry";
import { logger } from "@/lib/utils/logger";
import {
  generateResponseQueue,
  jobDefaults,
  type SyncReviewsJob,
} from "../queues";

export async function processSyncReviews(job: Job<SyncReviewsJob>) {
  const { sourceId, organizationId, dealershipId, kind } = job.data;
  const log = logger.child({ jobId: job.id, sourceId, kind });

  const syncRow = await prisma.syncJob.create({
    data: {
      organizationId,
      dealershipId,
      sourceId,
      platform: (await prisma.reviewSource.findUniqueOrThrow({ where: { id: sourceId } })).platform,
      kind,
      status: SyncJobStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  try {
    const source = await prisma.reviewSource.findUniqueOrThrow({
      where: { id: sourceId },
      include: { apiToken: true, location: { include: { dealership: true } } },
    });
    if (!source.isActive) {
      await prisma.syncJob.update({
        where: { id: syncRow.id },
        data: { status: SyncJobStatus.CANCELED, finishedAt: new Date() },
      });
      return { fetched: 0, created: 0 };
    }

    const provider = getProvider(source.platform);
    const credentials = source.apiToken?.cipherText
      ? JSON.parse(decrypt(source.apiToken.cipherText))
      : {};

    let cursor = kind === "backfill" ? undefined : source.lastSyncCursor ?? undefined;
    let totalFetched = 0;
    let totalCreated = 0;
    const since = source.lastSyncedAt ?? new Date(0);
    const lastSeen = source.lastSyncedAt;

    // Cap pages per run so we don't hold one job forever on a slow API.
    for (let page = 0; page < 10; page++) {
      const result = await provider.fetchSince(
        {
          credentials,
          externalLocationId: source.externalId,
          config: (source.config as Record<string, unknown>) ?? {},
        },
        cursor,
      );
      totalFetched += result.reviews.length;

      // Stop early if we've drifted past the last-synced timestamp for incremental syncs.
      const fresh =
        kind === "backfill"
          ? result.reviews
          : result.reviews.filter((r) => r.postedAt > since);

      for (const r of fresh) {
        const created = await prisma.review.upsert({
          where: { platform_externalId: { platform: r.platform, externalId: r.externalId } },
          create: {
            organizationId,
            dealershipId,
            locationId: source.locationId,
            sourceId: source.id,
            platform: r.platform,
            externalId: r.externalId,
            externalUrl: r.externalUrl,
            authorName: r.authorName,
            authorAvatarUrl: r.authorAvatarUrl,
            rating: r.rating,
            title: r.title,
            body: r.body,
            language: r.language,
            postedAt: r.postedAt,
            raw: r.raw as object,
            status: ReviewStatus.NEW,
          },
          update: {
            // refresh in case the platform mutated the body / rating
            body: r.body,
            rating: r.rating,
            title: r.title,
            raw: r.raw as object,
          },
        });
        // Only enqueue AI response for newly-created NEW reviews
        if (created.status === ReviewStatus.NEW && !created.sentiment) {
          await generateResponseQueue.add(
            "generate",
            { reviewId: created.id, organizationId },
            { ...jobDefaults, jobId: `generate:${created.id}` },
          );
          totalCreated += 1;
        }
      }

      await prisma.activityLog.create({
        data: {
          organizationId,
          kind: ActivityKind.REVIEW_INGESTED,
          metadata: { sourceId, platform: source.platform, page, fetched: result.reviews.length },
        },
      });

      if (!result.nextCursor) break;
      cursor = result.nextCursor;
    }

    await prisma.reviewSource.update({
      where: { id: source.id },
      data: { lastSyncedAt: new Date(), lastSyncCursor: cursor ?? null },
    });

    await prisma.syncJob.update({
      where: { id: syncRow.id },
      data: {
        status: SyncJobStatus.SUCCEEDED,
        finishedAt: new Date(),
        itemsFetched: totalFetched,
        itemsNew: totalCreated,
      },
    });

    log.info({ totalFetched, totalCreated, lastSeen }, "sync.done");
    return { fetched: totalFetched, created: totalCreated };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncJob.update({
      where: { id: syncRow.id },
      data: { status: SyncJobStatus.FAILED, finishedAt: new Date(), error: message },
    });
    log.error({ err }, "sync.failed");
    throw err;
  }
}
