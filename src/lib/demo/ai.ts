/**
 * Optional Anthropic-powered draft generation.
 *
 * If ANTHROPIC_API_KEY is set in the Vercel env, we call Claude Haiku
 * (~$0.001 per regen) to produce a fresh, on-brand reply to the review.
 * Otherwise we fall back to a deterministic canned variant so the demo
 * still feels alive without any API key.
 */
type ReviewContext = {
  reviewBody: string;
  authorName: string | null;
  rating: number;
  dealershipName: string;
  signOff: string;
};

const FALLBACK_VARIANTS = [
  (n: string, _d: string, s: string) =>
    `${n}, thank you for sharing this with us - reviews like yours are how we hold the bar where it belongs. If there's anything we can address now, please reach out and we'll take care of it.\n${s}`,
  (n: string, _d: string, s: string) =>
    `${n}, we really appreciate you taking the time. Stories from customers like you keep the whole team sharp. Drop us a line any time - we're here for it.\n${s}`,
  (n: string, _d: string, s: string) =>
    `${n}, thanks so much - it means a lot to us. We'll pass this along to the team that took care of you. Reach out whenever you need us.\n${s}`,
];

function firstName(name: string | null): string {
  if (!name) return "there";
  if (name.toLowerCase().includes("anonymous")) return "there";
  return name.split(/\s/)[0]?.replace(/\.$/, "") ?? "there";
}

function fallback(ctx: ReviewContext): string {
  const idx = Math.floor(Math.random() * FALLBACK_VARIANTS.length);
  return FALLBACK_VARIANTS[idx]!(firstName(ctx.authorName), ctx.dealershipName, ctx.signOff);
}

export async function generateReply(ctx: ReviewContext): Promise<{ body: string; source: "ai" | "canned" }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { body: fallback(ctx), source: "canned" };
  }

  const prompt = [
    `Write a short, warm, on-brand reply (2-4 sentences) from ${ctx.dealershipName} to the review below.`,
    `Address the reviewer by first name (or "there" if unnamed). End with the exact sign-off: ${ctx.signOff}`,
    `Be specific, never defensive. Don't make promises. Don't mention compensation. Don't ask them to email you - just thank them.`,
    `For low-rating reviews (<= 3 stars), acknowledge the issue and invite them to reach out so you can make it right.`,
    "",
    `--- Review (${ctx.rating}/5 from ${ctx.authorName ?? "Anonymous"}) ---`,
    ctx.reviewBody,
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
      // Cap network time so a slow API doesn't stall the demo.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("\n")
        .trim() ?? "";
    if (!text) throw new Error("empty completion");
    return { body: text, source: "ai" };
  } catch {
    return { body: fallback(ctx), source: "canned" };
  }
}
