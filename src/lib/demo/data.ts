/**
 * In-memory demo dataset.
 *
 * Mirrors the shape of the Prisma seed (prisma/seed.ts) so dashboard pages
 * and API routes can render real-looking data with no DATABASE_URL. State
 * lives in module-scope arrays and persists for the lifetime of the Node
 * process - on serverless cold starts the store resets to the seeded
 * fixture, which is exactly the behavior we want for a public demo.
 */
import type {
  ReviewPlatform,
  Sentiment,
  ReviewStatus,
  ResponseStatus,
  Role,
  TonePreset,
  ActivityKind,
  EscalationSeverity,
} from "@prisma/client";

export type DemoOrg = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  billingEmail: string | null;
};

export type DemoUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  lastLoginAt: Date | null;
};

export type DemoMembership = {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  dealershipId: string | null;
  createdAt: Date;
};

export type DemoDealership = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  brand: string | null;
  tonePreset: TonePreset;
  signOff: string;
  timezone: string;
  escalationKeywords: string[];
  escalationEmails: string[];
  autoPublishThreshold: number;
  requireApproval: boolean;
  websiteUrl: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  customTone: string | null;
  aiInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoLocation = {
  id: string;
  dealershipId: string;
  name: string;
  address1: string;
  address2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
};

export type DemoSource = {
  id: string;
  locationId: string;
  platform: ReviewPlatform;
  externalId: string;
  displayName: string;
  isActive: boolean;
};

