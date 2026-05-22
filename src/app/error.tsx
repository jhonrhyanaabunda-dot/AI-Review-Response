"use client";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
