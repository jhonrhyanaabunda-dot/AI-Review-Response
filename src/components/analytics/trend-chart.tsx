"use client";
import { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartTooltipRow,
  ChartTooltipSurface,
} from "./chart-tooltip";

type Row = { day: string; avg: number; count: number };

function parseDay(day: string) {
  // day is YYYY-MM-DD - construct as UTC to avoid TZ shift.
  return new Date(`${day}T12:00:00Z`);
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload as Row;
  const date = parseDay(row.day);
  return (
    <ChartTooltipSurface
      title={format(date, "EEE")}
      subtitle={format(date, "MMMM d")}
    >
      <ChartTooltipRow
        label="Avg rating"
        color="hsl(var(--primary))"
        value={
          <span className="tabular-nums">
            {row.avg.toFixed(2)}{" "}
            <span className="text-muted-foreground">/ 5</span>
          </span>
        }
      />
      <ChartTooltipRow
        label="Reviews"
        color="hsl(var(--muted-foreground))"
        value={<span className="tabular-nums">{row.count}</span>}
      />
    </ChartTooltipSurface>
  );
}

function PulseDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      {/* halo */}
      <circle cx={cx} cy={cy} r={10} fill="hsl(var(--primary))" opacity={0.18}>
        <animate
          attributeName="r"
          values="6;14;6"
          dur="2.2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.25;0;0.25"
          dur="2.2s"
          repeatCount="indefinite"
        />
      </circle>
      {/* center */}
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="hsl(var(--primary))"
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
    </g>
  );
}

function trendDelta(rows: Row[]): { delta: number; label: string } | null {
  if (rows.length < 2) return null;
  const half = Math.floor(rows.length / 2);
  const earlyAvg =
    rows.slice(0, half).reduce((s, r) => s + r.avg, 0) / Math.max(1, half);
  const lateAvg =
    rows.slice(half).reduce((s, r) => s + r.avg, 0) /
    Math.max(1, rows.length - half);
  if (!earlyAvg) return null;
  const delta = lateAvg - earlyAvg;
  return { delta, label: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}` };
}

export function TrendChart({ data }: { data: Row[] }) {
  // Inject row index so the dot renderer can spot the last point.
  const enriched = useMemo(
    () => data.map((d, i) => ({ ...d, _i: i, _isLast: i === data.length - 1 })),
    [data],
  );
  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.count)),
    [data],
  );
  const trend = useMemo(() => trendDelta(data), [data]);
  const avgAll = useMemo(
    () =>
      data.length
        ? data.reduce((s, r) => s + r.avg, 0) / data.length
        : 0,
    [data],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Rating trend</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Daily average across the selected window.
          </p>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium ${
              trend.delta > 0.05
                ? "border-success/30 bg-success/10 text-success"
                : trend.delta < -0.05
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-muted/40 text-muted-foreground"
            }`}
          >
            {trend.delta > 0.05 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : trend.delta < -0.05 ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            <span className="tabular-nums">{trend.label}</span>
            <span className="opacity-70">vs first half</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No reviews in range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={enriched}
              margin={{ top: 16, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                  <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="trend-count-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 4"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tickFormatter={(d) => format(parseDay(d), "MMM d")}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                yAxisId="rating"
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                domain={[0, Math.ceil(maxCount * 1.4)]}
                hide
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "3 3", strokeOpacity: 0.6 }}
                content={<CustomTooltip />}
              />
              {avgAll > 0 && (
                <ReferenceLine
                  yAxisId="rating"
                  y={avgAll}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="2 4"
                  strokeOpacity={0.4}
                  label={{
                    value: `avg ${avgAll.toFixed(2)}`,
                    position: "right",
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
              )}
              <Bar
                yAxisId="count"
                dataKey="count"
                barSize={6}
                radius={[3, 3, 0, 0]}
                fill="url(#trend-count-bar)"
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Area
                yAxisId="rating"
                type="monotone"
                dataKey="avg"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#trend-area)"
                isAnimationActive
                animationDuration={1100}
                animationEasing="ease-out"
                dot={(props: { cx?: number; cy?: number; payload?: { _isLast?: boolean } }) =>
                  props.payload?._isLast ? (
                    <PulseDot cx={props.cx} cy={props.cy} />
                  ) : (
                    <g />
                  )
                }
                activeDot={{
                  r: 5,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                  fill: "hsl(var(--primary))",
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
