import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import {
  dashboardSummary,
  dealershipBreakdown,
  ratingTrend,
  responseTimeP50,
} from "@/server/services/analytics";

const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requirePermission("analytics:read");
    const parsed = rangeSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const to = parsed.to ?? new Date();
    const from = parsed.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const range = { from, to };

    const [summary, trend, breakdown, p50] = await Promise.all([
      dashboardSummary(ctx.organizationId, range, { dealershipId: ctx.dealershipId }),
      ratingTrend(ctx.organizationId, range, { dealershipId: ctx.dealershipId }),
      dealershipBreakdown(ctx.organizationId, range),
      responseTimeP50(ctx.organizationId, range),
    ]);

    return ok({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary,
      trend,
      breakdown,
      responseTimeP50Seconds: p50,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
