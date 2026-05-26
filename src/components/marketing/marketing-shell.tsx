import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/demo/config";

/**
 * Shared chrome for marketing pages (pitch, pricing, privacy, terms,
 * security). Keeps the nav + footer in one place so adding a link
 * means editing one file.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-6 md:px-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">A3 BRANDS</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                AI Review Response
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5 text-sm text-foreground/80">
            <Link href="/methodology" className="hidden hover:text-primary sm:inline">Method</Link>
            <Link href="/pitch" className="hidden hover:text-primary sm:inline">Why A3</Link>
            <Link href="/pricing" className="hidden hover:text-primary sm:inline">Pricing</Link>
            <Button asChild size="sm">
              <Link href="/dashboard">See the demo</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-14">
          <div>© {new Date().getFullYear()} A3 Brands. AI Review Response.</div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/methodology" className="hover:text-primary">Method</Link>
            <Link href="/pitch" className="hover:text-primary">Pitch</Link>
            <Link href="/pricing" className="hover:text-primary">Pricing</Link>
            <Link href="/security" className="hover:text-primary">Security</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <a
              href={config.bookACallUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary"
            >
              {config.bookACallLabel}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
