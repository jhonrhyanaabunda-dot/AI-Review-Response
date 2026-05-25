import {
  PrismaClient,
  Role,
  ReviewPlatform,
  TonePreset,
  ResponseStatus,
  ReviewStatus,
  Sentiment,
} from "@prisma/client";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const PLATFORMS = [
  ReviewPlatform.GOOGLE,
  ReviewPlatform.YELP,
  ReviewPlatform.DEALERRATER,
  ReviewPlatform.CARS_DOT_COM,
  ReviewPlatform.FACEBOOK,
  ReviewPlatform.BBB,
];

// ── Sample content pool ──────────────────────────────────────────────

type Sample = {
  rating: number;
  authorName: string;
  body: string;
  sentiment: Sentiment;
  confidence: number;
  flags?: string[];
};

const POSITIVE: Sample[] = [
  { rating: 5, authorName: "Maria L.", body: "Best buying experience ever. Carlos helped us trade up to a new Camry - easy and quick.", sentiment: Sentiment.POSITIVE, confidence: 0.92 },
  { rating: 5, authorName: "Priya R.", body: "Loved the no-pressure sales approach. Jamal answered every question and didn't push extras.", sentiment: Sentiment.POSITIVE, confidence: 0.94 },
  { rating: 5, authorName: "Eric W.", body: "Service appointment was on time and the work was explained clearly. Will be back.", sentiment: Sentiment.POSITIVE, confidence: 0.9 },
  { rating: 5, authorName: "Aisha K.", body: "Bought our family SUV here. The team made financing painless and we drove off the same day.", sentiment: Sentiment.POSITIVE, confidence: 0.91 },
  { rating: 5, authorName: "Tom & Beth", body: "Lana in service is fantastic. Always remembers our names and our cars.", sentiment: Sentiment.POSITIVE, confidence: 0.89 },
  { rating: 5, authorName: "Jordan F.", body: "Smooth process from test drive to keys. Honest pricing, no surprises at signing.", sentiment: Sentiment.POSITIVE, confidence: 0.93 },
  { rating: 4, authorName: "Devon S.", body: "Friendly staff, fair pricing. Wish the financing process was faster.", sentiment: Sentiment.POSITIVE, confidence: 0.88 },
  { rating: 4, authorName: "Hannah P.", body: "Good experience overall. Sales rep was attentive though the loaner car situation was unclear.", sentiment: Sentiment.POSITIVE, confidence: 0.82 },
  { rating: 4, authorName: "Marcus O.", body: "Solid trade-in offer, quick paperwork. Coffee machine was broken though :)", sentiment: Sentiment.POSITIVE, confidence: 0.85 },
  { rating: 4, authorName: "Sofia A.", body: "First-time buyer here. The team walked me through every step without rushing.", sentiment: Sentiment.POSITIVE, confidence: 0.87 },
  { rating: 4, authorName: "Wesley B.", body: "Service team got me in on short notice when my brakes started squealing. Appreciate it.", sentiment: Sentiment.POSITIVE, confidence: 0.86 },
];

const NEUTRAL: Sample[] = [
  { rating: 3, authorName: "Mike T.", body: "Decent experience overall. The waiting area could use some work - wifi was spotty.", sentiment: Sentiment.NEUTRAL, confidence: 0.81 },
  { rating: 3, authorName: "Renee J.", body: "Got the car I wanted at a fair price. Wish the trade-in negotiation hadn't taken two hours.", sentiment: Sentiment.NEUTRAL, confidence: 0.77 },
  { rating: 3, authorName: "Chen L.", body: "Service was fine. Cost a bit more than the dealer down the road but they were quicker.", sentiment: Sentiment.NEUTRAL, confidence: 0.75 },
  { rating: 3, authorName: "Bea M.", body: "The car is great, the dealership is okay. Some communication gaps on delivery timing.", sentiment: Sentiment.NEUTRAL, confidence: 0.79 },
];

