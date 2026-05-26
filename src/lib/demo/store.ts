/**
 * Demo store: query + mutation helpers over the in-memory fixture.
 *
 * Every dashboard page and API route reads from here instead of Prisma.
 * Mutations (approve, reject, regenerate, bulk-approve, notes) update the
 * fixture in place. On serverless platforms this only persists within a
 * warm instance, which is the right tradeoff for a public demo.
 */
import type {
  ReviewPlatform,
  Sentiment,
  ReviewStatus,
  ResponseStatus,
} from "@prisma/client";
import {
  fixture,
  DEMO_ORG_ID,
  DEMO_GM_ID,
  type DemoReview,
  type DemoResponse,
  type DemoActivity,
  type DemoDealership,
  type DemoNote,
  type DemoEscalation,
  type DemoLocation,
} from "./data";

export { DEMO_ORG_ID, DEMO_GM_ID };

// ─────────────────────────── Lookups ───────────────────────────

export function getOrg() {
  return fixture.org;
}

export function listDealerships() {
  return fixture.dealerships.map((d) => ({
    ...d,
    _count: {
      locations: fixture.locations.filter((l) => l.dealershipId === d.id).length,
      reviews: fixture.reviews.filter((r) => r.dealershipId === d.id).length,
    },
  }));
}

export function findDealership(id: string): DemoDealership | undefined {
  return fixture.dealerships.find((d) => d.id === id);
}

