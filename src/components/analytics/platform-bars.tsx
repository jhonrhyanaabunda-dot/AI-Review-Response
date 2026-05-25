"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReviewPlatform } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLATFORM_LABEL: Record<ReviewPlatform, string> = {
  GOOGLE: "Google",
  YELP: "Yelp",
  DEALERRATER: "DealerRater",
  CARS_DOT_COM: "Cars.com",
  FACEBOOK: "Facebook",
  BBB: "BBB",
};

const PLATFORM_COLOR: Record<ReviewPlatform, string> = {
  GOOGLE: "#0EA5E9",
  YELP: "#EF4444",
  DEALERRATER: "#10B981",
  CARS_DOT_COM: "#F97316",
  FACEBOOK: "#3B82F6",
  BBB: "#6366F1",
};

export type PlatformBarsData = Array<{
  platform: ReviewPlatform;
  count: number;
  avgRating: number;
}>;

export function PlatformBars({ data }: { data: PlatformBarsData }) {
  const rows = data
    .map((d) => ({
      name: PLATFORM_LABEL[d.platform],
      key: d.platform,
      count: d.count,
      avgRating: d.avgRating,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reviews per platform</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No reviews in range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 16, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value, _name, item) => {
                  const r = (item.payload as { avgRating: number }).avgRating;
                  return [`${value} reviews (avg ${r.toFixed(1)}★)`, ""];
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {rows.map((r) => (
                  <Cell key={r.key} fill={PLATFORM_COLOR[r.key as ReviewPlatform]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
