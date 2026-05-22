import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight } from "lucide-react";
import type { ReviewPlatform, Sentiment, ReviewStatus } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { RatingStars } from "./rating-stars";
import { PlatformIcon } from "./platform-icon";
import { SentimentBadge } from "./sentiment-badge";
import { Badge } from "@/components/ui/badge";

export type ReviewRowData = {
  id: string;
  platform: ReviewPlatform;
  rating: number;
  authorName: string | null;
  body: string;
  postedAt: Date;
  status: ReviewStatus;
  sentiment: Sentiment | null;
  dealership: { name: string };
  responses: Array<{ id: string; status: string; draftBody: string; finalBody: string | null }>;
};

const STATUS_VARIANT: Record<ReviewStatus, "default" | "muted" | "warning" | "success" | "destructive"> = {
  NEW: "default",
  IN_PROGRESS: "warning",
  RESPONDED: "success",
  IGNORED: "muted",
  ESCALATED: "destructive",
};

export function ReviewRow({
  review,
  selected,
  onSelectedChange,
}: {
  review: ReviewRowData;
  selected: boolean;
  onSelectedChange: (next: boolean) => void;
}) {
  return (
    <Link
      href={`/reviews/${review.id}`}
      className="group flex items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div onClick={(e) => e.preventDefault()} className="pt-0.5">
        <Checkbox checked={selected} onCheckedChange={(v) => onSelectedChange(!!v)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={review.platform} />
          <RatingStars value={review.rating} />
          <span className="text-sm font-medium">{review.authorName ?? "Anonymous"}</span>
          <span className="text-xs text-muted-foreground">· {review.dealership.name}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(review.postedAt, { addSuffix: true })}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{review.body}</p>
        <div className="mt-2 flex items-center gap-2">
          <SentimentBadge value={review.sentiment} />
          <Badge variant={STATUS_VARIANT[review.status]} className="capitalize">
            {review.status.replace("_", " ").toLowerCase()}
          </Badge>
          {review.responses[0] && (
            <Badge variant="outline" className="capitalize">
              {review.responses[0].status.replace("_", " ").toLowerCase()}
            </Badge>
          )}
        </div>
      </div>
      <ChevronRight className="mt-2 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
