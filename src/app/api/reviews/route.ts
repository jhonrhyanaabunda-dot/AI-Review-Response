import { NextRequest } from "next/server";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { paginationSchema, reviewFilterSchema } from "@/lib/validation";
import { listReviews } from "@/server/services/reviews";
import { rateLimit } from "@/lib/redis/rate-limit";
import { RateLimitError } from "@/lib/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requirePermission("reviews:read");
    const rl = await rateLimit(`reviews:${ctx.userId}`, 120, 60);
    if (!rl.allowed) throw new RateLimitError();

    const sp = req.nextUrl.searchParams;
    const filter = reviewFilterSchema.parse(Object.fromEntries(sp));
    const { cursor, limit } = paginationSchema.parse({
      cursor: sp.get("cursor") ?? undefined,
      limit: sp.get("limit") ?? undefined,
    });

    const result = await listReviews(ctx.organizationId, filter, cursor, limit, {
      dealershipId: ctx.dealershipId,
    });
    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}
