"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Inbox,
  Layers,
  Wand2,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Maximize2,
  ArrowLeft,
  Check,
  X,
  Star,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { Methodology } from "@/lib/demo/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ConfigLike = {
  bookACallUrl: string;
  bookACallLabel: string;
  pricing: { tiers: Array<{ name: string; price: string; cadence: string; tagline: string; highlight: boolean }> };
};

const PILLAR_ICONS = [Inbox, Layers, Wand2, ShieldCheck, CheckCircle2] as const;

// ─────────────────────────── Slide definitions ───────────────────────────

type SlideKind =
  | "title"
  | "problem"
  | "promise"
  | "loop"
  | "pillar"
  | "principles"
  | "vs"
  | "proof"
  | "pricing"
  | "cta";

type Slide = { kind: SlideKind; payload?: unknown };

function buildSlides(m: Methodology): Slide[] {
  return [
    { kind: "title" },
    { kind: "problem" },
    { kind: "promise" },
    { kind: "loop" },
    ...m.pillars.map((p, i) => ({ kind: "pillar" as const, payload: { pillar: p, index: i } })),
    { kind: "principles" },
    { kind: "vs" },
    { kind: "proof" },
    { kind: "pricing" },
    { kind: "cta" },
  ];
}

// ─────────────────────────── Component ───────────────────────────

