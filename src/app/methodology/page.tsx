import Link from "next/link";
import {
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  Layers,
  Wand2,
  CheckCircle2,
  Inbox,
  X,
  Presentation,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LoopDiagram } from "@/components/marketing/loop-diagram";
import { config } from "@/lib/demo/config";

export const metadata = {
  title: "Methodology",
  description:
    "The 90-Second Response Method - the five-pillar loop A3 Brands uses to get every dealership review answered in under two minutes.",
};

const PILLAR_ICONS = [Inbox, Layers, Wand2, ShieldCheck, CheckCircle2] as const;

export default function MethodologyPage() {
  const m = config.methodology;
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-a3-navy text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(at 20% 20%, rgba(29,185,84,0.35) 0px, transparent 50%), radial-gradient(at 80% 60%, rgba(29,185,84,0.15) 0px, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-[1200px] px-6 py-20 md:px-12 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
            <Sparkles className="h-3 w-3 text-primary" /> Methodology
          </span>
          <h1 className="mt-6 text-balance text-[40px] font-black leading-[1.05] tracking-tight md:text-display-1">
            {m.name}.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/75 md:text-lg">
            {m.subtitle}
          </p>
          {m.promise && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary md:text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>{m.promise}</span>
            </div>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href="/api/methodology/deck.pptx" download>
                <Download className="h-4 w-4" /> Download PowerPoint
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-primary"
            >
              <Link href="/methodology/deck">
                <Presentation className="h-4 w-4" /> Open the deck
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Link href="/dashboard">
                Open the demo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Loop diagram + pillar list */}
      <section className="bg-background">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:px-12 md:py-24">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              The loop
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-display-2">
              Five pillars. One continuous loop.
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              The method is a loop, not a funnel. Every published reply feeds
              back into tone calibration for the next one. The median round-trip
              is under 90 seconds.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {m.pillars.map((p) => (
                <div
                  key={p.key}
                  className="rounded-lg border border-border/60 bg-card px-3 py-2"
                >
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Step {p.step}
                  </div>
                  <div className="text-sm font-bold tracking-tight">{p.name}</div>
                </div>
              ))}
            </div>
          </div>
          <LoopDiagram pillars={m.pillars} />
        </div>
      </section>

      {/* Pillar deep-dive */}
      <section className="bg-a3-surface">
        <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-12">
          <div className="mb-12 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              The pillars
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-display-2">
              The 5 C&apos;s, in detail.
            </h2>
          </div>
          <div className="space-y-4">
            {m.pillars.map((p, i) => {
              const Icon = PILLAR_ICONS[i] ?? Sparkles;
              return (
                <Card key={p.key} className="overflow-hidden border-border/60 bg-background">
                  <CardContent className="grid gap-6 p-6 md:grid-cols-[200px_1fr_140px] md:gap-8 md:p-8">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Step {String(p.step).padStart(2, "0")}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="text-2xl font-black tracking-tight">
                          {p.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {p.tagline}
                      </p>
                    </div>
                    <div>
                      <p className="text-pretty text-sm leading-relaxed text-foreground/80">
                        {p.body}
                      </p>
                    </div>
                    <div className="flex flex-col items-start justify-center rounded-md border border-dashed bg-muted/30 p-4 md:items-center md:text-center">
                      <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Proof
                      </div>
                      <div className="mt-0.5 text-xl font-black tracking-tight">
                        {p.proof}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operating principles */}
      <section className="bg-background">
        <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-12">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Operating principles
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-display-2">
              The non-negotiables.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              The four rules every dealership account inherits the day they
              switch on.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {m.principles.map((p) => (
              <div
                key={p.title}
                className="rounded-lg border border-border/60 bg-card p-6"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-bold">{p.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Without vs With */}
      <section className="bg-a3-surface">
        <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-12">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              The difference
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-display-2">
              Without vs with the method.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
                <X className="h-3.5 w-3.5" /> Without it
              </div>
              <h3 className="mt-2 text-lg font-black tracking-tight">
                Reviews pile up, voice drifts, risk leaks.
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {m.without.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/5 p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-success">
                <Check className="h-3.5 w-3.5" /> With it
              </div>
              <h3 className="mt-2 text-lg font-black tracking-tight">
                Every review answered, on brand, with a paper trail.
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {m.with.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-a3-navy text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-6 py-16 text-center md:px-12">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight md:text-display-2">
            Want to see the loop run on real reviews?
          </h2>
          <p className="max-w-xl text-sm text-white/70">
            The demo runs the method end-to-end on a seeded dealership console -
            approve, reject, regenerate, and watch the loop close in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Open the demo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-primary"
            >
              <a href={config.bookACallUrl} target="_blank" rel="noreferrer">
                {config.bookACallLabel}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
