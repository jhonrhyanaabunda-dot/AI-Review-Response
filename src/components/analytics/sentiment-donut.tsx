"use client";
import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartTooltipRow,
  ChartTooltipSurface,
} from "./chart-tooltip";

const COLORS: Record<string, string> = {
  POSITIVE: "#1DB954",
  NEUTRAL: "#8A919C",
  NEGATIVE: "#F59E0B",
  ANGRY: "#EF4444",
  LEGAL_RISK: "#B91C1C",
  UNCLASSIFIED: "#CBD5E1",
};

const LABELS: Record<string, string> = {
  POSITIVE: "Positive",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
  ANGRY: "Angry",
  LEGAL_RISK: "Legal risk",
  UNCLASSIFIED: "Unclassified",
};

const ORDER = ["POSITIVE", "NEUTRAL", "NEGATIVE", "ANGRY", "LEGAL_RISK", "UNCLASSIFIED"];

type Row = { key: string; name: string; value: number; color: string };

function CustomTooltip({
  active,
  payload,
  total,
}: TooltipProps<number, string> & { total: number }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload as Row;
  const pct = total ? (row.value / total) * 100 : 0;
  return (
    <ChartTooltipSurface subtitle={row.name}>
      <ChartTooltipRow
        label="Reviews"
        color={row.color}
        value={<span className="tabular-nums">{row.value}</span>}
      />
      <ChartTooltipRow
        label="Share"
        value={<span className="tabular-nums">{pct.toFixed(1)}%</span>}
      />
    </ChartTooltipSurface>
  );
}

type ActiveShapeProps = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
};

function ActiveShape(props: ActiveShapeProps) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={3}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 11}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.35}
      />
    </g>
  );
}

export function SentimentDonut({ data }: { data: Record<string, number> }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const rows: Row[] = useMemo(
    () =>
      ORDER.filter((k) => (data[k] ?? 0) > 0).map((k) => ({
        key: k,
        name: LABELS[k] ?? k,
        value: data[k] ?? 0,
        color: COLORS[k] ?? "#999",
      })),
    [data],
  );
  const total = useMemo(() => rows.reduce((s, r) => s + r.value, 0), [rows]);
  const dominant = useMemo(
    () => (rows.length ? rows.reduce((a, b) => (a.value >= b.value ? a : b)) : null),
    [rows],
  );

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sentiment breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          No classified reviews in range.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sentiment breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">
          {dominant && (
            <>
              <span
                className="font-semibold"
                style={{ color: dominant.color }}
              >
                {dominant.name}
              </span>{" "}
              leads at {Math.round((dominant.value / total) * 100)}%.
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="h-64">
        <div className="grid h-full grid-cols-[1fr_140px] items-center">
          <div className="relative h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                  cornerRadius={3}
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive
                  animationDuration={950}
                  animationEasing="ease-out"
                  activeIndex={activeIndex ?? undefined}
                  activeShape={ActiveShape as unknown as React.ReactElement}
                  onMouseEnter={(_, idx) => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {rows.map((r) => (
                    <Cell key={r.key} fill={r.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={(props) => (
                    <CustomTooltip
                      {...(props as TooltipProps<number, string>)}
                      total={total}
                    />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {activeIndex != null ? rows[activeIndex]!.name : "Total"}
              </div>
              <div className="text-3xl font-black tracking-tight tabular-nums">
                {activeIndex != null ? rows[activeIndex]!.value : total}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {activeIndex != null
                  ? `${Math.round((rows[activeIndex]!.value / total) * 100)}% of total`
                  : "reviews"}
              </div>
            </div>
          </div>

          <ul className="space-y-1.5">
            {rows.map((r, i) => {
              const pct = (r.value / total) * 100;
              const isActive = activeIndex === i;
              return (
                <li
                  key={r.key}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`group flex cursor-default items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors ${
                    isActive ? "bg-muted" : ""
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform group-hover:scale-125"
                    style={{ background: r.color }}
                  />
                  <span className="flex-1 truncate font-medium">{r.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {pct.toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
