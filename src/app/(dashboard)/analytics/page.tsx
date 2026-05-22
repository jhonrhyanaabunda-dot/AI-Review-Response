import { requirePermission } from "@/server/rbac/guard";
import {
  dashboardSummary,
  dealershipBreakdown,
  ratingTrend,
  responseTimeP50,
} from "@/server/services/analytics";
import { StatCards } from "@/components/analytics/stat-cards";
import { TrendChart } from "@/components/analytics/trend-chart";
import { DealershipTable } from "@/components/analytics/dealership-table";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const ctx = await requirePermission("analytics:read");
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
  const range = { from, to };

  const [summary, trend, breakdown, p50] = await Promise.all([
    dashboardSummary(ctx.organizationId, range, { dealershipId: ctx.dealershipId }),
    ratingTrend(ctx.organizationId, range, { dealershipId: ctx.dealershipId }),
    dealershipBreakdown(ctx.organizationId, range),
    responseTimeP50(ctx.organizationId, range),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          Performance
        </span>
        <h2 className="mt-1 text-2xl font-black tracking-tight md:text-display-3">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Last 90 days across all dealerships you can see.</p>
      </div>
      <StatCards summary={summary} responseTimeP50Seconds={p50} />
      <TrendChart data={trend} />
      <DealershipTable rows={breakdown} />
    </div>
  );
}
