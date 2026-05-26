import { NextRequest } from "next/server";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { paginationSchema, reviewFilterSchema } from "@/lib/validation";
import { listReviews } from "@/server/services/reviews";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requirePermission("reviews:read");
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
