import Link from "next/link";
import { Sparkles, Clock, Star, DollarSign, ShieldCheck, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "A3 Brands AI Review Response - Pitch",
  description:
    "Why dealership clients need automated review response - the math, the moat, and the rollout plan.",
};

export default function PitchPage() {
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
          <Button asChild>
            <Link href="/dashboard">See the demo</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <span className="inline-flex items-center gap-2 rounded-pill border border-primary/30 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
          Internal pitch · Kelly → Tim
        </span>
        <h1 className="mt-6 text-balance text-4xl font-black leading-[1.1] tracking-tight md:text-display-1">
          AI Review Response -{" "}
          <span className="text-primary">sellable to every dealership client.</span>
        </h1>
        <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          Dealership GMs spend hours every week chasing reviews across six different
          platforms - and most go unanswered. A3 Brands AI Review Response makes the
          response one click instead of one hour.
        </p>

        <section className="mt-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            The problem
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-display-3">
            Reviews pile up. GMs can't respond fast enough.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              The average dealership receives{" "}
              <strong className="text-foreground">15-40 new public reviews/month</strong>{" "}
              across Google, Yelp, Cars.com, DealerRater, Facebook, and BBB.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              Most dealerships only respond to{" "}
              <strong className="text-foreground">30-50%</strong> - and almost never
              within 24 hours.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              Unanswered negative reviews{" "}
              <strong className="text-foreground">tank star ratings</strong>, which
              directly costs SRP impressions, foot traffic, and CSI scores.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              GMs can't write 40 thoughtful, on-brand responses a month - and
              shouldn't have to.
            </li>
          </ul>
        </section>

        <section className="mt-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            The solution
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-display-3">
            One inbox. One click. Six platforms.
          </h2>
          <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed">
            Auto-pull every review from <strong>six platforms</strong> into one inbox,
            let the AI draft a tone-matched response, and let the GM publish it with{" "}
            <strong>one click</strong>.
          </p>
        </section>

        <section className="mt-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            The numbers don't lie
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-display-3">
            The ROI math - per dealership.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Conservative assumptions.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                Icon: Clock,
                stat: "~12 hrs / mo",
                label:
                  "GM time saved at 30 reviews × 25 min each - reclaimed for ops and customer care.",
              },
              {
                Icon: Star,
                stat: "+0.3 ★",
                label:
                  "Average rating lift over 90 days from responding consistently and on time.",
              },
              {
                Icon: ShieldCheck,
                stat: "0 missed",
                label:
                  "Legal-risk and BBB complaints - auto-flagged for GM + legal review before any public reply.",
              },
              {
                Icon: DollarSign,
                stat: "$299 / mo",
                label:
                  "Suggested A3 Brands price per rooftop. Bundle pricing for groups.",
              },
            ].map(({ Icon, stat, label }) => (
              <Card key={stat} className="border-border/60">
                <CardContent className="p-6">
                  <Icon className="mb-3 h-5 w-5 text-primary" />
                  <div className="text-3xl font-black tracking-tight text-foreground">
                    {stat}
                  </div>
                  <div className="mt-1 h-0.5 w-8 rounded-full bg-primary" />
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            The moat
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-display-3">
            Why A3 Brands wins this.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            {[
              {
                t: "Existing dealership relationships.",
                d: "A3 Brands already serves this exact buyer - no cold acquisition.",
              },
              {
                t: "BBB included.",
                d: "Most competitors ignore BBB. Dealerships care because BBB complaints actually move the needle in their market.",
              },
              {
                t: "Agency-grade multi-tenant.",
                d: "Built from day one to manage 50+ rooftops from one console.",
              },
              {
                t: "GM-friendly UX.",
                d: "One click. Not a workflow editor. Not a Zapier. A button.",
              },
              {
                t: "Legal-safe by default.",
                d: "Lawyers, lemon-law claims, regulator threats - auto-flagged for human review. Never auto-publish into a lawsuit.",
              },
            ].map(({ t, d }) => (
              <li key={t} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">{t}</strong> {d}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Rollout
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-display-3">
            How we ship this.
          </h2>
          <ol className="mt-6 space-y-4 text-sm text-muted-foreground">
            {[
              {
                phase: "Week 1-2",
                body: "Pilot with 1-2 friendly A3 Brands dealership clients. Real Google + Yelp + Facebook integrations.",
              },
              {
                phase: "Week 3-4",
                body: "Add Cars.com + DealerRater partner integration. Onboard 5 more rooftops.",
              },
              {
                phase: "Month 2",
                body: "Add BBB and launch publicly to the full A3 Brands client base.",
              },
              {
                phase: "Month 3+",
                body: "Cross-sell the second product idea on top of the same console.",
              },
            ].map(({ phase, body }) => (
              <li key={phase} className="flex gap-4 rounded-lg border border-border/60 p-4">
                <span className="shrink-0 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                  {phase}
                </span>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Open the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Back to overview</Link>
          </Button>
        </div>
      </main>

      <footer className="mt-16 border-t bg-background">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center text-xs text-muted-foreground">
          A3 Brands AI Review Response - prototype. Internal pitch document.
        </div>
      </footer>
    </div>
  );
}