export type DemoReview = {
  id: string;
  organizationId: string;
  dealershipId: string;
  locationId: string;
  sourceId: string;
  platform: ReviewPlatform;
  externalId: string;
  externalUrl: string | null;
  authorName: string | null;
  authorAvatarUrl: string | null;
  rating: number;
  title: string | null;
  body: string;
  language: string | null;
  postedAt: Date;
  raw: Record<string, unknown>;
  status: ReviewStatus;
  assigneeId: string | null;
  sentiment: Sentiment | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoResponse = {
  id: string;
  organizationId: string;
  reviewId: string;
  status: ResponseStatus;
  draftBody: string;
  finalBody: string | null;
  sentiment: Sentiment | null;
  confidence: number;
  legalRisk: boolean;
  containsPii: boolean;
  flaggedReasons: string[];
  model: string;
  promptVersion: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  generationCostUsd: number | null;
  editedById: string | null;
  publishedAt: Date | null;
  publishError: string | null;
  publishAttempts: number;
  supersededAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoEscalation = {
  id: string;
  organizationId: string;
  dealershipId: string;
  reviewId: string;
  severity: EscalationSeverity;
  reason: string;
  matchedKeywords: string[];
  resolvedAt: Date | null;
  resolvedById: string | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoActivity = {
  id: string;
  organizationId: string;
  reviewId: string | null;
  actorId: string | null;
  kind: ActivityKind;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export type DemoNote = {
  id: string;
  reviewId: string;
  authorId: string;
  body: string;
  createdAt: Date;
};

// ─────────────────────────── Deterministic RNG ───────────────────────────

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────── Sample content (from JSON fixture) ───────────────────────────

import fixtureJson from "../../../demo-data/fixture.json";

type Sample = {
  rating: number;
  authorName: string;
  body: string;
  sentiment: Sentiment;
  confidence: number;
  flags?: string[];
};

const SAMPLES = fixtureJson.samples as {
  positive: Sample[];
  neutral: Sample[];
  negative: Sample[];
  legal: Sample[];
};
const POSITIVE = SAMPLES.positive;
const NEUTRAL = SAMPLES.neutral;
const NEGATIVE = SAMPLES.negative;
const LEGAL = SAMPLES.legal;

const DRAFT_TEMPLATES = {
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

function draftFor(sample: Sample, dealershipName: string, signOff: string) {
  const name = sample.authorName.toLowerCase().includes("anonymous") ? "there" : firstName(sample.authorName);
  if (sample.sentiment === "LEGAL_RISK") return DRAFT_TEMPLATES.legal(name, dealershipName, signOff);
  if (sample.sentiment === "ANGRY" || sample.sentiment === "NEGATIVE") return DRAFT_TEMPLATES.negative(name, dealershipName, signOff);
  if (sample.sentiment === "NEUTRAL") return DRAFT_TEMPLATES.neutral(name, dealershipName, signOff);
  return DRAFT_TEMPLATES.positive(name, dealershipName, signOff);
}

// ─────────────────────────── Fixture builder ───────────────────────────

export const DEMO_ORG_ID = "demo-org";
export const DEMO_ADMIN_ID = "u-admin";
export const DEMO_GM_ID = "u-gm";

const PLATFORMS: ReviewPlatform[] = [
  "GOOGLE",
  "YELP",
  "DEALERRATER",
  "CARS_DOT_COM",
  "FACEBOOK",
  "BBB",
];

function buildFixture() {
  const now = Date.now();
  const baseDate = new Date("2026-05-01T12:00:00Z");

  const orgFromJson = fixtureJson.org as { name: string; slug: string; plan: string; billingEmail: string | null };
  const org: DemoOrg = {
    id: DEMO_ORG_ID,
    slug: orgFromJson.slug,
    name: orgFromJson.name,
    plan: orgFromJson.plan,
    billingEmail: orgFromJson.billingEmail,
  };

  const users: DemoUser[] = [
    { id: DEMO_ADMIN_ID, email: "admin@example.com", name: "Pat Admin", image: null, lastLoginAt: baseDate },
    { id: DEMO_GM_ID, email: "gm@example.com", name: "Sam Manager", image: null, lastLoginAt: baseDate },
  ];

  type DealershipJson = {
    id: string;
    slug: string;
    name: string;
    brand: string;
    tonePreset: string;
    signOff: string;
    address: { address1: string; city: string; region: string; postalCode: string };
  };
  const dealershipsJson = (fixtureJson.dealerships ?? []) as DealershipJson[];

  const dealerships: DemoDealership[] = dealershipsJson.map((d) => ({
    id: d.id,
    organizationId: DEMO_ORG_ID,
    slug: d.slug,
    name: d.name,
    brand: d.brand,
    tonePreset: d.tonePreset as TonePreset,
    signOff: d.signOff,
    timezone: "America/New_York",
    escalationKeywords: ["lemon law", "fraud", "lawyer", "discrim", "BBB", "attorney general"],
    escalationEmails: ["gm@example.com"],
    autoPublishThreshold: 5,
    requireApproval: true,
    websiteUrl: null,
    primaryEmail: null,
    primaryPhone: null,
    customTone: null,
    aiInstructions: null,
    createdAt: baseDate,
    updatedAt: baseDate,
  }));

  const firstDealershipId = dealerships[0]?.id ?? null;
  const memberships: DemoMembership[] = [
    {
      id: "m-admin",
      organizationId: DEMO_ORG_ID,
      userId: DEMO_ADMIN_ID,
      role: "AGENCY_ADMIN",
      dealershipId: null,
      createdAt: baseDate,
    },
    {
      id: "m-gm",
      organizationId: DEMO_ORG_ID,
      userId: DEMO_GM_ID,
      role: "GENERAL_MANAGER",
      dealershipId: firstDealershipId,
      createdAt: baseDate,
    },
  ];

  const addressByDealershipId = new Map(
    dealershipsJson.map((d) => [d.id, d.address] as const),
  );
  const locations: DemoLocation[] = dealerships.map((d) => {
    const addr = addressByDealershipId.get(d.id)!;
    return {
      id: `loc-${d.slug}`,
      dealershipId: d.id,
      name: "Main Showroom",
      address1: addr.address1,
      address2: null,
      city: addr.city,
      region: addr.region,
      postalCode: addr.postalCode,
      country: "US",
      latitude: null,
      longitude: null,
    };
  });

  const sources: DemoSource[] = [];
  for (const loc of locations) {
    for (const platform of PLATFORMS) {
      sources.push({
        id: `src-${loc.dealershipId}-${platform.toLowerCase()}`,
        locationId: loc.id,
        platform,
        externalId: `${loc.dealershipId}-${platform.toLowerCase()}`,
        displayName: `${platform}`,
        isActive: true,
      });
    }
  }

  const buckets = { positive: POSITIVE, neutral: NEUTRAL, negative: NEGATIVE, legal: LEGAL };
  const distribution: Array<keyof typeof buckets> = [
    ...Array(14).fill("positive"),
    ...Array(5).fill("neutral"),
    ...Array(4).fill("negative"),
    ...Array(1).fill("legal"),
  ] as Array<keyof typeof buckets>;

  const reviews: DemoReview[] = [];
  const responses: DemoResponse[] = [];
  const escalations: DemoEscalation[] = [];
  const activities: DemoActivity[] = [];

  const rand = mulberry32(42);
  let idx = 0;

  for (const dealership of dealerships) {
    const dSources = sources.filter((s) =>
      locations.find((l) => l.id === s.locationId)?.dealershipId === dealership.id,
    );
    const signOff = dealership.signOff;
    const dist = distribution.slice().sort(() => rand() - 0.5);

    for (let i = 0; i < dist.length; i++) {
      const bucket = dist[i]!;
      const pool = buckets[bucket];
      const sample = pool[Math.floor(rand() * pool.length)]!;
      const source = dSources[Math.floor(rand() * dSources.length)]!;
      const reviewId = `r-${dealership.slug}-${i}`;
      const responseId = `resp-${dealership.slug}-${i}`;
      const ageHours = Math.floor(rand() * 24 * 90);
      const postedAt = new Date(now - ageHours * 3600_000);

      const roll = rand();
      const isLegal = sample.sentiment === "LEGAL_RISK";
      const responseStatus: ResponseStatus = isLegal
        ? "ESCALATED"
        : roll < 0.2
          ? "PUBLISHED"
          : roll < 0.22
            ? "APPROVED"
            : "PENDING_APPROVAL";
      const reviewStatus: ReviewStatus = isLegal
        ? "ESCALATED"
        : responseStatus === "PUBLISHED"
          ? "RESPONDED"
          : "IN_PROGRESS";

      const draftBody = draftFor(sample, dealership.name, signOff);
      const isPublished = responseStatus === "PUBLISHED";

      reviews.push({
        id: reviewId,
        organizationId: DEMO_ORG_ID,
        dealershipId: dealership.id,
        locationId: source.locationId,
        sourceId: source.id,
        platform: source.platform,
        externalId: `seed-${dealership.slug}-${i}`,
        externalUrl: `https://example.com/review/seed-${dealership.slug}-${i}`,
        authorName: sample.authorName,
        authorAvatarUrl: null,
        rating: sample.rating,
        title: null,
        body: sample.body,
        language: null,
        postedAt,
        raw: { _seed: true, idx: i, bucket, sample: sample.body },
        status: reviewStatus,
        assigneeId: null,
        sentiment: sample.sentiment,
        createdAt: postedAt,
        updatedAt: postedAt,
      });

      responses.push({
        id: responseId,
        organizationId: DEMO_ORG_ID,
        reviewId,
        status: responseStatus,
        draftBody,
        finalBody: isPublished ? draftBody : null,
        sentiment: sample.sentiment,
        confidence: sample.confidence,
        legalRisk: isLegal,
        containsPii: false,
        flaggedReasons: sample.flags ?? [],
        model: "demo-gpt-4o",
        promptVersion: "demo-v2",
        tokensIn: 320,
        tokensOut: 90,
        generationCostUsd: null,
        editedById: null,
        publishedAt: isPublished ? new Date(postedAt.getTime() + 1000 * 60 * 90) : null,
        publishError: null,
        publishAttempts: isPublished ? 1 : 0,
        supersededAt: null,
        createdAt: new Date(postedAt.getTime() + 1000 * 60),
        updatedAt: new Date(postedAt.getTime() + 1000 * 60),
      });

      if (isLegal) {
        escalations.push({
          id: `esc-${dealership.slug}-${i}`,
          organizationId: DEMO_ORG_ID,
          dealershipId: dealership.id,
          reviewId,
          severity: "CRITICAL",
          reason: "Legal risk detected by AI",
          matchedKeywords: ["lawyer", "BBB", "attorney general"].filter((k) =>
            sample.body.toLowerCase().includes(k.toLowerCase()),
          ),
          resolvedAt: null,
          resolvedById: null,
          resolutionNote: null,
          createdAt: new Date(postedAt.getTime() + 1000 * 120),
          updatedAt: new Date(postedAt.getTime() + 1000 * 120),
        });
      }

      const baseActivities: DemoActivity[] = [
        {
          id: `act-${idx}-ingest`,
          organizationId: DEMO_ORG_ID,
          reviewId,
          actorId: null,
          kind: "REVIEW_INGESTED",
          message: null,
          metadata: { platform: source.platform, sourceId: source.id },
          createdAt: new Date(postedAt.getTime() + 1000 * 30),
        },
        {
          id: `act-${idx}-gen`,
          organizationId: DEMO_ORG_ID,
          reviewId,
          actorId: null,
          kind: "RESPONSE_GENERATED",
          message: null,
          metadata: { confidence: sample.confidence, model: "demo-gpt-4o" },
          createdAt: new Date(postedAt.getTime() + 1000 * 90),
        },
      ];
      if (isPublished) {
        baseActivities.push(
          {
            id: `act-${idx}-approve`,
            organizationId: DEMO_ORG_ID,
            reviewId,
            actorId: DEMO_GM_ID,
            kind: "RESPONSE_APPROVED",
            message: null,
            metadata: {},
            createdAt: new Date(postedAt.getTime() + 1000 * 60 * 60),
          },
          {
            id: `act-${idx}-publish`,
            organizationId: DEMO_ORG_ID,
            reviewId,
            actorId: null,
            kind: "RESPONSE_PUBLISHED",
            message: `Published reply to ${source.platform}`,
            metadata: { platform: source.platform },
            createdAt: new Date(postedAt.getTime() + 1000 * 60 * 90),
          },
        );
      }
      if (isLegal) {
        baseActivities.push({
          id: `act-${idx}-escalate`,
          organizationId: DEMO_ORG_ID,
          reviewId,
          actorId: null,
          kind: "ESCALATED",
          message: "Legal risk detected by AI",
          metadata: { severity: "CRITICAL" },
          createdAt: new Date(postedAt.getTime() + 1000 * 120),
        });
      }
      activities.push(...baseActivities);
      idx++;
    }
  }

  return {
    org,
    users,
    memberships,
    dealerships,
    locations,
    sources,
    reviews,
    responses,
    escalations,
    activities,
    notes: [] as DemoNote[],
  };
}

export const fixture = buildFixture();
