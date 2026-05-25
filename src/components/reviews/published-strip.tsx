import { formatDistanceToNow } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import type { ReviewPlatform } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformIcon } from "./platform-icon";

export type PublishedItem = {
  reviewId: string;
  platform: ReviewPlatform;
  authorName: string | null;
  dealership: string;
  publishedAt: Date;
};

/**
 * "Recently published" strip - surfaces approvals that just shipped so the
 * GM sees the outcome of their one-click action immediately when they
 * return to the inbox.
 */
export function PublishedStrip({ items }: { items: PublishedItem[] }) {
  if (items.length === 0) return null;
  return (
    <Card className="border-success/30 bg-success/5">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Recently published ({items.length})
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div
              key={i.reviewId}
              className="flex items-center gap-2 rounded-md border bg-background/60 px-3 py-2 text-xs"
            >
              <PlatformIcon platform={i.platform} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{i.authorName ?? "Anonymous"}</div>
                <div className="truncate text-muted-foreground">
                  {i.dealership} · {formatDistanceToNow(i.publishedAt, { addSuffix: true })}
                </div>
              </div>
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-medium text-success">
                live
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
