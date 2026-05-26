"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  RefreshCw,
  XCircle,
  Sparkles,
  PencilLine,
  ExternalLink,
} from "lucide-react";
import type { ReviewPlatform, ReviewStatus, Sentiment } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RatingStars } from "@/components/reviews/rating-stars";
import { PlatformIcon } from "@/components/reviews/platform-icon";
import { SentimentBadge } from "@/components/reviews/sentiment-badge";
import { PublishedStrip, type PublishedItem } from "@/components/reviews/published-strip";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils/cn";

type InboxItem = {
  id: string;
  platform: ReviewPlatform;
  rating: number;
  authorName: string | null;
  body: string;
  postedAt: Date;
  status: ReviewStatus;
  sentiment: Sentiment | null;
  externalUrl: string | null;
  dealership: { name: string };
  responses: Array<{
    id: string;
    status: string;
    draftBody: string;
    finalBody: string | null;
    confidence: number;
    flaggedReasons: string[];
  }>;
};

function confidenceTier(c: number) {
  if (c >= 0.8) return { label: "High", variant: "success" as const };
  if (c >= 0.5) return { label: "Medium", variant: "warning" as const };
  return { label: "Low", variant: "destructive" as const };
}

type ConfidenceFilter = "all" | "high" | "mid" | "low";