export function listMembers() {
  return fixture.memberships
    .map((m) => {
      const user = fixture.users.find((u) => u.id === m.userId);
      const dealership = m.dealershipId
        ? fixture.dealerships.find((d) => d.id === m.dealershipId)
        : null;
      if (!user) return null;
      return { ...m, user, dealership };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}

// ─────────────────────────── Reviews ───────────────────────────

export type ReviewFilter = {
  dealershipId?: string;
  platform?: ReviewPlatform;
  sentiment?: Sentiment;
  status?: ReviewStatus;
  rating?: number;
  q?: string;
};

function activeResponse(reviewId: string): DemoResponse | undefined {
  return fixture.responses
    .filter((r) => r.reviewId === reviewId && r.supersededAt == null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

function reviewSorted() {
  return fixture.reviews
    .slice()
    .sort(
      (a, b) =>
        b.postedAt.getTime() - a.postedAt.getTime() || b.id.localeCompare(a.id),
    );
}

export function listReviews(filter: ReviewFilter, cursor: string | undefined, limit: number) {
  let rows = reviewSorted().filter((r) => {
    if (filter.dealershipId && r.dealershipId !== filter.dealershipId) return false;
    if (filter.platform && r.platform !== filter.platform) return false;
    if (filter.sentiment && r.sentiment !== filter.sentiment) return false;
    if (filter.status && r.status !== filter.status) return false;
    if (filter.rating && r.rating !== filter.rating) return false;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      const hay = `${r.body} ${r.title ?? ""} ${r.authorName ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (cursor) {
    const idx = rows.findIndex((r) => r.id === cursor);
    if (idx >= 0) rows = rows.slice(idx + 1);
  }

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
    ...r,
    dealership: findDealership(r.dealershipId)!,
    responses: activeResponse(r.id) ? [activeResponse(r.id)!] : [],
    assignee: null as null,
  }));

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
  };
}

export function getReviewDetail(id: string) {
  const review = fixture.reviews.find((r) => r.id === id);
  if (!review) return null;
  const dealership = findDealership(review.dealershipId)!;
  const location: DemoLocation | null =
    fixture.locations.find((l) => l.id === review.locationId) ?? null;
  return {
    ...review,
    dealership,
    location,
    assignee: null as null,
    notes: fixture.notes
      .filter((n) => n.reviewId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    responses: fixture.responses
      .filter((r) => r.reviewId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    escalations: fixture.escalations
      .filter((e) => e.reviewId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    activityLogs: fixture.activities
      .filter((a) => a.reviewId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50),
  };
}

// ─────────────────────────── Inbox / published strip ───────────────────────────

export function listInboxItems() {
  const pending = reviewSorted()
    .map((r) => ({ review: r, response: activeResponse(r.id) }))
    .filter(
      (row) =>
        row.response &&
        (row.response.status === "PENDING_APPROVAL" || row.response.status === "DRAFT"),
    )
    .slice(0, 50);

  return pending.map(({ review, response }) => ({
    id: review.id,
    platform: review.platform,
    rating: review.rating,
    authorName: review.authorName,
    body: review.body,
    postedAt: review.postedAt,
    status: review.status,
    sentiment: review.sentiment,
    externalUrl: review.externalUrl,
    dealership: { name: findDealership(review.dealershipId)!.name },
    responses: response
      ? [
          {
            id: response.id,
            status: response.status,
            draftBody: response.draftBody,
            finalBody: response.finalBody,
            confidence: response.confidence,
            flaggedReasons: response.flaggedReasons,
          },
        ]
      : [],
  }));
}

export function listRecentPublished() {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return fixture.responses
    .filter(
      (r) =>
        r.status === "PUBLISHED" && r.publishedAt && r.publishedAt.getTime() >= since,
    )
    .sort((a, b) => (b.publishedAt!.getTime() - a.publishedAt!.getTime()))
    .slice(0, 6)
    .map((r) => {
      const review = fixture.reviews.find((rv) => rv.id === r.reviewId)!;
      return {
        reviewId: review.id,
        platform: review.platform,
        authorName: review.authorName,
        dealership: findDealership(review.dealershipId)!.name,
        publishedAt: r.publishedAt!,
      };
    });
}

// ─────────────────────────── Analytics ───────────────────────────

export type AnalyticsRange = { from: Date; to: Date };

function reviewsInRange(range: AnalyticsRange, dealershipId?: string) {
  return fixture.reviews.filter(
    (r) =>
      r.postedAt >= range.from &&
      r.postedAt <= range.to &&
      (!dealershipId || r.dealershipId === dealershipId),
  );
}

export function dashboardSummary(range: AnalyticsRange, dealershipId?: string) {
  const inRange = reviewsInRange(range, dealershipId);
  const totalReviews = inRange.length;
  const averageRating = totalReviews
    ? inRange.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;

  const sentiment: Record<string, number> = {};
  for (const r of inRange) {
    const k = r.sentiment ?? "UNCLASSIFIED";
    sentiment[k] = (sentiment[k] ?? 0) + 1;
  }

  const status: Record<string, number> = {};
  for (const r of inRange) {
    status[r.status] = (status[r.status] ?? 0) + 1;
  }

  const responsesInRange = fixture.responses.filter((resp) => {
    if (!resp.publishedAt) return false;
    return resp.publishedAt >= range.from && resp.publishedAt <= range.to;
  });
  const publishedCount = responsesInRange.filter(
    (r) => r.status === "PUBLISHED",
  ).length;
  const approvedCount = fixture.responses.filter(
    (r) => r.status === "APPROVED" && r.createdAt >= range.from && r.createdAt <= range.to,
  ).length;
  const pendingCount = fixture.responses.filter(
    (r) => r.status === "PENDING_APPROVAL" && r.supersededAt == null,
  ).length;
  const escalated = fixture.escalations.filter(
    (e) => e.createdAt >= range.from && e.createdAt <= range.to,
  ).length;

  return {
    totalReviews,
    averageRating,
    sentiment,
    status,
    publishedCount,
    approvedCount,
    pendingCount,
    escalated,
    aiApprovalRate:
      approvedCount + publishedCount > 0
        ? publishedCount / (publishedCount + approvedCount)
        : 0,
  };
}

export function ratingTrend(range: AnalyticsRange, dealershipId?: string) {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of reviewsInRange(range, dealershipId)) {
    const day = r.postedAt.toISOString().slice(0, 10);
    const cur = buckets.get(day) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    buckets.set(day, cur);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, b]) => ({
      day,
      avg: Number((b.sum / b.count).toFixed(2)),
      count: b.count,
    }));
}

export function platformBreakdown(range: AnalyticsRange, dealershipId?: string) {
  const buckets = new Map<ReviewPlatform, { count: number; sum: number }>();
  for (const r of reviewsInRange(range, dealershipId)) {
    const cur = buckets.get(r.platform) ?? { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += r.rating;
    buckets.set(r.platform, cur);
  }
  return Array.from(buckets.entries()).map(([platform, b]) => ({
    platform,
    count: b.count,
    avgRating: Number((b.sum / b.count).toFixed(2)),
  }));
}

export function dealershipBreakdown(range: AnalyticsRange) {
  const buckets = new Map<string, { count: number; sum: number }>();
  for (const r of reviewsInRange(range)) {
    const cur = buckets.get(r.dealershipId) ?? { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += r.rating;
    buckets.set(r.dealershipId, cur);
  }
  return Array.from(buckets.entries()).map(([dealershipId, b]) => {
    const d = findDealership(dealershipId);
    return {
      dealership: d ? { id: d.id, name: d.name, brand: d.brand } : null,
      reviews: b.count,
      avgRating: b.sum / b.count,
    };
  });
}

export function responseTimeP50(range: AnalyticsRange): number {
  const deltas: number[] = [];
  for (const resp of fixture.responses) {
    if (!resp.publishedAt) continue;
    const review = fixture.reviews.find((r) => r.id === resp.reviewId);
    if (!review) continue;
    if (review.postedAt < range.from || review.postedAt > range.to) continue;
    deltas.push((resp.publishedAt.getTime() - review.postedAt.getTime()) / 1000);
  }
  if (deltas.length === 0) return 0;
  deltas.sort((a, b) => a - b);
  return deltas[Math.floor(deltas.length / 2)];
}

// ─────────────────────────── Mutations ───────────────────────────

function logActivity(
  reviewId: string,
  kind: DemoActivity["kind"],
  message: string | null,
  metadata: Record<string, unknown>,
  actorId: string | null = DEMO_GM_ID,
) {
  fixture.activities.push({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organizationId: DEMO_ORG_ID,
    reviewId,
    actorId,
    kind,
    message,
    metadata,
    createdAt: new Date(),
  });
}

export function decideReview(args: {
  reviewId: string;
  decision: "APPROVED" | "REJECTED";
  finalBody?: string;
}): { id: string; status: ResponseStatus; finalBody?: string } | null {
  const review = fixture.reviews.find((r) => r.id === args.reviewId);
  if (!review) return null;
  const draft = activeResponse(args.reviewId);
  if (!draft || (draft.status !== "PENDING_APPROVAL" && draft.status !== "DRAFT")) {
    return null;
  }

  if (args.decision === "REJECTED") {
    draft.status = "REJECTED";
    draft.updatedAt = new Date();
    logActivity(args.reviewId, "RESPONSE_REJECTED", null, { responseId: draft.id });
    return { id: draft.id, status: "REJECTED" };
  }

  const finalBody = args.finalBody?.trim() || draft.draftBody;
  const edited = finalBody !== draft.draftBody;
  draft.finalBody = finalBody;
  draft.status = "APPROVED";
  draft.editedById = edited ? DEMO_GM_ID : draft.editedById;
  draft.updatedAt = new Date();
  logActivity(
    args.reviewId,
    edited ? "RESPONSE_EDITED" : "RESPONSE_APPROVED",
    null,
    { responseId: draft.id, edited },
  );

  // Simulate inline publish.
  draft.status = "PUBLISHED";
  draft.publishedAt = new Date();
  draft.publishAttempts += 1;
  review.status = "RESPONDED";
  review.updatedAt = new Date();
  logActivity(
    args.reviewId,
    "RESPONSE_PUBLISHED",
    `Published reply to ${review.platform}`,
    { platform: review.platform, mode: "inline" },
    null,
  );

  return { id: draft.id, status: "PUBLISHED", finalBody };
}

export function bulkApproveReviews(reviewIds: string[]) {
  let approved = 0;
  for (const id of reviewIds) {
    if (decideReview({ reviewId: id, decision: "APPROVED" })) approved += 1;
  }
  return { approved };
}

const REGENERATE_VARIANTS = [
  "Thank you for sharing this with us. Your feedback genuinely helps us hold the bar where it belongs, and we want to make sure the next visit lands exactly the way it should. If there's anything we can address now, please reach out - we're here for it.",
  "We really appreciate you taking a minute to write this up. Reviews like yours are how we keep getting sharper as a team. We'd love to keep the conversation going - feel free to reply or drop us a line directly.",
  "Thanks so much for the note - it means a lot. Stories from customers like you are what keep us doing this work the right way. If there's anything else we can help with, you know where to find us.",
];

export function regenerateResponse(reviewId: string): DemoResponse | null {
  const review = fixture.reviews.find((r) => r.id === reviewId);
  if (!review) return null;
  const current = activeResponse(reviewId);
  if (!current) return null;

  current.supersededAt = new Date();
  current.updatedAt = new Date();

  const dealership = findDealership(review.dealershipId);
  const variant =
    REGENERATE_VARIANTS[Math.floor(Math.random() * REGENERATE_VARIANTS.length)];
  const signOff = dealership?.signOff ?? "- The Team";

  const next: DemoResponse = {
    ...current,
    id: `resp-${reviewId}-${Date.now()}`,
    status: "PENDING_APPROVAL",
    draftBody: `${variant}\n${signOff}`,
    finalBody: null,
    confidence: Math.min(0.98, current.confidence + 0.05),
    flaggedReasons: [],
    publishedAt: null,
    publishError: null,
    publishAttempts: 0,
    supersededAt: null,
    editedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  fixture.responses.push(next);

  logActivity(reviewId, "RESPONSE_GENERATED", null, {
    responseId: next.id,
    model: "demo-gpt-4o",
    confidence: next.confidence,
  });

  return next;
}

export function addNote(reviewId: string, body: string): DemoNote | null {
  const review = fixture.reviews.find((r) => r.id === reviewId);
  if (!review) return null;
  const note: DemoNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reviewId,
    authorId: DEMO_GM_ID,
    body,
    createdAt: new Date(),
  };
  fixture.notes.push(note);
  return note;
}

export type ListDealershipsResult = ReturnType<typeof listDealerships>;
export type DemoMemberRow = ReturnType<typeof listMembers>[number];
export type DemoReviewRow = ReturnType<typeof listReviews>["items"][number];
export type DemoReviewDetail = NonNullable<ReturnType<typeof getReviewDetail>>;
export type DemoEscalationRow = DemoEscalation;
export type DemoReviewRecord = DemoReview;
