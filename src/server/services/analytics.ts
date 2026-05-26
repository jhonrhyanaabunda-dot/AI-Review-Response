import { ReviewStatus } from "@prisma/client";
import {
  dashboardSummary as summaryFromStore,
  ratingTrend as trendFromStore,
  platformBreakdown as platformsFromStore,
  dealershipBreakdown as dealershipsFromStore,
  responseTimeP50 as p50FromStore,
  type AnalyticsRange,
} from "@/lib/demo/store";

export type { AnalyticsRange };

export async function dashboardSummary(
  _organizationId: string,
  range: AnalyticsRange,
  scope: { dealershipId?: string | null } = {},
) {
  return summaryFromStore(range, scope.dealershipId ?? undefined);
}

export async function ratingTrend(
  _organizationId: string,
  range: AnalyticsRange,
  scope: { dealershipId?: string | null } = {},
) {
  return trendFromStore(range, scope.dealershipId ?? undefined);
}

export async function platformBreakdown(
  _organizationId: string,
  range: AnalyticsRange,
  scope: { dealershipId?: string | null } = {},
) {
  return platformsFromStore(range, scope.dealershipId ?? undefined);
}

export async function dealershipBreakdown(
  _organizationId: string,
  range: AnalyticsRange,
) {
  return dealershipsFromStore(range);
}

export async function responseTimeP50(
  _organizationId: string,
  range: AnalyticsRange,
): Promise<number> {
  return p50FromStore(range);
}

export { ReviewStatus };
