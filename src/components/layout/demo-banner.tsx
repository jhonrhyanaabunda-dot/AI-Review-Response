"use client";
import { useState } from "react";
import { X, Info } from "lucide-react";

const DISMISS_KEY = "a3_demo_banner_dismissed";

export function DemoBanner({ text }: { text: string }) {
  // Render only after mount so the dismissal state doesn't flash.
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // useEffect alternative without import: lazy-eval on first client paint.
  if (typeof window !== "undefined" && !mounted) {
    setMounted(true);
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
  }

  if (!mounted || dismissed) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/5 px-4 py-2.5 text-xs md:px-6">
      <div className="mx-auto flex max-w-7xl items-center gap-2 text-foreground/80">
        <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="flex-1 leading-snug">{text}</p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            window.sessionStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
