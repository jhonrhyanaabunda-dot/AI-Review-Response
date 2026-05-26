"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Star,
  MessageSquare,
  Clock,
  ListFilter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ReviewRow, type ReviewRowData } from "@/components/reviews/review-row";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils/cn";
import type { ReviewFilter } from "@/lib/validation";

const SENTIMENTS = ["POSITIVE", "NEUTRAL", "NEGATIVE", "ANGRY", "LEGAL_RISK"] as const;
const STATUSES = ["NEW", "IN_PROGRESS", "RESPONDED", "IGNORED", "ESCALATED"] as const;
const PLATFORMS = ["GOOGLE", "YELP", "DEALERRATER", "CARS_DOT_COM", "FACEBOOK", "BBB"] as const;
const RATINGS = [1, 2, 3, 4, 5] as const;
const DAYS = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;
const SORTS: Array<{ value: NonNullable<ReviewFilter["sort"]>; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

type SavedView = {
  key: string;
  label: string;
  description: string;
  params: Partial<Record<keyof ReviewFilter, string>>;
};

const SAVED_VIEWS: SavedView[] = [
  {
    key: "negative-pending",
    label: "Needs attention",
    description: "Negative + still in progress",
    params: { sentiment: "NEGATIVE", status: "IN_PROGRESS" },
  },
  {
    key: "five-star",
    label: "5-star recent",
    description: "Newest 5-star reviews",
    params: { rating: "5", days: "30" },
  },
  {
    key: "legal-risk",
    label: "Legal risk",
    description: "Anything the AI flagged",
    params: { sentiment: "LEGAL_RISK" },
  },
];

type Stats = {
  total: number;
  avgRating: number;
  respondedCount: number;
  pendingCount: number;
  pendingRatio: number;
};

function StatCard({
  label,
  value,
  Icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  Icon: typeof Star;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className={cn("mt-0.5 text-2xl font-black tracking-tight", accent)}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function ReviewsClient({
  initial,
  initialNextCursor,
  filter,
  stats,
}: {
  initial: ReviewRowData[];
  initialNextCursor?: string;
  filter: ReviewFilter;
  stats: Stats;
}) {
  const router = useRouter();
  const { request } = useApi();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(filter.q ?? "");
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // Debounced search so the URL doesn't update on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((filter.q ?? "") === q) return;
      const next = new URLSearchParams(params.toString());
      if (!q.trim()) next.delete("q");
      else next.set("q", q.trim());
      next.delete("cursor");
      router.push(`/reviews?${next.toString()}`);
    }, 250);
    return () => clearTimeout(handle);
    // We intentionally only react to q changes here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("cursor");
    router.push(`/reviews?${next.toString()}`);
  };

  const applyView = (view: SavedView) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(view.params)) {
      if (v) next.set(k, v);
    }
    router.push(`/reviews?${next.toString()}`);
  };

  const clearAll = () => {
    setQ("");
    router.push("/reviews");
  };

  const visible = useMemo(
    () => initial.filter((r) => !hidden.has(r.id)),
    [initial, hidden],
  );

  const visibleSelected = useMemo(
    () => Array.from(selected).filter((id) => !hidden.has(id)),
    [selected, hidden],
  );

  const toggleSelectAll = (on: boolean) => {
    if (on) {
      setSelected(new Set(visible.map((r) => r.id)));
    } else {
      setSelected(new Set());
    }
  };

  const bulkApprove = async () => {
    if (visibleSelected.length === 0) return;
    setHidden((h) => {
      const next = new Set(h);
      visibleSelected.forEach((id) => next.add(id));
      return next;
    });
    try {
      const res = await request<{ approved: number }>(
        "/api/responses/bulk-approve",
        {
          method: "POST",
          body: JSON.stringify({ reviewIds: visibleSelected }),
        },
      );
      toast.success(`Approved ${res.approved}`);
      setSelected(new Set());
      startTransition(() => router.refresh());
    } catch (e) {
      setHidden((h) => {
        const next = new Set(h);
        visibleSelected.forEach((id) => next.delete(id));
        return next;
      });
      toast.error((e as Error).message);
    }
  };

  const bulkReject = async () => {
    if (visibleSelected.length === 0) return;
    const ids = visibleSelected;
    setHidden((h) => {
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
      toast.success(`Rejected ${ids.length}`);
      setSelected(new Set());
      startTransition(() => router.refresh());
    } catch (e) {
      setHidden((h) => {
        const next = new Set(h);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.error((e as Error).message);
    }
  };

  const exportCsv = () => {
    if (visible.length === 0) {
      toast.info("Nothing to export with the current filters.");
      return;
    }
    const headers = [
      "id",
      "platform",
      "rating",
      "author",
      "dealership",
      "postedAt",
      "status",
      "sentiment",
      "body",
    ];
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const rows = visible.map((r) =>
      [
        r.id,
        r.platform,
        r.rating,
        r.authorName,
        r.dealership.name,
        r.postedAt instanceof Date ? r.postedAt.toISOString() : r.postedAt,
        r.status,
        r.sentiment,
        r.body,
      ]
        .map(escape)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reviews-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${visible.length} reviews to CSV`);
  };

  const activeFilterCount = [
    filter.platform,
    filter.status,
    filter.sentiment,
    filter.rating,
    filter.days && filter.days !== "all" ? filter.days : null,
    filter.q,
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            All platforms
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tight md:text-display-3">
            Reviews
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every review across every connected platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total.toLocaleString()}
          Icon={MessageSquare}
          sub={activeFilterCount > 0 ? "matching filters" : "in this view"}
        />
        <StatCard
          label="Avg rating"
          value={stats.avgRating.toFixed(2)}
          accent="text-warning"
          Icon={Star}
        />
        <StatCard
          label="Responded"
          value={`${stats.respondedCount} (${
            stats.total ? Math.round((stats.respondedCount / stats.total) * 100) : 0
          }%)`}
          accent="text-success"
          Icon={CheckCircle2}
        />
        <StatCard
          label="Pending approval"
          value={stats.pendingCount.toString()}
          Icon={Clock}
          sub={
            stats.pendingRatio > 0
              ? `${Math.round(stats.pendingRatio * 100)}% of total`
              : undefined
          }
        />
      </div>

      {/* Saved-view chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <ListFilter className="h-3 w-3" /> Quick views
        </span>
        {SAVED_VIEWS.map((view) => (
          <button
            key={view.key}
            type="button"
            onClick={() => applyView(view)}
            className="group inline-flex items-center gap-1 rounded-pill border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            title={view.description}
          >
            {view.label}
          </button>
        ))}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            Clear filters ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reviews..."
            className="w-64 pl-8"
          />
        </div>
        <Select
          value={filter.platform ?? "all"}
          onValueChange={(v) => setParam("platform", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p.replace("_DOT_", ".").toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.status ?? "all"}
          onValueChange={(v) => setParam("status", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ").toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.sentiment ?? "all"}
          onValueChange={(v) => setParam("sentiment", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any sentiment</SelectItem>
            {SENTIMENTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ").toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.rating ? String(filter.rating) : "all"}
          onValueChange={(v) => setParam("rating", v)}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any rating</SelectItem>
            {RATINGS.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} star{r === 1 ? "" : "s"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(filter.days ?? "all")}
          onValueChange={(v) => setParam("days", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.sort ?? "newest"}
          onValueChange={(v) => setParam("sort", v === "newest" ? undefined : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selection toolbar (sticky-ish) */}
      {visible.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                visibleSelected.length > 0 &&
                visibleSelected.length === visible.length
              }
              onCheckedChange={(v) => toggleSelectAll(!!v)}
            />
            <span className="text-xs text-muted-foreground">
              {visibleSelected.length > 0
                ? `${visibleSelected.length} of ${visible.length} selected`
                : `${visible.length} shown`}
            </span>
          </div>
          {visibleSelected.length > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={bulkReject}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button size="sm" variant="success" onClick={bulkApprove}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        {visible.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {initial.length === 0
              ? "No reviews match these filters."
              : "All visible reviews handled."}
          </div>
        ) : (
          visible.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              selected={selected.has(r.id)}
              onSelectedChange={(on) => {
                setSelected((s) => {
                  const next = new Set(s);
                  if (on) next.add(r.id);
                  else next.delete(r.id);
                  return next;
                });
              }}
            />
          ))
        )}
      </div>

      {initialNextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setParam("cursor", initialNextCursor)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