const NEGATIVE: Sample[] = [
  { rating: 2, authorName: "John D.", body: "Service department took twice the estimated time. No one called to update us. Won't be back.", sentiment: Sentiment.NEGATIVE, confidence: 0.74, flags: ["Service delay; verify timeline before publishing"] },
  { rating: 2, authorName: "Karen H.", body: "Salesperson kept upselling extras I didn't want even after I said no twice. Frustrating.", sentiment: Sentiment.NEGATIVE, confidence: 0.7, flags: ["High-pressure sales concern raised"] },
  { rating: 2, authorName: "Brendan O.", body: "Quote on the phone didn't match the in-store quote. Felt like a bait-and-switch.", sentiment: Sentiment.NEGATIVE, confidence: 0.66, flags: ["Pricing complaint - verify quote before publishing"] },
  { rating: 1, authorName: "Tasha R.", body: "Worst experience. Showed up for a confirmed appointment, was told the tech was out. Wasted my afternoon.", sentiment: Sentiment.ANGRY, confidence: 0.55, flags: ["Angry customer - recommend GM follow-up offline"] },
  { rating: 1, authorName: "Dom P.", body: "Sold us a car with an undisclosed accident on the carfax. Going to dispute the sale.", sentiment: Sentiment.ANGRY, confidence: 0.48, flags: ["Allegation about undisclosed history - legal review recommended"] },
];

const LEGAL: Sample[] = [
  { rating: 1, authorName: "Anonymous", body: "They sold us a lemon and won't honor the warranty. We've contacted our lawyer and the BBB.", sentiment: Sentiment.LEGAL_RISK, confidence: 0.32, flags: ["Legal language detected - escalation recommended", "Mentions lemon law and pending counsel"] },
  { rating: 1, authorName: "M.G.", body: "Filing a complaint with the state attorney general about predatory finance terms.", sentiment: Sentiment.LEGAL_RISK, confidence: 0.3, flags: ["State AG referenced - escalate to legal counsel"] },
];

const DRAFT = {
  positive: (n: string, d: string, s: string) =>
    `${n}, thank you so much for taking the time to share this! Stories like yours are why we do what we do. We're glad ${d} could make this a smooth experience. Welcome to the family - drive safe and reach out any time.\n${s}`,
  neutral: (n: string, d: string, s: string) =>
    `${n}, thanks for the honest feedback. We've noted your points and will share them with the team this week. If there's anything we can do to follow up, please reach out to us directly at ${d}.\n${s}`,
  negative: (n: string, _d: string, s: string) =>
    `${n}, we're sorry this fell short of what you should expect from us. Could you reach out to our team directly so we can review what happened? We'd like the chance to make this right.\n${s}`,
  legal: (_n: string, _d: string, s: string) =>
    `We take concerns like this seriously. Our General Manager would like to review this matter with you directly - please contact us so we can address your specific situation.\n${s}`,
};

function firstName(full: string) {
  return full.split(/\s/)[0]?.replace(/\.$/, "") ?? "there";
}