export function InboxClient({
  items,
  published,
}: {
  items: InboxItem[];
  published: PublishedItem[];
}) {
  const router = useRouter();
  const { request, loading } = useApi();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Record<string, boolean>>({});
  // Optimistically remove a row from view the moment the user clicks Approve
  // or Reject, before the server roundtrip. router.refresh() reconciles a
  // beat later. If the API errors, we re-add to keep the UI honest.
  const [optimisticallyHidden, setOptimisticallyHidden] = useState<Set<string>>(new Set());
  const [confidence, setConfidence] = useState<ConfidenceFilter>("all");

  const toggleSelect = (id: string, on: boolean) => {
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const counts = useMemo(
    () =>
      items.reduce(
        (acc, r) => {
          const c = r.responses[0]?.confidence ?? 0;
          if (c >= 0.8) acc.high += 1;
          else if (c >= 0.5) acc.mid += 1;
          else acc.low += 1;
          return acc;
        },
        { high: 0, mid: 0, low: 0 },
      ),
    [items],
  );

  const decide = async (reviewId: string, decision: "APPROVED" | "REJECTED") => {
    setPending((p) => ({ ...p, [reviewId]: true }));
    setOptimisticallyHidden((h) => new Set(h).add(reviewId));
    try {
      await request(`/api/reviews/${reviewId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      toast.success(
        decision === "APPROVED" ? "Approved & published" : "Response rejected",
      );
      startTransition(() => router.refresh());
    } catch (e) {
      // Roll back the optimistic removal so the GM doesn't lose sight of it.
      setOptimisticallyHidden((h) => {
        const next = new Set(h);
        next.delete(reviewId);
        return next;
      });
      toast.error((e as Error).message);
    } finally {
      setPending((p) => ({ ...p, [reviewId]: false }));
    }
  };

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setOptimisticallyHidden((h) => {
      const next = new Set(h);
      ids.forEach((id) => next.add(id));
      return next;
    });
    try {
      const result = await request<{ approved: number }>(
        "/api/responses/bulk-approve",
        {
          method: "POST",
          body: JSON.stringify({ reviewIds: ids }),
        },
      );
      toast.success(`Approved ${result.approved} responses`);
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      setOptimisticallyHidden((h) => {
        const next = new Set(h);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            GM workflow
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tight md:text-display-3">Inbox</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} waiting for GM approval -{" "}
            <span className="font-semibold text-success">{counts.high} high</span> ·{" "}
            <span className="font-semibold text-warning">{counts.mid} medium</span> ·{" "}
            <span className="font-semibold text-destructive">{counts.low} low</span> confidence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="success"
            disabled={selected.size === 0 || loading}
            onClick={bulkApprove}
          >
            <CheckCircle2 className="h-4 w-4" />
            {selected.size > 0 ? `Approve ${selected.size}` : "Approve selected"}
          </Button>
        </div>
      </div>

      <PublishedStrip items={published} />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: `All (${items.length})`, accent: "" },
            { key: "high", label: `High (${counts.high})`, accent: "data-[active=true]:bg-success/15 data-[active=true]:text-success" },
            { key: "mid", label: `Medium (${counts.mid})`, accent: "data-[active=true]:bg-warning/15 data-[active=true]:text-warning" },
            { key: "low", label: `Low (${counts.low})`, accent: "data-[active=true]:bg-destructive/15 data-[active=true]:text-destructive" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            data-active={confidence === opt.key}
            onClick={() => setConfidence(opt.key)}
            className={cn(
              "rounded-pill border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              "data-[active=true]:border-transparent data-[active=true]:bg-foreground data-[active=true]:text-background",
              opt.accent,
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {(() => {
        const filtered = items
          .filter((r) => !optimisticallyHidden.has(r.id))
          .filter((r) => {
            if (confidence === "all") return true;
            const c = r.responses[0]?.confidence ?? 0;
            if (confidence === "high") return c >= 0.8;
            if (confidence === "mid") return c >= 0.5 && c < 0.8;
            return c < 0.5;
          });
        if (filtered.length === 0) {
          return (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                {items.length === 0
                  ? "Nothing waiting. New reviews surface here as soon as AI drafts a response."
                  : "No reviews match this confidence filter."}
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="space-y-3">
            {filtered.map((r) => (
              <InboxCard
                key={r.id}
                item={r}
                selected={selected.has(r.id)}
                onSelectedChange={(on) => toggleSelect(r.id, on)}
                onDecide={decide}
                pending={!!pending[r.id]}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

function InboxCard({
  item,
  selected,
  onSelectedChange,
  onDecide,
  pending,
}: {
  item: InboxItem;
  selected: boolean;
  onSelectedChange: (on: boolean) => void;
  onDecide: (id: string, d: "APPROVED" | "REJECTED") => void;
  pending: boolean;
}) {
  const draft = item.responses[0];
  const tier = confidenceTier(draft?.confidence ?? 0);
  const hasFlags = (draft?.flaggedReasons?.length ?? 0) > 0;

  return (
    <Card
      className={cn(
        "transition-shadow",
        hasFlags && "border-warning/40",
        selected && "ring-1 ring-primary",
      )}
    >
      <CardContent className="p-0">
        {/* Header row: who/what */}
        <div className="flex items-start gap-3 border-b px-4 py-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelectedChange(!!v)}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={item.platform} withLabel />
              <RatingStars value={item.rating} />
              <span className="text-sm font-medium">
                {item.authorName ?? "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                · {item.dealership.name}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDistanceToNow(item.postedAt, { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-3 text-sm text-foreground/80">{item.body}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SentimentBadge value={item.sentiment} />
              <Badge variant={tier.variant}>
                {tier.label} confidence
                {draft && ` · ${Math.round(draft.confidence * 100)}%`}
              </Badge>
              {hasFlags && (
                <Badge variant="warning">
                  ⚠ {draft!.flaggedReasons.slice(0, 2).join(", ")}
                </Badge>
              )}
              {item.externalUrl && (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  view on {item.platform.toLowerCase().replace("_dot_", ".")} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* AI draft + one-click actions */}
        <div className="bg-muted/30 px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              AI-drafted response
            </span>
          </div>
          <p className="whitespace-pre-wrap rounded-md border bg-background p-3 text-sm leading-relaxed">
            {draft?.finalBody ?? draft?.draftBody ?? "Generating…"}
          </p>

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/reviews/${item.id}`}>
                <PencilLine className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDecide(item.id, "REJECTED")}
              disabled={pending || !draft}
            >
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => onDecide(item.id, "APPROVED")}
              disabled={pending || !draft}
            >
              <CheckCircle2 className="h-4 w-4" />
              {pending ? "Publishing…" : "Approve & publish"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
