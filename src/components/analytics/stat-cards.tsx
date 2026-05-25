import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AnimatedNumber } from "./animated-number";

type Summary = {
  totalReviews: number;
  averageRating: number;
  publishedCount: number;
  pendingCount: number;
  escalated: number;
  aiApprovalRate: number;
};

function formatDuration(s: number) {
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

export function StatCards({
  summary,
  responseTimeP50Seconds,
}: {
  summary: Summary;
  responseTimeP50Seconds: number;
}) {
  // Either an animated numeric value, or a pre-rendered string
  // (response time has unit suffix logic that doesn't animate cleanly).
  type Item = {
    label: string;
    Icon: typeof Star;
    accent?: string;
  } & ({ numeric: number; decimals?: number } | { text: string });

  const items: Item[] = [
    { label: "Reviews", Icon: MessageSquare, numeric: summary.totalReviews },
    { label: "Avg rating", Icon: Star, numeric: summary.averageRating, decimals: 2, accent: "text-warning" },
    { label: "Published", Icon: CheckCircle2, numeric: summary.publishedCount, accent: "text-success" },
    { label: "Pending approval", Icon: Clock, numeric: summary.pendingCount },
    { label: "Response time (p50)", Icon: Clock, text: formatDuration(responseTimeP50Seconds) },
    {
      label: "Escalations",
      Icon: AlertTriangle,
      numeric: summary.escalated,
      accent: summary.escalated > 0 ? "text-destructive" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} className="group border-border/60 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.Icon
              className={`h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black tracking-tight ${item.accent ?? ""}`}>
              {"text" in item ? (
                item.text
              ) : (
                <AnimatedNumber value={item.numeric} decimals={item.decimals} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
