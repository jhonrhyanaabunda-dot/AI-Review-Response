/**
 * PPTX builder for The 90-Second Response Method deck.
 *
 * Used by:
 *   - the server API route at /api/methodology/deck.pptx (Node)
 *   - the client-side "Download .pptx" button on /methodology/deck (browser
 *     via pptxgenjs loaded from CDN)
 *
 * The builder is pure: takes a pptx instance + methodology + config, returns
 * void after calling addSlide() / addText() on the instance. Caller decides
 * whether to write to file (browser) or to Node buffer (server).
 */
import type { Methodology } from "@/lib/demo/config";

export type DeckConfigLike = {
  bookACallUrl: string;
  bookACallLabel: string;
  pricing: {
    tiers: Array<{
      name: string;
      price: string;
      cadence: string;
      tagline: string;
      highlight: boolean;
    }>;
  };
};

export type PptxLike = {
  addSlide: () => PptxSlideLike;
  write?: (opts: { outputType: string }) => Promise<unknown>;
  writeFile?: (opts: { fileName: string }) => Promise<unknown>;
  layout: string;
  title?: string;
  author?: string;
};

export type PptxSlideLike = {
  background?: { color?: string };
  addText: (
    text: string | Array<{ text: string; options?: Record<string, unknown> }>,
    opts: Record<string, unknown>,
  ) => PptxSlideLike;
};

const NAVY = "0F172A";
const WHITE = "FFFFFF";
const MUTED = "94A3B8";
const GREEN = "1DB954";
const RED = "EF4444";

function addBrand(slide: PptxSlideLike) {
  slide.addText("A3 BRANDS", {
    x: 0.6, y: 0.45, w: 2.5, h: 0.3,
    fontFace: "Inter", fontSize: 11, bold: true, color: WHITE, charSpacing: 1,
  });
  slide.addText("AI Review Response", {
    x: 0.6, y: 0.72, w: 3, h: 0.25,
    fontFace: "Inter", fontSize: 8, color: MUTED, charSpacing: 2,
  });
}

function addFooter(slide: PptxSlideLike, idx: number, total: number) {
  slide.addText(`A3 Brands · AI Review Response  ${idx}/${total}`, {
    x: 8.5, y: 7.0, w: 4.5, h: 0.3,
    fontFace: "Inter", fontSize: 8, color: MUTED, align: "right" as const, charSpacing: 1,
  });
}

function newSlide(pptx: PptxLike) {
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  return s;
}

export function buildPptx(
  pptx: PptxLike,
  m: Methodology,
  config: DeckConfigLike,
): void {
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

  // 4 Loop overview
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
