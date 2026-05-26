import Link from "next/link";
import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { config } from "@/lib/demo/config";
import { cn } from "@/lib/utils/cn";

export const metadata = {
  title: "Pricing",
  description: "Simple per-rooftop pricing. Three tiers - Starter, Growth, Agency.",
};

export default function PricingPage() {
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
          <nav className="flex items-center gap-3">
            <Link href="/pitch" className="hidden text-sm text-muted-foreground hover:text-primary sm:inline">
              Why A3
            </Link>
            <Button asChild>
              <Link href="/dashboard">See the demo</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 md:px-12">
        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Pricing
          </span>
          <h1 className="mt-4 text-balance text-4xl font-black leading-[1.1] tracking-tight md:text-display-1">
            Per rooftop. No long-term lock-in.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            All plans include every review platform, GM approval workflow, and legal-risk
            auto-escalation. Pick the tier that matches your number of rooftops.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {config.pricing.tiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                "relative flex flex-col border-border/60 transition-all",
                tier.highlight && "border-primary/40 shadow-lg shadow-primary/5",
              )}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                  Most popular
                </span>
              )}
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tight">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.cadence}</span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.tagline}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <ul className="flex-1 space-y-2.5 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={tier.highlight ? "default" : "outline"} className="w-full">
                  <a href={config.bookACallUrl} target="_blank" rel="noreferrer">
                    {tier.ctaLabel}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-14 rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Need something different? Volume discounts and white-label terms available -{" "}
          <a
            href={config.bookACallUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            talk to sales
          </a>
          .
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Open the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pitch">See the math</Link>
          </Button>
        </div>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground md:flex-row md:px-12">
          <div>© {new Date().getFullYear()} A3 Brands. AI Review Response.</div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/pitch" className="hover:text-primary">Pitch</Link>
            <Link href="/dashboard" className="hover:text-primary">Demo</Link>
            <Link href="/security" className="hover:text-primary">Security</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <a href={config.bookACallUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
              {config.bookACallLabel}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
