"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReviewRow, type ReviewRowData } from "@/components/reviews/review-row";
import { Button } from "@/components/ui/button";
import type { ReviewFilter } from "@/lib/validation";

const SENTIMENTS = ["POSITIVE", "NEUTRAL", "NEGATIVE", "ANGRY", "LEGAL_RISK"] as const;
const STATUSES = ["NEW", "IN_PROGRESS", "RESPONDED", "IGNORED", "ESCALATED"] as const;
const PLATFORMS = ["GOOGLE", "YELP", "DEALERRATER", "CARS_DOT_COM", "FACEBOOK", "BBB"] as const;

export function ReviewsClient({
  initial,
  initialNextCursor,
  filter,
}: {
  initial: ReviewRowData[];
  initialNextCursor?: string;
  filter: ReviewFilter;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(filter.q ?? "");

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete("cursor");
    router.push(`/reviews?${next.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            All platforms
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tight md:text-display-3">Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">All reviews across every connected platform.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("q", q || undefined);
            }}
            placeholder="Search reviews..."
            className="w-72 pl-8"
          />
        </div>
        <Select
          value={filter.platform ?? "all"}
          onValueChange={(v) => setParam("platform", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>{p.replace("_DOT_", ".").toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.status ?? "all"}
          onValueChange={(v) => setParam("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ").toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.sentiment ?? "all"}
          onValueChange={(v) => setParam("sentiment", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any sentiment</SelectItem>
            {SENTIMENTS.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ").toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {initial.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No reviews match.</div>
        ) : (
          initial.map((r) => (
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
          <Button variant="outline" onClick={() => setParam("cursor", initialNextCursor)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
