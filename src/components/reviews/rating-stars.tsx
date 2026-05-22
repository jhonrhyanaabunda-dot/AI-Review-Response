import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RatingStars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={cn(i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")}
        />
      ))}
    </div>
  );
}
