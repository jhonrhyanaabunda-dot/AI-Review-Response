import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Sparkles,
  Inbox,
  CheckCircle2,
  Send,
  Brain,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { PlatformIcon } from "@/components/reviews/platform-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReviewPlatform } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  const platforms: ReviewPlatform[] = [
    "GOOGLE",
    "YELP",
    "DEALERRATER",
    "CARS_DOT_COM",
    "FACEBOOK",
    "BBB",
  ];

  const steps = [
    {
      Icon: Inbox,
      title: "Auto-pull reviews",
      body: "Every few minutes we sync new reviews from all six platforms straight into a unified inbox.",
    },
    {
      Icon: Brain,
      title: "AI drafts the response",
      body: "Our agent classifies sentiment, matches your dealership's tone, and writes a publish-ready reply.",
    },
    {
      Icon: ShieldCheck,
      title: "Auto-escalate the risky ones",
      body: "Legal-risk language, BBB complaints, and angry customers are flagged for GM + legal review before anything goes public.",
    },
    {
      Icon: CheckCircle2,
      title: "One-click GM approval",
      body: "Your GM scans, edits if needed, and clicks Approve. That's it.",
    },
    {
      Icon: Send,
      title: "Published back to the platform",
      body: "The approved reply lands on Google, Yelp, BBB - wherever the review came from.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav - A3 charcoal text on white, emerald hover */}
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-6 md:px-14">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">A3 BRANDS</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                AI Review Response
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/pitch" className="hidden text-sm font-normal text-foreground/80 transition-colors hover:text-primary sm:inline">
              Why A3
            </Link>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* HERO - DESIGN.md §4 "Dark Container": navy bg, white text, 56-64px padding */}
      <section className="relative overflow-hidden bg-a3-navy text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(at 20% 20%, rgba(29,185,84,0.3) 0px, transparent 50%), radial-gradient(at 80% 60%, rgba(29,185,84,0.15) 0px, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-[1440px] px-6 py-20 md:px-14 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              New A3 Brands product · for dealership clients
            </span>
            <h1 className="mt-8 text-balance text-[40px] font-black leading-[1.05] tracking-tight md:text-display-1">
              Every review answered.
              <br />
              <span className="text-primary">By the AI. Approved by your GM.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/70 md:text-lg">
              A3 Brands AI Review Response auto-pulls reviews from Google, Yelp,
              Cars.com, DealerRater, Facebook, and BBB. AI drafts the reply. The GM
              approves with one click. We publish it back to the platform -
              automatically.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  See the demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-primary">
                <Link href="/pitch">How it pays for itself</Link>
              </Button>
            </div>
          </div>

          {/* Platforms strip */}
          <div className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-lg border border-white/10 bg-white/5 px-6 py-4 text-xs text-white/70">
            <span className="font-bold uppercase tracking-[0.15em] text-white/90">
              Connects to
            </span>
            {platforms.map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <PlatformIcon platform={p} />
                <span className="capitalize">
                  {p
                    .replace("CARS_DOT_COM", "Cars.com")
                    .replace("DEALERRATER", "DealerRater")
                    .replace("FACEBOOK", "Facebook")
                    .replace("GOOGLE", "Google")
                    .replace("YELP", "Yelp")
                    .replace("BBB", "BBB")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - light surface section */}
      <section className="bg-a3-surface">
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-14">
          <div className="mb-14 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              The flow
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-display-2">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              From new review to published reply - typically under 90 seconds.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {steps.map(({ Icon, title, body }, i) => (
              <Card key={title} className="border-border/60 bg-background">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Step {i + 1}
                  </div>
                  <h3 className="mt-1.5 text-base font-bold">{title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* STATS - A3 numbers-don't-lie style */}
      <section className="bg-background">
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-14">
          <div className="mb-12 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              The numbers don't lie
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-display-2">
              Built to convert.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { stat: "90s", label: "Median time from new review to published reply - vs. days or weeks today." },
              { stat: "6", label: "Review platforms in one inbox. Including BBB - which most tools skip." },
              { stat: "1-click", label: "What it takes for a GM to approve a reply and have it published back." },
            ].map((s) => (
              <Card key={s.stat} className="border-border/60">
                <CardContent className="p-8">
                  <div className="text-5xl font-black tracking-tight text-foreground">
                    {s.stat}
                  </div>
                  <div className="mt-2 h-0.5 w-10 rounded-full bg-primary" />
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA - dark band */}
      <section className="bg-a3-navy text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-6 px-6 py-16 text-center md:px-14">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight md:text-display-2">
            Ready to see it live?
          </h2>
          <p className="max-w-xl text-sm text-white/70">
            The demo runs against a seeded A3 Brands console with two dealerships and
            48 reviews across all six platforms.
          </p>
          <Button asChild size="lg">
            <Link href="/login">
              Open the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground md:flex-row md:px-14">
          <div>© {new Date().getFullYear()} A3 Brands. AI Review Response - prototype.</div>
          <div className="flex items-center gap-5">
            <Link href="/pitch" className="hover:text-primary">Pitch</Link>
            <Link href="/login" className="hover:text-primary">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
