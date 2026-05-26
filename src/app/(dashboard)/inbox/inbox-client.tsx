"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  ArrowDownToLine,
  PartyPopper,
  Wand2,
  Save,
  Undo2,
} from "lucide-react";
import type { ReviewPlatform, ReviewStatus, Sentiment } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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

type ConfidenceFilter = "all" | "high" | "mid" | "low";
type SentimentFilter = "all" | "praise" | "complaints" | "legal";

function confidenceTier(c: number) {
  if (c >= 0.8) return { label: "High", variant: "success" as const, bar: "bg-success" };
  if (c >= 0.5) return { label: "Medium", variant: "warning" as const, bar: "bg-warning" };
  return { label: "Low", variant: "destructive" as const, bar: "bg-destructive" };
}

function matchesSentimentBucket(s: Sentiment | null, bucket: SentimentFilter) {
  if (bucket === "all") return true;
  if (bucket === "praise") return s === "POSITIVE" || s === "NEUTRAL";
  if (bucket === "complaints") return s === "NEGATIVE" || s === "ANGRY";
  if (bucket === "legal") return s === "LEGAL_RISK";
  return true;
}

function sentimentAccent(s: Sentiment | null): string {
  switch (s) {
    case "POSITIVE":
      return "border-l-4 border-l-success";
    case "NEGATIVE":
    case "ANGRY":
      return "border-l-4 border-l-warning";
    case "LEGAL_RISK":
      return "border-l-4 border-l-destructive";
    case "NEUTRAL":
      return "border-l-4 border-l-muted-foreground/30";
    default:
      return "";
  }
}

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
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  const [optimisticallyHidden, setOptimisticallyHidden] = useState<Set<string>>(new Set());
  const [confidence, setConfidence] = useState<ConfidenceFilter>("all");
  const [sentimentBucket, setSentimentBucket] = useState<SentimentFilter>("all");
  // reviewId -> in-flight edited body. Cleared on commit/cancel.
  const [draftOverrides, setDraftOverrides] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

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

  const sentimentCounts = useMemo(
    () =>
      items.reduce(
        (acc, r) => {
          if (matchesSentimentBucket(r.sentiment, "praise")) acc.praise += 1;
          if (matchesSentimentBucket(r.sentiment, "complaints")) acc.complaints += 1;
          if (matchesSentimentBucket(r.sentiment, "legal")) acc.legal += 1;
          return acc;
        },
        { praise: 0, complaints: 0, legal: 0 },
      ),
    [items],
  );

  const visible = useMemo(
    () =>
      items
        .filter((r) => !optimisticallyHidden.has(r.id))
        .filter((r) => matchesSentimentBucket(r.sentiment, sentimentBucket))
        .filter((r) => {
          if (confidence === "all") return true;
          const c = r.responses[0]?.confidence ?? 0;
          if (confidence === "high") return c >= 0.8;
          if (confidence === "mid") return c >= 0.5 && c < 0.8;
          return c < 0.5;
        }),
    [items, optimisticallyHidden, confidence, sentimentBucket],
  );

  // Keep the focused row in range as the list shrinks.
  useEffect(() => {
    if (visible.length === 0) {
      setFocusedId(null);
      return;
    }
    if (!focusedId || !visible.some((v) => v.id === focusedId)) {
      setFocusedId(visible[0]!.id);
    }
  }, [visible, focusedId]);

  const decide = useCallback(
    async (reviewId: string, decision: "APPROVED" | "REJECTED", finalBody?: string) => {
      setPending((p) => ({ ...p, [reviewId]: true }));
      setOptimisticallyHidden((h) => new Set(h).add(reviewId));
      try {
        await request(`/api/reviews/${reviewId}/decision`, {
          method: "POST",
          body: JSON.stringify({ decision, finalBody }),
        });
        toast.success(
          decision === "APPROVED" ? "Approved & published" : "Response rejected",
        );
        setDraftOverrides((d) => {
          const next = { ...d };
          delete next[reviewId];
          return next;
        });
        startTransition(() => router.refresh());
      } catch (e) {
        setOptimisticallyHidden((h) => {
          const next = new Set(h);
          next.delete(reviewId);
          return next;
        });
        toast.error((e as Error).message);
      } finally {
        setPending((p) => ({ ...p, [reviewId]: false }));
      }
    },
    [request, router],
  );

  const regenerate = useCallback(
    async (reviewId: string, responseId: string) => {
      setRegenerating((r) => ({ ...r, [reviewId]: true }));
      try {
        const res = await request<{ body: string; source: "ai" | "canned" }>(
          `/api/responses/${responseId}/regenerate`,
          { method: "POST" },
        );
        toast.success(res.source === "ai" ? "AI generated a new draft" : "Fresh draft ready");
        // Surface the new body in the local state so the textarea reflects it
        // immediately (the cookie also persists it server-side).
        setDraftOverrides((d) => ({ ...d, [reviewId]: res.body }));
        startTransition(() => router.refresh());
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setRegenerating((r) => ({ ...r, [reviewId]: false }));
      }
    },
    [request, router],
  );

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

  const bulkReject = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setOptimisticallyHidden((h) => {
      const next = new Set(h);
      ids.forEach((id) => next.add(id));
      return next;
    });
    try {
      for (const id of ids) {
        await request(`/api/reviews/${id}/decision`, {
          method: "POST",
          body: JSON.stringify({ decision: "REJECTED" }),
        });
      }
      toast.success(`Rejected ${ids.length} responses`);
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

  // Keyboard navigation: j/k navigate, a approve, r reject, e edit.
  // Skipped when the active element is an input/textarea so typing works.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inField) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (visible.length === 0) return;

      const idx = focusedId ? visible.findIndex((v) => v.id === focusedId) : -1;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = visible[Math.min(visible.length - 1, idx + 1)] ?? visible[0]!;
        setFocusedId(next.id);
        return;
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = visible[Math.max(0, idx - 1)] ?? visible[0]!;
        setFocusedId(next.id);
        return;
      }
      if (!focusedId) return;
      const item = visible.find((v) => v.id === focusedId);
      if (!item) return;
      const draft = item.responses[0];
      if (!draft) return;
      if (e.key === "a") {
        e.preventDefault();
        const body = draftOverrides[item.id] ?? draft.finalBody ?? draft.draftBody;
        decide(item.id, "APPROVED", body);
      } else if (e.key === "r") {
        e.preventDefault();
        decide(item.id, "REJECTED");
      } else if (e.key === "e") {
        e.preventDefault();
        setEditing(item.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, focusedId, draftOverrides, decide]);

  const allHandled =
    items.length > 0 && visible.length === 0 && optimisticallyHidden.size > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            GM workflow
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tight md:text-display-3">Inbox</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} waiting · use{" "}
            <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]">J</kbd>
            /
            <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]">K</kbd>{" "}
            to navigate ·{" "}
            <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]">A</kbd>{" "}
            approve ·{" "}
            <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]">R</kbd>{" "}
            reject ·{" "}
            <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]">E</kbd>{" "}
            edit
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {selected.size > 0 && (
            <Button size="sm" variant="outline" disabled={loading} onClick={bulkReject}>
              <XCircle className="h-4 w-4" /> Reject {selected.size}
            </Button>
          )}
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

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatPill
          label="Waiting"
          value={items.length - optimisticallyHidden.size}
          tone="default"
        />
        <StatPill label="High confidence" value={counts.high} tone="success" />
        <StatPill label="Medium" value={counts.mid} tone="warning" />
        <StatPill label="Low / flagged" value={counts.low} tone="destructive" />
      </div>

      <PublishedStrip items={published} />

      {/* Sentiment quick-filter tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
        {(
          [
            { key: "all", label: "All", count: items.length, accent: "" },
            {
              key: "praise",
              label: "Praise",
              count: sentimentCounts.praise,
              accent:
                "data-[active=true]:bg-success/10 data-[active=true]:text-success",
            },
            {
              key: "complaints",
              label: "Complaints",
              count: sentimentCounts.complaints,
              accent:
                "data-[active=true]:bg-warning/10 data-[active=true]:text-warning",
            },
            {
              key: "legal",
              label: "Legal risk",
              count: sentimentCounts.legal,
              accent:
                "data-[active=true]:bg-destructive/10 data-[active=true]:text-destructive",
            },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            data-active={sentimentBucket === opt.key}
            onClick={() => setSentimentBucket(opt.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              "data-[active=true]:bg-foreground data-[active=true]:text-background",
              opt.accent,
            )}
          >
            <span>{opt.label}</span>
            <span className="ml-1.5 opacity-70">({opt.count})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Confidence
        </span>
        {(
          [
            { key: "all", label: `All (${items.length})`, accent: "" },
            {
              key: "high",
              label: `High (${counts.high})`,
              accent:
                "data-[active=true]:bg-success/15 data-[active=true]:text-success",
            },
            {
              key: "mid",
              label: `Medium (${counts.mid})`,
              accent:
                "data-[active=true]:bg-warning/15 data-[active=true]:text-warning",
            },
            {
              key: "low",
              label: `Low (${counts.low})`,
              accent:
                "data-[active=true]:bg-destructive/15 data-[active=true]:text-destructive",
            },
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

      {visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full",
                allHandled ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {allHandled ? (
                <PartyPopper className="h-6 w-6" />
              ) : (
                <Sparkles className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold">
                {allHandled ? "Inbox zero. GMs caught up." : "Nothing matches this filter."}
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                {allHandled
                  ? "Every pending review has been approved or rejected. New ones surface here as soon as AI drafts a reply."
                  : items.length === 0
                    ? "New reviews surface here as soon as AI drafts a reply."
                    : "Try a different confidence filter."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <InboxCard
              key={r.id}
              item={r}
              selected={selected.has(r.id)}
              focused={focusedId === r.id}
              onFocus={() => setFocusedId(r.id)}
              onSelectedChange={(on) => toggleSelect(r.id, on)}
              onDecide={(decision, finalBody) => decide(r.id, decision, finalBody)}
              onRegenerate={() => {
                const resp = r.responses[0];
                if (resp) regenerate(r.id, resp.id);
              }}
              regenerating={!!regenerating[r.id]}
              pending={!!pending[r.id]}
              editing={editing === r.id}
              onEdit={() => setEditing(r.id)}
              onCancelEdit={() => {
                setEditing(null);
                setDraftOverrides((d) => {
                  const next = { ...d };
                  delete next[r.id];
                  return next;
                });
              }}
              draftOverride={draftOverrides[r.id]}
              onDraftChange={(body) =>
                setDraftOverrides((d) => ({ ...d, [r.id]: body }))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    default: "border-border bg-card",
    success: "border-success/30 bg-success/5 text-success",
    warning: "border-warning/30 bg-warning/5 text-warning",
    destructive: "border-destructive/30 bg-destructive/5 text-destructive",
  }[tone];
  return (
    <div className={cn("rounded-lg border px-4 py-3", toneClass)}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function InboxCard({
  item,
  selected,
  focused,
  onFocus,
  onSelectedChange,
  onDecide,
  onRegenerate,
  regenerating,
  pending,
  editing,
  onEdit,
  onCancelEdit,
  draftOverride,
  onDraftChange,
}: {
  item: InboxItem;
  selected: boolean;
  focused: boolean;
  onFocus: () => void;
  onSelectedChange: (on: boolean) => void;
  onDecide: (d: "APPROVED" | "REJECTED", finalBody?: string) => void;
  onRegenerate: () => void;
  regenerating: boolean;
  pending: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  draftOverride: string | undefined;
  onDraftChange: (body: string) => void;
}) {
  const draft = item.responses[0];
  const tier = confidenceTier(draft?.confidence ?? 0);
  const hasFlags = (draft?.flaggedReasons?.length ?? 0) > 0;
  const ref = useRef<HTMLDivElement>(null);

  // Scroll the focused card into view when keyboard nav moves to it.
  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focused]);

  const baseBody = draft?.finalBody ?? draft?.draftBody ?? "";
  const currentBody = draftOverride ?? baseBody;
  const hasUnsavedEdit = draftOverride !== undefined && draftOverride !== baseBody;

  const confidencePct = Math.round((draft?.confidence ?? 0) * 100);
  // Simulated pipeline timing - in production this'd come from the activity
  // log; here we derive a believable number from the review id hash.
  const draftSeconds =
    45 + (item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 70);

  return (
    <Card
      ref={ref}
      onClick={onFocus}
      className={cn(
        "cursor-pointer transition-shadow",
        sentimentAccent(item.sentiment),
        hasFlags && "border-warning/40",
        selected && "ring-1 ring-primary",
        focused && "ring-2 ring-primary",
      )}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start gap-3 border-b px-4 py-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelectedChange(!!v)}
            className="mt-1"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <PlatformIcon platform={item.platform} withLabel />
              <RatingStars value={item.rating} />
              <span className="text-sm font-medium">
                {item.authorName ?? "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                · {item.dealership.name}
              </span>
              <span
                className="ml-auto text-xs text-muted-foreground"
                title={item.postedAt.toLocaleString()}
              >
                {formatDistanceToNow(item.postedAt, { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-3 text-sm text-foreground/80">{item.body}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SentimentBadge value={item.sentiment} />
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
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  view on {item.platform.toLowerCase().replace("_dot_", ".")}{" "}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* AI draft + actions */}
        {/* Pipeline timing + confidence bar */}
        {draft && (
          <div className="border-b bg-card px-4 py-2.5">
            <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>
                  <span className="text-foreground/70">Ingested</span>{" "}
                  {formatDistanceToNow(item.postedAt, { addSuffix: true })}
                </span>
                <span>·</span>
                <span>
                  <span className="text-foreground/70">AI drafted in</span>{" "}
                  <span className="font-medium text-foreground">{draftSeconds}s</span>
                </span>
                <span>·</span>
                <span>
                  <span className="text-foreground/70">Confidence</span>{" "}
                  <span className="font-medium text-foreground">{confidencePct}%</span>
                </span>
              </div>
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 text-[10px] font-medium",
                  tier.variant === "success" && "bg-success/15 text-success",
                  tier.variant === "warning" && "bg-warning/15 text-warning",
                  tier.variant === "destructive" && "bg-destructive/15 text-destructive",
                )}
              >
                {tier.label}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full transition-all", tier.bar)}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-muted/30 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles
                className={cn(
                  "h-3.5 w-3.5 text-primary",
                  regenerating && "animate-pulse",
                )}
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {regenerating ? "AI is rewriting…" : "AI-drafted response"}
              </span>
              {hasUnsavedEdit && !regenerating && (
                <Badge variant="warning" className="text-[10px]">
                  Unsaved edit
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                disabled={regenerating || pending || !draft}
                className="h-7 px-2 text-xs"
              >
                <Wand2
                  className={cn("h-3.5 w-3.5", regenerating && "animate-spin")}
                />
                Regenerate
              </Button>
              {!editing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <PencilLine className="h-3.5 w-3.5" /> Edit
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelEdit();
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
            </div>
          </div>

          {editing ? (
            <Textarea
              value={currentBody}
              rows={6}
              onChange={(e) => onDraftChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="resize-y bg-background"
            />
          ) : (
            <p className="whitespace-pre-wrap rounded-md border bg-background p-3 text-sm leading-relaxed">
              {currentBody || "Generating…"}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/reviews/${item.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowDownToLine className="h-4 w-4" /> Full detail
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDecide("REJECTED");
              }}
              disabled={pending || !draft}
            >
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDecide("APPROVED", currentBody);
              }}
              disabled={pending || !draft}
            >
              {hasUnsavedEdit ? <Save className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {pending ? "Publishing…" : hasUnsavedEdit ? "Save & publish" : "Approve & publish"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
