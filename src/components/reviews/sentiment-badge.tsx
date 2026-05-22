import { Badge } from "@/components/ui/badge";
import { Sentiment } from "@prisma/client";

const STYLES: Record<Sentiment, { label: string; variant: "success" | "muted" | "warning" | "destructive" }> = {
  POSITIVE: { label: "POSITIVE", variant: "success" },
  NEUTRAL: { label: "NEUTRAL", variant: "muted" },
  NEGATIVE: { label: "NEGATIVE", variant: "warning" },
  ANGRY: { label: "ANGRY", variant: "destructive" },
  LEGAL_RISK: { label: "LEGAL RISK", variant: "destructive" },
};

export function SentimentBadge({ value }: { value: Sentiment | null | undefined }) {
  if (!value) return <Badge variant="muted">UNCLASSIFIED</Badge>;
  const s = STYLES[value];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
