import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-3 w-20" />
          </div>
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <div className="mt-4 rounded-md border bg-muted/30 p-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
