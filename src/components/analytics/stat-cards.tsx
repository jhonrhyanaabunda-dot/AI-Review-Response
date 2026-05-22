import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

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

export function StatCards({ summary, responseTimeP50Seconds }: {
  summary: Summary;
  responseTimeP50Seconds: number;
}) {
  const items = [
    {
      label: "Reviews",
      value: summary.totalReviews.toLocaleString(),
      Icon: MessageSquare,
    },
    {
      label: "Avg rating",
      value: summary.averageRating.toFixed(2),
      Icon: Star,
    },
    {
      label: "Published",
      value: summary.publishedCount.toLocaleString(),
      Icon: CheckCircle2,
    },
    {
      label: "Pending approval",
      value: summary.pendingCount.toLocaleString(),
      Icon: Clock,
    },
    {
      label: "Response time (p50)",
      value: formatDuration(responseTimeP50Seconds),
      Icon: Clock,
    },
    {
      label: "Escalations",
      value: summary.escalated.toLocaleString(),
      Icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map(({ label, value, Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
