import { cn } from "@/lib/utils/cn";

/**
 * Skeleton placeholder block. Animated pulse on a muted surface.
 * Compose multiple `Skeleton` blocks to mimic the final layout while
 * data loads — keeps perceived performance high.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  );
}
