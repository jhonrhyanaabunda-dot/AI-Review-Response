/**
 * Demo store: query + mutation helpers over the in-memory fixture.
 *
 * Reads visitor-specific state (approvals, rejections, regenerated drafts,
 * prospect overlay) from the demo state cookie via next/headers - so all
 * pages render a consistent view of "what the visitor has done so far"
 * even after the serverless instance cold-starts.
 */
import { cookies } from "next/headers";
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
import {
  DEMO_COOKIE,
  decodeState,
  overlayForReview,
  type DemoState,
} from "./state-cookie";
import { loadProspect, type Prospect } from "./prospects";

export { DEMO_ORG_ID, DEMO_GM_ID };

// ─────────────────────────── Cookie/prospect resolution ───────────────────────────

async function readState(): Promise<DemoState> {
  // next/headers cookies() is sync in Next 15.0.x but became async in 15.x;
  // await unconditionally so both work.
  const jar = await cookies();
  const raw = jar.get(DEMO_COOKIE)?.value;
  return decodeState(raw);
}

async function activeProspect(): Promise<Prospect | null> {
  const state = await readState();
  if (!state.p) return null;
  return loadProspect(state.p);
}

function applyProspectOrg(prospect: Prospect | null) {
  if (!prospect) return fixture.org;
  return {
    ...fixture.org,
    name: prospect.orgName,
    slug: prospect.slug,
  };
}

function dealershipsWithProspect(prospect: Prospect | null): DemoDealership[] {
  if (!prospect) return fixture.dealerships;
  return fixture.dealerships.map((d, i) => {
    const p = prospect.dealerships?.[i];
    if (!p) return d;
    return {
      ...d,
      name: p.name ?? d.name,
      brand: p.brand ?? d.brand,
      signOff: p.signOff ?? d.signOff,
    };
  });
}

function applyProspectToReviewBody(
  body: string,
  dealershipName: string,
  prospect: Prospect | null,
): string {
  if (!prospect) return body;
  const base = fixture.dealerships.find((d) => d.name === dealershipName);
  if (!base) return body;
  return body.split(base.name).join(dealershipName);
}

function applyProspectToDraft(
  draft: string,
  dealershipName: string,
  prospect: Prospect | null,
): string {
  if (!prospect) return draft;
  const baseIdx = fixture.dealerships.findIndex((d) => d.name === dealershipName);
  const base = fixture.dealerships[baseIdx];
  if (!base) return draft;
  let out = draft.split(base.name).join(dealershipName);
  if (base.signOff) {
    const newSignOff = dealershipsWithProspect(prospect)[baseIdx]?.signOff ?? base.signOff;
    out = out.split(base.signOff).join(newSignOff);
  }
  return out;
}

// ─────────────────────────── Lookups ───────────────────────────

export async function getOrg() {
  return applyProspectOrg(await activeProspect());
}

