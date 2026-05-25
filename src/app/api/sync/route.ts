import { z } from "zod";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/utils/errors";
// Note: @/workers/queues is imported lazily inside the handler so the
// module (which instantiates ioredis + BullMQ) doesn't open a TCP
// connection during Next.js build-time "Collecting page data" step.

const schema = z.object({
  sourceId: z.string().optional(),
  dealershipId: z.string().optional(),
  kind: z.enum(["poll", "backfill"]).default("poll"),
});

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("tokens:write");
    const body = schema.parse(await req.json());

    const sources = await prisma.reviewSource.findMany({
      where: {
        location: {
          dealership: {
            organizationId: ctx.organizationId,
            ...(body.dealershipId ? { id: body.dealershipId } : {}),
          },
        },
        ...(body.sourceId ? { id: body.sourceId } : {}),
        isActive: true,
      },
      include: { location: { include: { dealership: true } } },
    });
    if (sources.length === 0) throw new NotFoundError("No active sources match");

    const { syncReviewsQueue, jobDefaults } = await import("@/workers/queues");
    for (const s of sources) {
      await syncReviewsQueue.add(
        body.kind,
        {
          sourceId: s.id,
          organizationId: ctx.organizationId,
          dealershipId: s.location.dealershipId,
          kind: body.kind,
        },
        { ...jobDefaults, jobId: `${body.kind}:${s.id}:${Date.now()}` },
      );
    }
    return ok({ queued: sources.length });
  } catch (err) {
    return handleApiError(err);
  }
}
