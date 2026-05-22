import { NextRequest, NextResponse } from "next/server";
import { ReviewPlatform } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashToken, safeEqual } from "@/lib/crypto";
import { jobDefaults, syncReviewsQueue } from "@/workers/queues";
import { logger } from "@/lib/utils/logger";

const PLATFORMS = ["google", "yelp", "dealerrater", "carsdotcom", "facebook", "bbb"] as const;
type Slug = (typeof PLATFORMS)[number];

const PLATFORM_MAP: Record<Slug, ReviewPlatform> = {
  google: ReviewPlatform.GOOGLE,
  yelp: ReviewPlatform.YELP,
  dealerrater: ReviewPlatform.DEALERRATER,
  carsdotcom: ReviewPlatform.CARS_DOT_COM,
  facebook: ReviewPlatform.FACEBOOK,
  bbb: ReviewPlatform.BBB,
};

const bodySchema = z.object({
  sourceId: z.string(),
  signature: z.string().optional(),
});

/**
 * Generic webhook ingress. Each provider signs its payload with a shared
 * secret stored against the ApiToken row. We resolve the source, validate
 * the signature, and enqueue a sync job. The actual fetch happens in the
 * worker so the webhook handler stays under provider timeout windows.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  if (!PLATFORMS.includes(platform as Slug)) {
    return NextResponse.json({ ok: false, error: "unknown platform" }, { status: 404 });
  }
  const expectedPlatform = PLATFORM_MAP[platform as Slug];

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "schema" }, { status: 422 });
  }

  const source = await prisma.reviewSource.findFirst({
    where: { id: parsed.data.sourceId, platform: expectedPlatform, isActive: true },
    include: { location: { include: { dealership: true } }, apiToken: true },
  });
  if (!source) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }

  // Validate webhook signature against stored shared secret.
  const sigHeader = req.headers.get("x-signature") ?? parsed.data.signature ?? "";
  const expected = hashToken(source.id + (process.env.AUTH_SECRET ?? ""));
  if (!safeEqual(sigHeader, expected)) {
    logger.warn({ sourceId: source.id }, "webhook.invalid-signature");
    return NextResponse.json({ ok: false, error: "signature" }, { status: 401 });
  }

  await syncReviewsQueue.add(
    "webhook",
    {
      sourceId: source.id,
      organizationId: source.location.dealership.organizationId,
      dealershipId: source.location.dealershipId,
      kind: "webhook",
    },
    { ...jobDefaults, jobId: `webhook:${source.id}:${Date.now()}` },
  );

  return NextResponse.json({ ok: true });
}
