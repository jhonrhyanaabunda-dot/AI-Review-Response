"use client";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// A3 palette colors for sentiment slices. Emerald = positive (brand-aligned),
// stone = neutral, amber = negative, red = angry / legal-risk.
const COLORS: Record<string, string> = {
  POSITIVE: "#1DB954",
  NEUTRAL: "#8A919C",
  NEGATIVE: "#F59E0B",
  ANGRY: "#EF4444",
  LEGAL_RISK: "#B91C1C",
  UNCLASSIFIED: "#E5E7EB",
};

const LABELS: Record<string, string> = {
  POSITIVE: "Positive",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
  ANGRY: "Angry",
  LEGAL_RISK: "Legal risk",
  UNCLASSIFIED: "Unclassified",
};

export function SentimentDonut({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data)
    .map(([k, v]) => ({ name: LABELS[k] ?? k, key: k, value: v }))
    .filter((r) => r.value > 0);

  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sentiment breakdown</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No classified reviews in range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {rows.map((r) => (
                  <Cell key={r.key} fill={COLORS[r.key] ?? "#999"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [
                  `${v} (${Math.round((v / total) * 100)}%)`,
                  "",
                ]}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
