/**
 * Mock OpenAI client for demos / development. Activated when OPENAI_API_KEY
 * is unset. Produces realistic-looking responses based on the input prompt
 * so the regenerate button and full agent graph stay clickable in
 * prototype mode without burning real tokens.
 */

import type { CompletionResult } from "./openai";

const MOCK_LATENCY_MS = [600, 1400] as const;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomLatency() {
  const [lo, hi] = MOCK_LATENCY_MS;
  return lo + Math.floor(Math.random() * (hi - lo));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ── Sentiment classifier mock ────────────────────────────────────────

const ANGRY_TOKENS = ["worst", "horrible", "scam", "ripped off", "never again", "terrible"];
const LEGAL_TOKENS = [
  "lawyer", "attorney", "lemon law", "lemon", "fraud", "discrimination",
  "bbb", "regulator", "tcpa", "court", "lawsuit", "sue", "consumer protection",
];
const PII_TOKENS = ["ssn", "social security", "credit card", "license plate"];

function classify(text: string) {
  const t = text.toLowerCase();
  const legalRisk = LEGAL_TOKENS.some((k) => t.includes(k));
  const containsPii = PII_TOKENS.some((k) => t.includes(k));
  let sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "ANGRY" | "LEGAL_RISK" = "NEUTRAL";

  if (legalRisk) sentiment = "LEGAL_RISK";
  else if (ANGRY_TOKENS.some((k) => t.includes(k))) sentiment = "ANGRY";
  else {
    const m = t.match(/(\d)\s*(?:\/|out of)\s*5|rating[: ]+(\d)/);
    const rating = m ? Number(m[1] ?? m[2]) : null;
    if (rating !== null) {
      if (rating >= 4) sentiment = "POSITIVE";
      else if (rating <= 2) sentiment = "NEGATIVE";
    } else {
      const positive = /great|love|amazing|excellent|fantastic|wonderful|easy|smooth|recommend|happy|thank/.test(t);
      const negative = /bad|slow|wait|disappoint|rude|broken|won.t|won't|wouldn.t|wouldn't|return/.test(t);
      sentiment = positive && !negative ? "POSITIVE" : negative ? "NEGATIVE" : "NEUTRAL";
    }
  }

  const summary =
    sentiment === "POSITIVE"
      ? ""
      : sentiment === "LEGAL_RISK"
        ? "Reviewer references legal action — escalate before any public response."
        : sentiment === "ANGRY"
          ? "Customer is angry; lead with empathy and an offline contact path."
          : "Customer flags an issue worth a direct, accountable reply.";

  return {
    sentiment,
    legalRisk,
    containsPii,
    summary,
    keywords: t
      .split(/\W+/)
      .filter((w) => w.length > 4)
      .slice(0, 8),
  };
}

// ── Response generator mock ──────────────────────────────────────────

function firstName(authorName?: string | null) {
  if (!authorName) return null;
  const clean = authorName.replace(/[^\p{L}\s'.-]/gu, "").trim();
  const first = clean.split(/\s+/)[0];
  if (!first || first.toLowerCase() === "anonymous") return null;
  return first;
}

function parseRespondPrompt(user: string) {
  const dealership = user.match(/Dealership:\s*([^\n(]+)/)?.[1]?.trim() ?? "Our Team";
  const brand = user.match(/Dealership:[^(]*\(([^)]+)\)/)?.[1]?.trim() ?? null;
  const tone = user.match(/Tone:\s*([A-Z_]+)/)?.[1] ?? "FRIENDLY";
  const signOff = user.match(/Sign off as:\s*(.+)/)?.[1]?.trim() ?? `— The ${dealership} Team`;
  const reviewer = user.match(/Reviewer name:\s*(.+)/)?.[1]?.trim();
  const rating = Number(user.match(/Rating:\s*(\d)/)?.[1] ?? 0);
  const body = user.split("Review body:")[1]?.trim() ?? user;
  return { dealership, brand, tone, signOff, reviewer, rating, body };
}

function mockRespondBody(user: string) {
  const ctx = parseRespondPrompt(user);
  const name = firstName(ctx.reviewer);
  const greeting = name ? `${name}, ` : "Hi there, ";

  if (ctx.rating >= 4) {
    return (
      greeting +
      pick([
        "thank you so much for taking the time to share this! ",
        "this absolutely made our day — thank you for the kind words! ",
        "we genuinely appreciate you sharing your experience. ",
      ]) +
      pick([
        "We'll pass these kind words along to the team. ",
        "Stories like yours are why we do this work. ",
        "We're so glad we could help make this a smooth experience. ",
      ]) +
      pick([
        `Looking forward to seeing you again at ${ctx.dealership}.`,
        "Drive safe — and come visit us any time you need anything.",
        "Welcome to the family, and please reach out whenever we can help.",
      ]) +
      `\n${ctx.signOff}`
    );
  }

  if (ctx.rating <= 2) {
    return (
      greeting +
      pick([
        "thank you for sharing this directly with us — that's how we improve. ",
        "we're sorry your experience didn't meet expectations, and we want to make this right. ",
        "this isn't the experience we want for any customer. ",
      ]) +
      pick([
        "Could you reach out to our team directly so we can review what happened? ",
        "We'd appreciate the chance to take another look — would you mind reaching out so we can help? ",
        "We'd like to learn more so we can fix this for you and for the next customer. ",
      ]) +
      "We take this feedback seriously.\n" +
      ctx.signOff
    );
  }

  return (
    greeting +
    pick([
      "thanks for the honest feedback — we appreciate the time you took. ",
      "we appreciate you sharing this with us. ",
    ]) +
    pick([
      "The points you raised are noted and we'll review them with the team. ",
      "We've shared this with the relevant team and we're looking into it. ",
    ]) +
    "If there's anything we can do to follow up, please reach out.\n" +
    ctx.signOff
  );
}

// ── QA editor mock ───────────────────────────────────────────────────

function mockQa(user: string) {
  const draft = user.split("Draft response:")[1]?.trim() ?? "";
  const issues: string[] = [];
  if (/\b(guarantee|promise|will fix|definitely)\b/i.test(draft)) {
    issues.push("Removed an open-ended promise — replaced with 'we'll review'.");
  }
  if (/\b(competitor|other dealer|next door)\b/i.test(draft)) {
    issues.push("Removed a reference to competitors.");
  }
  const cleaned = draft.replace(/we guarantee/gi, "we'll review")
    .replace(/we promise/gi, "we'll do our best to");
  return { pass: issues.length === 0, revisedBody: cleaned || draft, issues };
}

// ── Public mock interface ────────────────────────────────────────────

export function isMockMode(): boolean {
  return !process.env.OPENAI_API_KEY;
}

export async function mockChatJson<T>(opts: {
  system: string;
  user: string;
}): Promise<T & { _meta: CompletionResult }> {
  await delay(randomLatency());

  let payload: unknown = {};
  if (/customer-experience analyst/i.test(opts.system)) {
    payload = classify(opts.user);
  } else if (/strict editor/i.test(opts.system)) {
    payload = mockQa(opts.user);
  } else {
    const body = mockRespondBody(opts.user);
    payload = {
      body,
      confidence: 0.65 + Math.random() * 0.3,
      flaggedReasons: [] as string[],
    };
  }

  const content = JSON.stringify(payload);
  return {
    ...(payload as T),
    _meta: {
      content,
      model: "mock-gpt-4o",
      tokensIn: Math.round(opts.user.length / 4),
      tokensOut: Math.round(content.length / 4),
    },
  };
}

export async function mockChatText(opts: {
  system: string;
  user: string;
}): Promise<CompletionResult> {
  await delay(randomLatency());
  const content = mockRespondBody(opts.user);
  return {
    content,
    model: "mock-gpt-4o",
    tokensIn: Math.round(opts.user.length / 4),
    tokensOut: Math.round(content.length / 4),
  };
}