export async function listDealerships() {
  const prospect = await activeProspect();
  return dealershipsWithProspect(prospect).map((d) => ({
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

async function findDealershipWithProspect(id: string): Promise<DemoDealership | undefined> {
  const prospect = await activeProspect();
  return dealershipsWithProspect(prospect).find((d) => d.id === id);
}

export async function listMembers() {
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

export type ReviewSort = "newest" | "oldest" | "highest" | "lowest";

export type ReviewFilter = {
  dealershipId?: string;
  platform?: ReviewPlatform;
  sentiment?: Sentiment;
  status?: ReviewStatus;
  rating?: number;
  q?: string;
  days?: number | "all";
  sort?: ReviewSort;
};

function baseActiveResponse(reviewId: string): DemoResponse | undefined {
  return fixture.responses
    .filter((r) => r.reviewId === reviewId && r.supersededAt == null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

async function activeResponse(reviewId: string): Promise<DemoResponse | undefined> {
  const base = baseActiveResponse(reviewId);
  if (!base) return undefined;
  const state = await readState();
  const prospect = await activeProspect();
  const baseDealership = fixture.reviews.find((r) => r.id === reviewId)?.dealershipId;
  const dealership = baseDealership
    ? dealershipsWithProspect(prospect).find((d) => d.id === baseDealership)
    : undefined;
  const overlay = overlayForReview(state, reviewId, {
    responseStatus: base.status,
    reviewStatus: fixture.reviews.find((r) => r.id === reviewId)?.status ?? "NEW",
  });
  const draftBody = overlay.draftBody ?? base.draftBody;
  return {
    ...base,
    draftBody: dealership ? applyProspectToDraft(draftBody, dealership.name, prospect) : draftBody,
    finalBody: overlay.finalBody
      ? dealership
        ? applyProspectToDraft(overlay.finalBody, dealership.name, prospect)
        : overlay.finalBody
      : base.finalBody,
    status: overlay.responseStatus,
    publishedAt: overlay.publishedAt ?? base.publishedAt,
  };
}

function reviewSorted(sort: ReviewSort = "newest") {
  const rows = fixture.reviews.slice();
  switch (sort) {
    case "oldest":
      rows.sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime() || a.id.localeCompare(b.id));
      break;
    case "highest":
      rows.sort((a, b) => b.rating - a.rating || b.postedAt.getTime() - a.postedAt.getTime());
      break;
    case "lowest":
      rows.sort((a, b) => a.rating - b.rating || b.postedAt.getTime() - a.postedAt.getTime());
      break;
    default:
      rows.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime() || b.id.localeCompare(a.id));
  }
  return rows;
}

async function reviewWithOverlay(r: DemoReview, state: DemoState, prospect: Prospect | null) {
  const overlay = overlayForReview(state, r.id, {
    responseStatus: baseActiveResponse(r.id)?.status ?? "DRAFT",
    reviewStatus: r.status,
  });
  const dealership = dealershipsWithProspect(prospect).find((d) => d.id === r.dealershipId)!;
  return {
    ...r,
    body: applyProspectToReviewBody(r.body, dealership.name, prospect),
    status: overlay.reviewStatus,
  };
}

function matchesFilter(r: DemoReview, filter: ReviewFilter, state: DemoState): boolean {
  if (filter.dealershipId && r.dealershipId !== filter.dealershipId) return false;
  if (filter.platform && r.platform !== filter.platform) return false;
  if (filter.sentiment && r.sentiment !== filter.sentiment) return false;
  if (filter.rating && r.rating !== filter.rating) return false;
  if (filter.q) {
    const q = filter.q.toLowerCase();
    const hay = `${r.body} ${r.title ?? ""} ${r.authorName ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (filter.days && filter.days !== "all") {
    const cutoff = Date.now() - filter.days * 24 * 60 * 60 * 1000;
    if (r.postedAt.getTime() < cutoff) return false;
  }
  if (filter.status) {
    const overlay = overlayForReview(state, r.id, {
      responseStatus: baseActiveResponse(r.id)?.status ?? "DRAFT",
      reviewStatus: r.status,
    });
    if (overlay.reviewStatus !== filter.status) return false;
  }
  return true;
}

export async function listReviews(filter: ReviewFilter, cursor: string | undefined, limit: number) {
  const state = await readState();
  const prospect = await activeProspect();
  let rows = reviewSorted(filter.sort).filter((r) => matchesFilter(r, filter, state));

  if (cursor) {
    const idx = rows.findIndex((r) => r.id === cursor);
    if (idx >= 0) rows = rows.slice(idx + 1);
  }

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = await Promise.all(
    slice.map(async (r) => {
      const overlaid = await reviewWithOverlay(r, state, prospect);
      const resp = await activeResponse(r.id);
      return {
        ...overlaid,
        dealership: dealershipsWithProspect(prospect).find((d) => d.id === r.dealershipId)!,
        responses: resp ? [resp] : [],
        assignee: null as null,
      };
    }),
  );

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
  };
}

export async function getReviewDetail(id: string) {
  const review = fixture.reviews.find((r) => r.id === id);
  if (!review) return null;
  const state = await readState();
  const prospect = await activeProspect();
  const dealership = dealershipsWithProspect(prospect).find((d) => d.id === review.dealershipId)!;
  const location: DemoLocation | null =
    fixture.locations.find((l) => l.id === review.locationId) ?? null;
  const overlaid = await reviewWithOverlay(review, state, prospect);

  const overlay = overlayForReview(state, id, {
    responseStatus: baseActiveResponse(id)?.status ?? "DRAFT",
    reviewStatus: review.status,
  });

  // Build the response list, with the current draft overlaid if state has it.
  const responses = await Promise.all(
    fixture.responses
      .filter((r) => r.reviewId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(async (r, i) => {
        if (i === 0) {
          // Active response gets the overlay applied.
          const active = await activeResponse(id);
          return active ?? r;
        }
        return r;
      }),
  );

  // Synthesize activity log entries for cookie-driven decisions so the
  // timeline reflects what the visitor just did.
  const extraActivities: DemoActivity[] = [];
  const decision = state.decisions.find((d) => d.r === id);
  if (decision && decision.d === "APPROVED") {
    extraActivities.push({
      id: `act-cookie-approve-${id}`,
      organizationId: DEMO_ORG_ID,
      reviewId: id,
      actorId: DEMO_GM_ID,
      kind: "RESPONSE_APPROVED",
      message: null,
      metadata: {},
      createdAt: new Date(decision.t - 1000),
    });
    extraActivities.push({
      id: `act-cookie-publish-${id}`,
      organizationId: DEMO_ORG_ID,
      reviewId: id,
      actorId: null,
      kind: "RESPONSE_PUBLISHED",
      message: `Published reply to ${review.platform}`,
      metadata: { platform: review.platform, mode: "inline" },
      createdAt: new Date(decision.t),
    });
  } else if (decision && decision.d === "REJECTED") {
    extraActivities.push({
      id: `act-cookie-reject-${id}`,
      organizationId: DEMO_ORG_ID,
      reviewId: id,
      actorId: DEMO_GM_ID,
      kind: "RESPONSE_REJECTED",
      message: null,
      metadata: {},
      createdAt: new Date(decision.t),
    });
  }
  if (state.regen[id]) {
    extraActivities.push({
      id: `act-cookie-regen-${id}`,
      organizationId: DEMO_ORG_ID,
      reviewId: id,
      actorId: null,
      kind: "RESPONSE_GENERATED",
      message: "Regenerated draft via AI",
      metadata: { model: "claude-haiku" },
      createdAt: new Date(),
    });
  }

  return {
    ...overlaid,
    dealership,
    location,
    assignee: null as null,
    notes: fixture.notes
      .filter((n) => n.reviewId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    responses,
    escalations: fixture.escalations
      .filter((e) => e.reviewId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    activityLogs: [...extraActivities, ...fixture.activities.filter((a) => a.reviewId === id)]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50),
  };
}

// ─────────────────────────── Inbox / published strip ───────────────────────────

export async function listInboxItems() {
  const state = await readState();
  const prospect = await activeProspect();
  const pending = await Promise.all(
    reviewSorted().map(async (r) => {
      const active = await activeResponse(r.id);
      return { review: r, response: active };
    }),
  );

  const filtered = pending.filter(
    (row) =>
      row.response &&
      (row.response.status === "PENDING_APPROVAL" || row.response.status === "DRAFT"),
  );

  return Promise.all(
    filtered.slice(0, 50).map(async ({ review, response }) => {
      const overlaid = await reviewWithOverlay(review, state, prospect);
      return {
        id: review.id,
        platform: review.platform,
        rating: review.rating,
        authorName: review.authorName,
        body: overlaid.body,
        postedAt: review.postedAt,
        status: overlaid.status,
        sentiment: review.sentiment,
        externalUrl: review.externalUrl,
        dealership: {
          name: dealershipsWithProspect(prospect).find((d) => d.id === review.dealershipId)!.name,
        },
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
      };
    }),
  );
}

export async function listRecentPublished() {
  const state = await readState();
  const prospect = await activeProspect();
  const since = Date.now() - 24 * 60 * 60 * 1000;

  const cookiePublished = state.decisions
    .filter((d) => d.d === "APPROVED" && d.t >= since)
    .slice(0, 6)
    .map((d) => {
      const review = fixture.reviews.find((r) => r.id === d.r);
      if (!review) return null;
      return {
        reviewId: review.id,
        platform: review.platform,
        authorName: review.authorName,
        dealership:
          dealershipsWithProspect(prospect).find((dd) => dd.id === review.dealershipId)!.name,
        publishedAt: new Date(d.t),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  if (cookiePublished.length >= 6) return cookiePublished;

  const fillNeeded = 6 - cookiePublished.length;
  const baseline = fixture.responses
    .filter(
      (r) =>
        r.status === "PUBLISHED" && r.publishedAt && r.publishedAt.getTime() >= since,
    )
    .sort((a, b) => (b.publishedAt!.getTime() - a.publishedAt!.getTime()))
    .slice(0, fillNeeded)
    .map((r) => {
      const review = fixture.reviews.find((rv) => rv.id === r.reviewId)!;
      return {
        reviewId: review.id,
        platform: review.platform,
        authorName: review.authorName,
        dealership:
          dealershipsWithProspect(prospect).find((d) => d.id === review.dealershipId)!.name,
        publishedAt: r.publishedAt!,
      };
    });

  return [...cookiePublished, ...baseline];
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

export async function dashboardSummary(range: AnalyticsRange, dealershipId?: string) {
  const state = await readState();
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
    const overlay = overlayForReview(state, r.id, {
      responseStatus: baseActiveResponse(r.id)?.status ?? "DRAFT",
      reviewStatus: r.status,
    });
    status[overlay.reviewStatus] = (status[overlay.reviewStatus] ?? 0) + 1;
  }

  const baseResponses = fixture.responses;
  // Recalculate published/approved/pending against the cookie overlay.
  let publishedCount = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  for (const resp of baseResponses) {
    if (resp.supersededAt) continue;
    const review = fixture.reviews.find((r) => r.id === resp.reviewId);
    if (!review) continue;
    const overlay = overlayForReview(state, resp.reviewId, {
      responseStatus: resp.status,
      reviewStatus: review.status,
    });
    if (overlay.responseStatus === "PUBLISHED") {
      // Only count if originally in range or decided in range.
      const publishedAt = overlay.publishedAt ?? resp.publishedAt;
      if (publishedAt && publishedAt >= range.from && publishedAt <= range.to) {
        publishedCount += 1;
      }
    } else if (overlay.responseStatus === "APPROVED") {
      approvedCount += 1;
    } else if (overlay.responseStatus === "PENDING_APPROVAL") {
      pendingCount += 1;
    }
  }
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

export async function ratingTrend(range: AnalyticsRange, dealershipId?: string) {
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

export async function platformBreakdown(range: AnalyticsRange, dealershipId?: string) {
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

export async function dealershipBreakdown(range: AnalyticsRange) {
  const prospect = await activeProspect();
  const buckets = new Map<string, { count: number; sum: number }>();
  for (const r of reviewsInRange(range)) {
    const cur = buckets.get(r.dealershipId) ?? { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += r.rating;
    buckets.set(r.dealershipId, cur);
  }
  return Array.from(buckets.entries()).map(([dealershipId, b]) => {
    const d = dealershipsWithProspect(prospect).find((d) => d.id === dealershipId);
    return {
      dealership: d ? { id: d.id, name: d.name, brand: d.brand } : null,
      reviews: b.count,
      avgRating: b.sum / b.count,
    };
  });
}

export async function responseTimeP50(range: AnalyticsRange): Promise<number> {
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

// ─────────────────────────── Mutations (in-memory only, the cookie persists) ───────────────────────────

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

export function reviewExists(reviewId: string): boolean {
  return !!fixture.reviews.find((r) => r.id === reviewId);
}

export function findResponseById(id: string): DemoResponse | undefined {
  return fixture.responses.find((r) => r.id === id);
}

export async function reviewListStats(filter: ReviewFilter) {
  const state = await readState();
  const matching = fixture.reviews.filter((r) => matchesFilter(r, filter, state));
  const total = matching.length;
  const avgRating = total ? matching.reduce((s, r) => s + r.rating, 0) / total : 0;

  let respondedCount = 0;
  let pendingCount = 0;
  for (const r of matching) {
    const overlay = overlayForReview(state, r.id, {
      responseStatus: baseActiveResponse(r.id)?.status ?? "DRAFT",
      reviewStatus: r.status,
    });
    if (overlay.reviewStatus === "RESPONDED") respondedCount += 1;
    if (overlay.responseStatus === "PENDING_APPROVAL") pendingCount += 1;
  }

  return {
    total,
    avgRating,
    respondedCount,
    pendingCount,
    pendingRatio: total ? pendingCount / total : 0,
  };
}

export function getReviewBodyForAi(reviewId: string): {
  body: string;
  rating: number;
  authorName: string | null;
  dealershipName: string;
  signOff: string;
} | null {
  const review = fixture.reviews.find((r) => r.id === reviewId);
  if (!review) return null;
  const dealership = fixture.dealerships.find((d) => d.id === review.dealershipId);
  if (!dealership) return null;
  return {
    body: review.body,
    rating: review.rating,
    authorName: review.authorName,
    dealershipName: dealership.name,
    signOff: dealership.signOff,
  };
}

export type ListDealershipsResult = Awaited<ReturnType<typeof listDealerships>>;
export type DemoMemberRow = Awaited<ReturnType<typeof listMembers>>[number];
export type DemoReviewRow = Awaited<ReturnType<typeof listReviews>>["items"][number];
export type DemoReviewDetail = NonNullable<Awaited<ReturnType<typeof getReviewDetail>>>;
export type DemoEscalationRow = DemoEscalation;
export type DemoReviewRecord = DemoReview;