function draftFor(sample: Sample, dealership: string, signOff: string) {
  const name = sample.authorName.toLowerCase().includes("anonymous") ? "there" : firstName(sample.authorName);
  if (sample.sentiment === Sentiment.LEGAL_RISK) return DRAFT.legal(name, dealership, signOff);
  if (sample.sentiment === Sentiment.ANGRY || sample.sentiment === Sentiment.NEGATIVE) return DRAFT.negative(name, dealership, signOff);
  if (sample.sentiment === Sentiment.NEUTRAL) return DRAFT.neutral(name, dealership, signOff);
  return DRAFT.positive(name, dealership, signOff);
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  console.log("Seeding A3 Brands AI Review Response (prototype)...");

  const org = await prisma.organization.upsert({
    where: { slug: "a3-brands" },
    update: { name: "A3 Brands" },
    create: {
      slug: "a3-brands",
      name: "A3 Brands",
      plan: "starter",
      billingEmail: "billing@a3brands.com",
    },
  });

  const passwordHash = await argon2.hash("password123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Pat Admin", passwordHash },
  });
  const gm = await prisma.user.upsert({
    where: { email: "gm@example.com" },
    update: {},
    create: { email: "gm@example.com", name: "Sam Manager", passwordHash },
  });

  const adminMembership = await prisma.membership.findFirst({
    where: { organizationId: org.id, userId: admin.id, dealershipId: null },
  });
  if (!adminMembership) {
    await prisma.membership.create({
      data: { organizationId: org.id, userId: admin.id, role: Role.AGENCY_ADMIN },
    });
  }

  const dealerships = await Promise.all([
    prisma.dealership.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug: "smith-toyota" } },
      update: {},
      create: {
        organizationId: org.id,
        slug: "smith-toyota",
        name: "Smith Toyota",
        brand: "Toyota",
        tonePreset: TonePreset.FRIENDLY,
        signOff: "- The Smith Toyota Team",
        escalationKeywords: ["lemon law", "fraud", "lawyer", "discrim", "BBB", "attorney general"],
        escalationEmails: ["gm@example.com"],
        autoPublishThreshold: 5,
        requireApproval: true,
        timezone: "America/New_York",
      },
    }),
    prisma.dealership.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug: "bayside-honda" } },
      update: {},
      create: {
        organizationId: org.id,
        slug: "bayside-honda",
        name: "Bayside Honda",
        brand: "Honda",
        tonePreset: TonePreset.OEM_COMPLIANT,
        signOff: "- The Bayside Honda Team",
        escalationKeywords: ["lemon law", "lawyer", "regulator", "BBB", "attorney general"],
        escalationEmails: ["gm@example.com"],
        autoPublishThreshold: 5,
        requireApproval: true,
        timezone: "America/New_York",
      },
    }),
  ]);

  const gmMembership = await prisma.membership.findFirst({
    where: { organizationId: org.id, userId: gm.id, dealershipId: dealerships[0].id },
  });
  if (!gmMembership) {
    await prisma.membership.create({
      data: {
        organizationId: org.id,
        userId: gm.id,
        role: Role.GENERAL_MANAGER,
        dealershipId: dealerships[0].id,
      },
    });
  }

  for (const d of dealerships) {
    const loc = await prisma.location.upsert({
      where: { id: `${d.id}-main` },
      update: {},
      create: {
        id: `${d.id}-main`,
        dealershipId: d.id,
        name: "Main Showroom",
        address1: d.slug === "smith-toyota" ? "100 Auto Mall Dr" : "200 Bayview Blvd",
        city: d.slug === "smith-toyota" ? "Newark" : "Bayside",
        region: d.slug === "smith-toyota" ? "NJ" : "NY",
        postalCode: d.slug === "smith-toyota" ? "07102" : "11361",
        country: "US",
      },
    });
    for (const platform of PLATFORMS) {
      await prisma.reviewSource.upsert({
        where: {
          locationId_platform_externalId: {
            locationId: loc.id,
            platform,
            externalId: `${d.slug}-${platform.toLowerCase()}`,
          },
        },
        update: {},
        create: {
          locationId: loc.id,
          platform,
          externalId: `${d.slug}-${platform.toLowerCase()}`,
          displayName: `${d.name} - ${platform}`,
          isActive: true,
        },
      });
    }
  }

  const buckets = {
    positive: POSITIVE,
    neutral: NEUTRAL,
    negative: NEGATIVE,
    legal: LEGAL,
  };
  // 24 reviews / dealership; distribution skews positive but always has
  // some pending negatives + 1 escalation for visible variety.
  const distribution: Array<keyof typeof buckets> = [
    ...Array(14).fill("positive"),
    ...Array(5).fill("neutral"),
    ...Array(4).fill("negative"),
    ...Array(1).fill("legal"),
  ] as Array<keyof typeof buckets>;

  const rand = mulberry32(42);
  let inserted = 0;

  // Make the bulk-review loop idempotent: if this org already has reviews,
  // skip. Re-running the seed shouldn't double the inbox.
  const existingReviewCount = await prisma.review.count({
    where: { organizationId: org.id },
  });
  if (existingReviewCount > 0) {
    console.log(
      `Seed complete. (Skipped bulk review insertion - org already has ${existingReviewCount} reviews.)`,
    );
    return;
  }

  for (const dealership of dealerships) {
    const sources = await prisma.reviewSource.findMany({
      where: { location: { dealershipId: dealership.id } },
    });
    const signOff = dealership.signOff!;
    const dist = distribution.slice().sort(() => rand() - 0.5);

    for (let i = 0; i < dist.length; i++) {
      const bucket = dist[i]!;
      const pool = buckets[bucket];
      const sample = pool[Math.floor(rand() * pool.length)]!;
      const source = sources[Math.floor(rand() * sources.length)]!;
      const externalId = `seed-${dealership.slug}-${i}-${randomUUID().slice(0, 8)}`;
      const ageHours = Math.floor(rand() * 24 * 90);
      const postedAt = new Date(Date.now() - ageHours * 3600_000);

      // Final-state distribution: 20% PUBLISHED, 60%+ PENDING_APPROVAL,
      // 2% APPROVED-awaiting-publish, plus the legals → ESCALATED.
      const roll = rand();
      const isLegal = sample.sentiment === Sentiment.LEGAL_RISK;
      const responseStatus: ResponseStatus = isLegal
        ? ResponseStatus.ESCALATED
        : roll < 0.2
          ? ResponseStatus.PUBLISHED
          : roll < 0.22
            ? ResponseStatus.APPROVED
            : ResponseStatus.PENDING_APPROVAL;
      const reviewStatus: ReviewStatus = isLegal
        ? ReviewStatus.ESCALATED
        : responseStatus === ResponseStatus.PUBLISHED
          ? ReviewStatus.RESPONDED
          : ReviewStatus.IN_PROGRESS;

      const review = await prisma.review.create({
        data: {
          organizationId: org.id,
          dealershipId: dealership.id,
          locationId: source.locationId,
          sourceId: source.id,
          platform: source.platform,
          externalId,
          externalUrl: `https://example.com/review/${externalId}`,
          authorName: sample.authorName,
          rating: sample.rating,
          body: sample.body,
          sentiment: sample.sentiment,
          postedAt,
          raw: { _seed: true, idx: i, bucket, sample: sample.body },
          status: reviewStatus,
        },
      });

      const draftBody = draftFor(sample, dealership.name, signOff);
      const isPublished = responseStatus === ResponseStatus.PUBLISHED;

      await prisma.aiResponse.create({
        data: {
          organizationId: org.id,
          reviewId: review.id,
          status: responseStatus,
          draftBody,
          finalBody: isPublished ? draftBody : null,
          sentiment: sample.sentiment,
          confidence: sample.confidence,
          legalRisk: isLegal,
          flaggedReasons: sample.flags ?? [],
          model: "mock-gpt-4o",
          promptVersion: "seed-v2",
          tokensIn: 320,
          tokensOut: 90,
          publishedAt: isPublished ? new Date(postedAt.getTime() + 1000 * 60 * 90) : null,
        },
      });

      if (isLegal) {
        await prisma.escalation.create({
          data: {
            organizationId: org.id,
            dealershipId: dealership.id,
            reviewId: review.id,
            severity: "CRITICAL",
            reason: "Legal risk detected by AI",
            matchedKeywords: ["lawyer", "BBB", "attorney general"].filter((k) =>
              sample.body.toLowerCase().includes(k.toLowerCase()),
            ),
          },
        });
      }

      await prisma.activityLog.createMany({
        data: [
          {
            organizationId: org.id,
            reviewId: review.id,
            kind: "REVIEW_INGESTED",
            metadata: { platform: source.platform, sourceId: source.id },
            createdAt: new Date(postedAt.getTime() + 1000 * 30),
          },
          {
            organizationId: org.id,
            reviewId: review.id,
            kind: "RESPONSE_GENERATED",
            metadata: { confidence: sample.confidence, model: "mock-gpt-4o" },
            createdAt: new Date(postedAt.getTime() + 1000 * 90),
          },
          ...(isPublished
            ? [
                {
                  organizationId: org.id,
                  reviewId: review.id,
                  kind: "RESPONSE_APPROVED" as const,
                  metadata: {},
                  createdAt: new Date(postedAt.getTime() + 1000 * 60 * 60),
                },
                {
                  organizationId: org.id,
                  reviewId: review.id,
                  kind: "RESPONSE_PUBLISHED" as const,
                  metadata: { platform: source.platform },
                  createdAt: new Date(postedAt.getTime() + 1000 * 60 * 90),
                },
              ]
            : []),
          ...(isLegal
            ? [
                {
                  organizationId: org.id,
                  reviewId: review.id,
                  kind: "ESCALATED" as const,
                  message: "Legal risk detected by AI",
                  metadata: { severity: "CRITICAL" },
                  createdAt: new Date(postedAt.getTime() + 1000 * 120),
                },
              ]
            : []),
        ],
      });

      inserted++;
    }
  }

  console.log("Seed complete.");
  console.log(`  Org: 1 (A3 Brands)`);
  console.log(`  Dealerships: ${dealerships.length} (Smith Toyota, Bayside Honda)`);
  console.log(`  Platforms: ${PLATFORMS.length} (incl. BBB)`);
  console.log(`  Reviews seeded: ${inserted} across 90 days`);
  console.log(`  Login: admin@example.com / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
