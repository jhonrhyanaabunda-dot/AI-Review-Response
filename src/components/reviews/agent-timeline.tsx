import { format } from "date-fns";
import {
  Inbox,
  Brain,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Send,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { ActivityKind } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Entry = {
  id: string;
  kind: ActivityKind;
  createdAt: Date;
  message?: string | null;
  metadata: unknown;
};

const STEP_META: Record<
  ActivityKind,
  { Icon: typeof Inbox; label: string; tone: "default" | "warn" | "danger" | "success"; description: string } | null
> = {
  REVIEW_INGESTED: {
    Icon: Inbox,
    label: "Review ingested",
    tone: "default",
    description: "Pulled from the source platform and stored.",
  },
  RESPONSE_GENERATED: {
    Icon: Sparkles,
    label: "AI draft generated",
    tone: "default",
    description: "Sentiment classified, tone matched, draft written.",
  },
  RESPONSE_EDITED: {
    Icon: Brain,
    label: "Draft edited by team",
    tone: "default",
    description: "Human edits saved to the draft.",
  },
  RESPONSE_APPROVED: {
    Icon: CheckCircle2,
    label: "Approved by GM",
    tone: "success",
    description: "Approved with one click. Queued for publishing.",
  },
  RESPONSE_REJECTED: {
    Icon: XCircle,
    label: "Rejected",
    tone: "danger",
    description: "Marked as not-publishable.",
  },
  RESPONSE_PUBLISHED: {
    Icon: Send,
    label: "Published",
    tone: "success",
    description: "Reply posted to the source platform.",
  },
  RESPONSE_FAILED: {
    Icon: AlertTriangle,
    label: "Publish failed",
    tone: "danger",
    description: "Upstream platform rejected the publish — will retry.",
  },
  ESCALATED: {
    Icon: ShieldCheck,
    label: "Escalated",
    tone: "warn",
    description: "Flagged for GM / legal review before any response goes out.",
  },
  MEMBER_INVITED: null,
  MEMBER_REMOVED: null,
  DEALERSHIP_CREATED: null,
  DEALERSHIP_UPDATED: null,
  LOCATION_CREATED: null,
  TOKEN_ROTATED: null,
  SETTINGS_UPDATED: null,
  LOGIN: null,
};

const TONE_CLASS = {
  default: "bg-primary/10 text-primary",
  warn: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
  success: "bg-success/15 text-success",
} as const;

export function AgentTimeline({ entries }: { entries: Entry[] }) {
  // Show most-recent first.
  const events = entries
    .map((e) => ({ ...e, meta: STEP_META[e.kind] }))
    .filter((e) => e.meta != null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pipeline activity yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-6">
            {events.map((e) => {
              const meta = e.meta!;
              return (
                <li key={e.id} className="relative">
                  <span
                    className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full ${
                      TONE_CLASS[meta.tone]
                    }`}
                  >
                    <meta.Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {meta.description}
                    {e.message ? ` · ${e.message}` : ""}
                  </div>
                  <time className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {format(e.createdAt, "MMM d, HH:mm:ss")}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
