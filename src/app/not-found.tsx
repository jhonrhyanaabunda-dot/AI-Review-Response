import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">404</p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            We couldn&apos;t find that page.
          </h1>
          <p className="text-sm text-muted-foreground">
            It might have moved, or the link could be off by a character. Head back to the
            demo or the landing page.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">
              Open the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