export function DeckClient({
  methodology,
  config,
}: {
  methodology: Methodology;
  config: ConfigLike;
}) {
  const slides = useMemo(() => buildSlides(methodology), [methodology]);
  const [idx, setIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  const next = useCallback(
    () => setIdx((i) => Math.min(slides.length - 1, i + 1)),
    [slides.length],
  );
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        setIdx(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setIdx(slides.length - 1);
      } else if (e.key === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, slides.length]);

  function toggleFullscreen() {
    const el = deckRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function printDeck() {
    window.print();
  }

  async function downloadPptx() {
    setDownloading(true);
    try {
      const PptxGenJS = await loadPptxFromCdn();
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
      pptx.title = `${methodology.name} - A3 Brands`;
      pptx.author = "A3 Brands";
      buildPptx(pptx, methodology, config);
      await pptx.writeFile({
        fileName: "A3-Brands-90-Second-Response-Method.pptx",
      });
      toast.success("Downloaded .pptx — open in PowerPoint or Slides");
    } catch (e) {
      toast.error(`Couldn't export: ${(e as Error).message}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      {/* Top toolbar (hidden in print + fullscreen) */}
      <div className="deck-toolbar sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0B1220]/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link
            href="/methodology"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to method
          </Link>
          <span className="hidden text-xs text-white/40 md:inline">·</span>
          <span className="hidden text-xs text-white/60 md:inline">{methodology.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden rounded-md bg-white/5 px-2 py-1 font-mono text-[10px] text-white/60 md:inline">
            {idx + 1} / {slides.length}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            onClick={toggleFullscreen}
            title="Fullscreen (F)"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Present
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            onClick={printDeck}
            title="Print to PDF"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={downloadPptx}
            disabled={downloading}
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Exporting…" : "Download .pptx"}
          </Button>
        </div>
      </div>

      {/* Deck */}
      <div ref={deckRef} className="bg-[#0B1220]">
        {/* Single-slide viewer (screen) */}
        <div className="deck-viewer mx-auto flex max-w-[1320px] flex-col items-center gap-4 px-4 py-6">
          <SlideFrame slide={slides[idx]!} methodology={methodology} config={config} />
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={prev}
              disabled={idx === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <div className="flex items-center gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === idx ? "w-6 bg-primary" : "w-1.5 bg-white/25 hover:bg-white/50",
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={next}
              disabled={idx === slides.length - 1}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            ←/→ to navigate · F to present · P to print
          </p>
        </div>

        {/* All slides stacked for print (hidden on screen) */}
        <div className="deck-print">
          {slides.map((s, i) => (
            <SlideFrame
              key={i}
              slide={s}
              methodology={methodology}
              config={config}
              printIndex={i + 1}
              printTotal={slides.length}
            />
          ))}
        </div>
      </div>

      <style>{`
        .deck-print { display: none; }
        @media print {
          @page { size: 13.333in 7.5in; margin: 0; }
          html, body { background: #0B1220 !important; }
          .deck-toolbar, .deck-viewer { display: none !important; }
          .deck-print { display: block; }
          .slide-frame { page-break-after: always; break-after: page; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────── Slide frame ───────────────────────────

function SlideFrame({
  slide,
  methodology,
  config,
  printIndex,
  printTotal,
}: {
  slide: Slide;
  methodology: Methodology;
  config: ConfigLike;
  printIndex?: number;
  printTotal?: number;
}) {
  return (
    <div className="slide-frame relative aspect-[16/9] w-full max-w-[1280px] overflow-hidden rounded-xl bg-[#0F172A] text-white shadow-2xl ring-1 ring-white/10">
      <SlideBody slide={slide} methodology={methodology} config={config} />
      <div className="absolute bottom-3 right-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
        <Sparkles className="h-3 w-3 text-primary/70" />
        <span>A3 Brands · AI Review Response</span>
        {printIndex && printTotal && (
          <span className="ml-2 font-mono text-white/40">
            {printIndex}/{printTotal}
          </span>
        )}
      </div>
    </div>
  );
}

function SlideBody({
  slide,
  methodology,
  config,
}: {
  slide: Slide;
  methodology: Methodology;
  config: ConfigLike;
}) {
  switch (slide.kind) {
    case "title":
      return <TitleSlide methodology={methodology} />;
    case "problem":
      return <ProblemSlide />;
    case "promise":
      return <PromiseSlide methodology={methodology} />;
    case "loop":
      return <LoopSlide methodology={methodology} />;
    case "pillar": {
      const { pillar, index } = slide.payload as {
        pillar: Methodology["pillars"][number];
        index: number;
      };
      return <PillarSlide pillar={pillar} index={index} />;
    }
    case "principles":
      return <PrinciplesSlide methodology={methodology} />;
    case "vs":
      return <VsSlide methodology={methodology} />;
    case "proof":
      return <ProofSlide methodology={methodology} />;
    case "pricing":
      return <PricingSlide config={config} />;
    case "cta":
      return <CtaSlide config={config} />;
    default:
      return null;
  }
}

// ─────────────────────────── Slides ───────────────────────────

function Backdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          "radial-gradient(at 18% 22%, rgba(29,185,84,0.32) 0px, transparent 50%), radial-gradient(at 82% 70%, rgba(29,185,84,0.18) 0px, transparent 50%)",
      }}
    />
  );
}

function Brand() {
  return (
    <div className="absolute left-12 top-12 flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15">
        <span className="text-xs font-extrabold text-primary">A3</span>
      </span>
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-tight">A3 BRANDS</div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-white/60">
          AI Review Response
        </div>
      </div>
    </div>
  );
}

function TitleSlide({ methodology }: { methodology: Methodology }) {
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative flex h-full flex-col items-start justify-center px-16">
        <span className="rounded-pill border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
          Methodology
        </span>
        <h1 className="mt-6 max-w-3xl text-balance text-6xl font-black leading-[1.05] tracking-tight">
          {methodology.name}.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/70">
          {methodology.subtitle}
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          <ShieldCheck className="h-4 w-4" />
          {methodology.promise}
        </div>
      </div>
    </div>
  );
}

function ProblemSlide() {
  const items = [
    { icon: Clock, body: "Reviews go unanswered for days because nobody's checking 6 platforms." },
    { icon: AlertTriangle, body: "Negative reviews get generic replies that make things worse." },
    { icon: ShieldCheck, body: "Legal-risk language reaches the public reply box - then your legal team." },
    { icon: X, body: "No audit trail of who replied, when, or why." },
  ];
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative flex h-full items-center px-16">
        <div className="grid w-full grid-cols-2 gap-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              The problem
            </span>
            <h2 className="mt-4 text-balance text-5xl font-black leading-[1.05] tracking-tight">
              Reviews pile up. <span className="text-white/60">GMs can&apos;t keep up.</span>
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/70">
              The average rooftop sees 15–40 new reviews a month across six
              platforms. Most go unanswered. The ones that do get a reply often
              shouldn&apos;t have.
            </p>
          </div>
          <ul className="space-y-3">
            {items.map((i) => (
              <li
                key={i.body}
                className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-destructive/15 text-destructive">
                  <i.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-white/80">{i.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PromiseSlide({ methodology }: { methodology: Methodology }) {
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative flex h-full flex-col items-center justify-center px-16 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          The promise
        </span>
        <h2 className="mt-5 max-w-4xl text-balance text-6xl font-black leading-[1.0] tracking-tight">
          {methodology.promise.split(".")[0]}.
        </h2>
        <div className="mt-10 grid w-full max-w-3xl grid-cols-3 gap-4">
          {[
            { stat: "90s", label: "Median ingest → published" },
            { stat: "6", label: "Platforms in one inbox" },
            { stat: "0", label: "Unreviewed legal replies" },
          ].map((s) => (
            <div
              key={s.stat}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-5"
            >
              <div className="text-5xl font-black tracking-tight text-primary">
                {s.stat}
              </div>
              <div className="mt-2 h-0.5 w-8 rounded-full bg-primary/60" />
              <div className="mt-3 text-xs text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoopSlide({ methodology }: { methodology: Methodology }) {
  const pillars = methodology.pillars;
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative grid h-full grid-cols-[1fr_1fr] items-center gap-10 px-16">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            The loop
          </span>
          <h2 className="mt-4 text-balance text-5xl font-black leading-[1.05] tracking-tight">
            Five pillars. <span className="text-primary">One loop.</span>
          </h2>
          <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-white/70">
            The method is a loop, not a funnel. Every published reply feeds
            back into tone calibration for the next one.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {pillars.map((p) => (
              <div
                key={p.key}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2"
              >
                <span className="grid h-6 w-6 place-items-center rounded-sm bg-primary/15 text-[11px] font-extrabold text-primary">
                  {p.step}
                </span>
                <span className="text-sm font-semibold">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <LoopSvg pillars={pillars} />
        </div>
      </div>
    </div>
  );
}

function LoopSvg({ pillars }: { pillars: Methodology["pillars"] }) {
  const RADIUS = 150;
  const CENTER = 180;
  const SIZE = 360;
  const step = (Math.PI * 2) / pillars.length;
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full max-w-[360px]">
      <defs>
        <linearGradient id="deck-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1DB954" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#1DB954" stopOpacity={0.3} />
        </linearGradient>
        <radialGradient id="deck-bg">
          <stop offset="0%" stopColor="#1DB954" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#1DB954" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={CENTER} cy={CENTER} r={RADIUS + 20} fill="url(#deck-bg)" />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="url(#deck-stroke)"
        strokeWidth={2}
        strokeDasharray="5 9"
      />
      {pillars.map((p, i) => {
        const angle = -Math.PI / 2 + step * i;
        const x = CENTER + Math.cos(angle) * RADIUS;
        const y = CENTER + Math.sin(angle) * RADIUS;
        return (
          <g key={p.key}>
            <circle cx={x} cy={y} r={26} fill="#0F172A" stroke="#1DB954" strokeWidth={2} />
            <text
              x={x}
              y={y + 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              style={{ fontSize: 16, fontWeight: 800 }}
            >
              {p.step}
            </text>
            <text
              x={x}
              y={y + 46}
              textAnchor="middle"
              fill="rgba(255,255,255,0.85)"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}
            >
              {p.name.toUpperCase()}
            </text>
          </g>
        );
      })}
      <text
        x={CENTER}
        y={CENTER - 14}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2 }}
      >
        MEDIAN
      </text>
      <text
        x={CENTER}
        y={CENTER + 18}
        textAnchor="middle"
        fill="white"
        style={{ fontSize: 40, fontWeight: 800 }}
      >
        90s
      </text>
    </svg>
  );
}

function PillarSlide({
  pillar,
  index,
}: {
  pillar: Methodology["pillars"][number];
  index: number;
}) {
  const Icon = PILLAR_ICONS[index] ?? Sparkles;
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative grid h-full grid-cols-[1fr_320px] items-center gap-10 px-16">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Pillar {String(pillar.step).padStart(2, "0")} of 05
          </span>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="text-5xl font-black tracking-tight">{pillar.name}</h2>
          </div>
          <p className="mt-3 text-xl font-semibold text-white/80">{pillar.tagline}</p>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70">
            {pillar.body}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
            Proof
          </div>
          <div className="mt-2 text-4xl font-black tracking-tight">{pillar.proof}</div>
        </div>
      </div>
    </div>
  );
}

function PrinciplesSlide({ methodology }: { methodology: Methodology }) {
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative flex h-full flex-col justify-center px-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Operating principles
        </span>
        <h2 className="mt-3 text-balance text-5xl font-black leading-[1.05] tracking-tight">
          The non-negotiables.
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4">
          {methodology.principles.map((p) => (
            <div
              key={p.title}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold">{p.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VsSlide({ methodology }: { methodology: Methodology }) {
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative flex h-full flex-col justify-center px-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          The difference
        </span>
        <h2 className="mt-3 text-balance text-5xl font-black leading-[1.05] tracking-tight">
          Without vs with the method.
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-5">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
              <X className="h-3.5 w-3.5" /> Without it
            </div>
            <ul className="mt-3 space-y-2.5 text-sm">
              {methodology.without.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <span className="text-white/75">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Check className="h-3.5 w-3.5" /> With it
            </div>
            <ul className="mt-3 space-y-2.5 text-sm">
              {methodology.with.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofSlide({ methodology }: { methodology: Methodology }) {
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative flex h-full flex-col justify-center px-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          The numbers
        </span>
        <h2 className="mt-3 text-balance text-5xl font-black leading-[1.05] tracking-tight">
          Proof, per pillar.
        </h2>
        <div className="mt-10 grid grid-cols-5 gap-4">
          {methodology.pillars.map((p, i) => {
            const Icon = PILLAR_ICONS[i] ?? Sparkles;
            return (
              <div
                key={p.key}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-center"
              >
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                  {p.name}
                </div>
                <div className="mt-1 text-2xl font-black tracking-tight">{p.proof}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PricingSlide({ config }: { config: ConfigLike }) {
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative flex h-full flex-col justify-center px-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Pricing
        </span>
        <h2 className="mt-3 text-balance text-5xl font-black leading-[1.05] tracking-tight">
          Per rooftop. No lock-in.
        </h2>
        <div className="mt-8 grid grid-cols-3 gap-4">
          {config.pricing.tiers.map((t) => (
            <div
              key={t.name}
              className={cn(
                "relative rounded-lg border p-5",
                t.highlight
                  ? "border-primary/50 bg-primary/10"
                  : "border-white/10 bg-white/[0.04]",
              )}
            >
              {t.highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-pill bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                  Most popular
                </span>
              )}
              <div className="text-sm font-bold">{t.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tight">{t.price}</span>
                <span className="text-xs text-white/60">{t.cadence}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/70">{t.tagline}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaSlide({ config }: { config: ConfigLike }) {
  return (
    <div className="relative h-full">
      <Backdrop />
      <Brand />
      <div className="relative flex h-full flex-col items-center justify-center px-16 text-center">
        <Star className="h-8 w-8 fill-primary text-primary" />
        <h2 className="mt-6 max-w-3xl text-balance text-6xl font-black leading-[1.0] tracking-tight">
          See the loop run on real reviews.
        </h2>
        <p className="mt-6 max-w-xl text-base text-white/70">
          The live demo runs the method end-to-end on a seeded dealership
          console. Approve, reject, regenerate — watch the loop close in seconds.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary/90"
          >
            Open the demo
          </Link>
          <a
            href={config.bookACallUrl}
            className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            {config.bookACallLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── PPTX loader (CDN) ───────────────────────────

const PPTX_CDN_URL = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";

declare global {
  interface Window {
    PptxGenJS?: new () => PptxLike;
  }
}

let pptxLoadPromise: Promise<new () => PptxLike> | null = null;

function loadPptxFromCdn(): Promise<new () => PptxLike> {
  if (window.PptxGenJS) return Promise.resolve(window.PptxGenJS);
  if (pptxLoadPromise) return pptxLoadPromise;
  pptxLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PPTX_CDN_URL;
    script.async = true;
    script.onload = () => {
      if (window.PptxGenJS) resolve(window.PptxGenJS);
      else reject(new Error("pptxgenjs loaded but missing constructor"));
    };
    script.onerror = () => reject(new Error("Failed to load pptxgenjs from CDN"));
    document.head.appendChild(script);
  });
  return pptxLoadPromise;
}

// ─────────────────────────── PPTX builder ───────────────────────────

type PptxLike = {
  addSlide: () => PptxSlideLike;
  writeFile: (opts: { fileName: string }) => Promise<unknown>;
  layout: string;
  title?: string;
  author?: string;
};

type PptxSlideLike = {
  background?: { color?: string };
  addText: (
    text: string | Array<{ text: string; options?: Record<string, unknown> }>,
    opts: Record<string, unknown>,
  ) => PptxSlideLike;
  addShape: (shape: string, opts: Record<string, unknown>) => PptxSlideLike;
};

const NAVY = "0F172A";
const NAVY_DARK = "0B1220";
const WHITE = "FFFFFF";
const MUTED = "94A3B8";
const GREEN = "1DB954";
const RED = "EF4444";

function addBrand(slide: PptxSlideLike) {
  slide.addText("A3 BRANDS", {
    x: 0.6,
    y: 0.45,
    w: 2.5,
    h: 0.3,
    fontFace: "Inter",
    fontSize: 11,
    bold: true,
    color: WHITE,
    charSpacing: 1,
  });
  slide.addText("AI Review Response", {
    x: 0.6,
    y: 0.72,
    w: 3,
    h: 0.25,
    fontFace: "Inter",
    fontSize: 8,
    color: MUTED,
    charSpacing: 2,
  });
}

function addFooter(slide: PptxSlideLike, idx: number, total: number) {
  slide.addText(`A3 Brands · AI Review Response  ${idx}/${total}`, {
    x: 8.5,
    y: 7.0,
    w: 4.5,
    h: 0.3,
    fontFace: "Inter",
    fontSize: 8,
    color: MUTED,
    align: "right" as const,
    charSpacing: 1,
  });
}

function newSlide(pptx: PptxLike) {
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  return s;
}

function buildPptx(
  pptx: PptxLike,
  m: Methodology,
  config: ConfigLike,
) {
  const slides: Array<(s: PptxSlideLike) => void> = [];

  // 1 Title
  slides.push((s) => {
    addBrand(s);
    s.addText("Methodology", {
      x: 0.6, y: 1.6, w: 4, h: 0.4,
      fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2,
    });
    s.addText(`${m.name}.`, {
      x: 0.6, y: 2.0, w: 11, h: 2.5,
      fontFace: "Inter", fontSize: 60, bold: true, color: WHITE,
    });
    s.addText(m.subtitle, {
      x: 0.6, y: 4.6, w: 10, h: 1.6,
      fontFace: "Inter", fontSize: 16, color: MUTED, valign: "top" as const,
    });
    s.addText(`✓  ${m.promise}`, {
      x: 0.6, y: 6.4, w: 11, h: 0.5,
      fontFace: "Inter", fontSize: 13, bold: true, color: GREEN,
    });
  });

  // 2 Problem
  slides.push((s) => {
    addBrand(s);
    s.addText("The problem", {
      x: 0.6, y: 1.6, w: 4, h: 0.4,
      fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2,
    });
    s.addText("Reviews pile up. GMs can't keep up.", {
      x: 0.6, y: 2.0, w: 11, h: 1.4,
      fontFace: "Inter", fontSize: 40, bold: true, color: WHITE,
    });
    const items = [
      "Reviews go unanswered for days because nobody's checking 6 platforms.",
      "Negative reviews get generic replies that make things worse.",
      "Legal-risk language reaches the public reply box - then your legal team.",
      "No audit trail of who replied, when, or why.",
    ];
    items.forEach((text, i) => {
      s.addText(`✕  ${text}`, {
        x: 0.6, y: 4.0 + i * 0.6, w: 12, h: 0.55,
        fontFace: "Inter", fontSize: 14, color: WHITE,
      });
    });
  });

  // 3 Promise
  slides.push((s) => {
    addBrand(s);
    s.addText("The promise", {
      x: 0.6, y: 1.6, w: 12.1, h: 0.4,
      fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2, align: "center" as const,
    });
    s.addText(m.promise.split(".")[0] + ".", {
      x: 0.6, y: 2.2, w: 12.1, h: 2.5,
      fontFace: "Inter", fontSize: 48, bold: true, color: WHITE, align: "center" as const,
    });
    const stats = [
      { stat: "90s", label: "Median ingest → published" },
      { stat: "6", label: "Platforms in one inbox" },
      { stat: "0", label: "Unreviewed legal replies" },
    ];
    stats.forEach((st, i) => {
      const x = 1.5 + i * 3.4;
      s.addText(st.stat, {
        x, y: 5.0, w: 3, h: 1.0,
        fontFace: "Inter", fontSize: 52, bold: true, color: GREEN, align: "center" as const,
      });
      s.addText(st.label, {
        x, y: 6.0, w: 3, h: 0.4,
        fontFace: "Inter", fontSize: 11, color: MUTED, align: "center" as const,
      });
    });
  });

  // 4 Loop overview (textual - the SVG loop is too complex for pptx)
  slides.push((s) => {
    addBrand(s);
    s.addText("The loop", {
      x: 0.6, y: 1.6, w: 4, h: 0.4,
      fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2,
    });
    s.addText("Five pillars. One loop.", {
      x: 0.6, y: 2.0, w: 12, h: 1.2,
      fontFace: "Inter", fontSize: 44, bold: true, color: WHITE,
    });
    s.addText(
      "The method is a loop, not a funnel. Every published reply feeds back into tone calibration for the next one. Median round-trip: 90 seconds.",
      {
        x: 0.6, y: 3.5, w: 12, h: 1.2,
        fontFace: "Inter", fontSize: 14, color: MUTED,
      },
    );
    m.pillars.forEach((p, i) => {
      const x = 0.6 + (i % 5) * 2.55;
      s.addText(`0${p.step}  ${p.name.toUpperCase()}`, {
        x, y: 5.4, w: 2.4, h: 0.5,
        fontFace: "Inter", fontSize: 13, bold: true, color: WHITE, align: "center" as const,
        fill: { color: GREEN, transparency: 85 },
      });
      s.addText(p.tagline, {
        x, y: 5.95, w: 2.4, h: 0.6,
        fontFace: "Inter", fontSize: 10, color: MUTED, align: "center" as const, valign: "top" as const,
      });
    });
  });

  // 5-9 Pillar deep-dives
  m.pillars.forEach((p) => {
    slides.push((s) => {
      addBrand(s);
      s.addText(`Pillar 0${p.step} of 05`, {
        x: 0.6, y: 1.6, w: 4, h: 0.4,
        fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2,
      });
      s.addText(p.name, {
        x: 0.6, y: 2.0, w: 8, h: 1.2,
        fontFace: "Inter", fontSize: 44, bold: true, color: WHITE,
      });
      s.addText(p.tagline, {
        x: 0.6, y: 3.2, w: 8, h: 0.6,
        fontFace: "Inter", fontSize: 18, bold: true, color: WHITE, transparency: 20,
      });
      s.addText(p.body, {
        x: 0.6, y: 4.0, w: 8, h: 2.5,
        fontFace: "Inter", fontSize: 13, color: MUTED, valign: "top" as const,
      });
      // Proof card
      s.addText("PROOF", {
        x: 9.5, y: 3.0, w: 3, h: 0.4,
        fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, align: "center" as const, charSpacing: 2,
      });
      s.addText(p.proof, {
        x: 9.5, y: 3.4, w: 3, h: 1.0,
        fontFace: "Inter", fontSize: 32, bold: true, color: WHITE, align: "center" as const,
      });
    });
  });

  // 10 Principles
  slides.push((s) => {
    addBrand(s);
    s.addText("Operating principles", {
      x: 0.6, y: 1.6, w: 4, h: 0.4,
      fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2,
    });
    s.addText("The non-negotiables.", {
      x: 0.6, y: 2.0, w: 12, h: 1.2,
      fontFace: "Inter", fontSize: 40, bold: true, color: WHITE,
    });
    m.principles.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      s.addText(`✓  ${p.title}`, {
        x: 0.6 + col * 6.2, y: 3.5 + row * 1.7, w: 5.8, h: 0.5,
        fontFace: "Inter", fontSize: 14, bold: true, color: WHITE,
      });
      s.addText(p.body, {
        x: 0.6 + col * 6.2, y: 4.0 + row * 1.7, w: 5.8, h: 1.2,
        fontFace: "Inter", fontSize: 11, color: MUTED, valign: "top" as const,
      });
    });
  });

  // 11 Without vs With
  slides.push((s) => {
    addBrand(s);
    s.addText("The difference", {
      x: 0.6, y: 1.6, w: 4, h: 0.4,
      fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2,
    });
    s.addText("Without vs with.", {
      x: 0.6, y: 2.0, w: 12, h: 1.2,
      fontFace: "Inter", fontSize: 40, bold: true, color: WHITE,
    });
    s.addText("✕  WITHOUT IT", {
      x: 0.6, y: 3.6, w: 6, h: 0.5,
      fontFace: "Inter", fontSize: 11, bold: true, color: RED, charSpacing: 2,
    });
    m.without.forEach((item, i) => {
      s.addText(`-  ${item}`, {
        x: 0.6, y: 4.2 + i * 0.55, w: 5.8, h: 0.5,
        fontFace: "Inter", fontSize: 11, color: WHITE,
      });
    });
    s.addText("✓  WITH IT", {
      x: 6.8, y: 3.6, w: 6, h: 0.5,
      fontFace: "Inter", fontSize: 11, bold: true, color: GREEN, charSpacing: 2,
    });
    m.with.forEach((item, i) => {
      s.addText(`-  ${item}`, {
        x: 6.8, y: 4.2 + i * 0.55, w: 5.8, h: 0.5,
        fontFace: "Inter", fontSize: 11, color: WHITE,
      });
    });
  });

  // 12 Proof
  slides.push((s) => {
    addBrand(s);
    s.addText("The numbers", {
      x: 0.6, y: 1.6, w: 4, h: 0.4,
      fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2,
    });
    s.addText("Proof, per pillar.", {
      x: 0.6, y: 2.0, w: 12, h: 1.2,
      fontFace: "Inter", fontSize: 40, bold: true, color: WHITE,
    });
    m.pillars.forEach((p, i) => {
      const x = 0.6 + i * 2.55;
      s.addText(p.name.toUpperCase(), {
        x, y: 4.0, w: 2.4, h: 0.4,
        fontFace: "Inter", fontSize: 10, bold: true, color: MUTED, align: "center" as const, charSpacing: 2,
      });
      s.addText(p.proof, {
        x, y: 4.4, w: 2.4, h: 1.0,
        fontFace: "Inter", fontSize: 28, bold: true, color: WHITE, align: "center" as const,
      });
    });
  });

  // 13 Pricing
  slides.push((s) => {
    addBrand(s);
    s.addText("Pricing", {
      x: 0.6, y: 1.6, w: 4, h: 0.4,
      fontFace: "Inter", fontSize: 10, bold: true, color: GREEN, charSpacing: 2,
    });
    s.addText("Per rooftop. No lock-in.", {
      x: 0.6, y: 2.0, w: 12, h: 1.2,
      fontFace: "Inter", fontSize: 40, bold: true, color: WHITE,
    });
    config.pricing.tiers.forEach((t, i) => {
      const x = 0.6 + i * 4.25;
      s.addText(t.name, {
        x, y: 3.8, w: 4, h: 0.5,
        fontFace: "Inter", fontSize: 14, bold: true, color: WHITE,
      });
      s.addText(t.price, {
        x, y: 4.3, w: 4, h: 0.8,
        fontFace: "Inter", fontSize: 32, bold: true, color: t.highlight ? GREEN : WHITE,
      });
      s.addText(t.cadence, {
        x, y: 5.1, w: 4, h: 0.4,
        fontFace: "Inter", fontSize: 11, color: MUTED,
      });
      s.addText(t.tagline, {
        x, y: 5.5, w: 4, h: 1.0,
        fontFace: "Inter", fontSize: 11, color: WHITE, valign: "top" as const,
      });
    });
  });

  // 14 CTA
  slides.push((s) => {
    addBrand(s);
    s.addText("See the loop run on real reviews.", {
      x: 0.6, y: 2.5, w: 12.1, h: 2.0,
      fontFace: "Inter", fontSize: 44, bold: true, color: WHITE, align: "center" as const,
    });
    s.addText(
      "The live demo runs the method end-to-end on a seeded dealership console. Approve, reject, regenerate - watch the loop close in seconds.",
      {
        x: 1.6, y: 4.6, w: 10.1, h: 1.0,
        fontFace: "Inter", fontSize: 14, color: MUTED, align: "center" as const,
      },
    );
    s.addText("a3brands.com  ·  " + config.bookACallLabel, {
      x: 0.6, y: 6.0, w: 12.1, h: 0.5,
      fontFace: "Inter", fontSize: 13, bold: true, color: GREEN, align: "center" as const,
    });
  });

  const total = slides.length;
  slides.forEach((fn, i) => {
    const s = newSlide(pptx);
    fn(s);
    addFooter(s, i + 1, total);
  });
}
