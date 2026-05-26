"use client";
import { useMemo, useState } from "react";
import type { ReviewPlatform } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

const PLATFORM_LABEL: Record<ReviewPlatform, string> = {
  GOOGLE: "Google",
  YELP: "Yelp",
  DEALERRATER: "DealerRater",
  CARS_DOT_COM: "Cars.com",
  FACEBOOK: "Facebook",
  BBB: "BBB",
};

const PLATFORM_COLOR: Record<ReviewPlatform, string> = {
  GOOGLE: "#0EA5E9",
  YELP: "#EF4444",
  DEALERRATER: "#10B981",
  CARS_DOT_COM: "#F97316",
  FACEBOOK: "#3B82F6",
  BBB: "#6366F1",
};

export type PlatformBarsData = Array<{
  platform: ReviewPlatform;
  count: number;
  avgRating: number;
}>;

export function PlatformBars({ data }: { data: PlatformBarsData }) {
  const [hovered, setHovered] = useState<ReviewPlatform | null>(null);

  const rows = useMemo(
    () =>
      data
        .map((d) => ({
          ...d,
          label: PLATFORM_LABEL[d.platform],
          color: PLATFORM_COLOR[d.platform],
        }))
        .sort((a, b) => b.count - a.count),
    [data],
  );

  const total = useMemo(() => rows.reduce((s, r) => s + r.count, 0), [rows]);
  const maxCount = useMemo(() => Math.max(1, ...rows.map((r) => r.count)), [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reviews per platform</CardTitle>
        <p className="text-xs text-muted-foreground">
          {total.toLocaleString()} total across {rows.length} platform
          {rows.length === 1 ? "" : "s"}.
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        {rows.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No reviews in range.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r, i) => {
              const pct = (r.count / maxCount) * 100;
              const sharePct = total ? (r.count / total) * 100 : 0;
              const isHovered = hovered === r.platform;
              return (
                <li
                  key={r.platform}
                  onMouseEnter={() => setHovered(r.platform)}
                  onMouseLeave={() => setHovered(null)}
                  className="group cursor-default"
                >
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="grid h-4 w-4 place-items-center rounded-sm text-[9px] font-extrabold uppercase text-white shadow-sm"
                        style={{ background: r.color }}
                        aria-hidden
                      >
                        {r.label[0]}
                      </span>
                      <span className="font-medium text-foreground">{r.label}</span>
                      <span className="text-muted-foreground">
                        · {sharePct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        <span className="tabular-nums text-foreground">
                          {r.avgRating.toFixed(1)}
                        </span>
                      </span>
                      <span className="tabular-nums">{r.count}</span>
                    </div>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full origin-left rounded-full transition-[width,filter] duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        // Stagger reveal: delay each bar by 80ms via animation.
                        background: `linear-gradient(90deg, ${r.color}, ${r.color}cc)`,
                        filter: isHovered ? "brightness(1.1) saturate(1.1)" : "none",
                        animation: `barGrow 800ms ${i * 80}ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <style jsx>{`
          @keyframes barGrow {
            from {
              transform: scaleX(0);
            }
            to {
              transform: scaleX(1);
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
