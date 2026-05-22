import { ReviewPlatform } from "@prisma/client";
import { httpRequest } from "../base/http";
import { ProviderError } from "@/lib/utils/errors";
import type {
  FetchResult,
  NormalizedReview,
  ProviderContext,
  PublishInput,
  PublishResult,
  ReviewProvider,
} from "../base/types";

// Better Business Bureau (BBB) — pulls reviews and complaints for a
// dealership's BBB profile. BBB exposes a partner Reviews API to accredited
// businesses; the endpoint shape below mirrors that contract. Complaints
// (separate from reviews) come through the same adapter and are normalized
// to a review with a low rating so the GM sees them in the same inbox.
type BBBReview = {
  id: string | number;
  url?: string;
  authorName?: string;
  rating?: number;          // 1..5 on reviews
  isComplaint?: boolean;    // when true, this is a complaint, not a star review
  title?: string;
  body: string;
  createdAt: string;
};

export const bbbProvider: ReviewProvider = {
  platform: ReviewPlatform.BBB,

  async fetchSince(ctx: ProviderContext, cursor?: string): Promise<FetchResult> {
    const key = ctx.credentials.apiKey;
    if (!key) throw new ProviderError("BBB API key missing", false);
    const base = "https://api.bbb.org/partner/v1";
    const url = new URL(`${base}/businesses/${ctx.externalLocationId}/reviews`);
    url.searchParams.set("pageSize", "50");
    if (cursor) url.searchParams.set("after", cursor);

    const data = await httpRequest<{
      reviews?: BBBReview[];
      nextCursor?: string;
    }>(url.toString(), {
      headers: { "X-Api-Key": key },
    });

    const reviews: NormalizedReview[] = (data.reviews ?? []).map((r) => ({
      platform: ReviewPlatform.BBB,
      externalId: String(r.id),
      externalUrl: r.url,
      authorName: r.authorName,
      // Complaints have no star rating from BBB; we surface them as 1★ so
      // they show up in the negative bucket and route through escalation.
      rating: r.rating ?? (r.isComplaint ? 1 : 3),
      title: r.title,
      body: r.body,
      postedAt: new Date(r.createdAt),
      raw: r,
    }));

    return { reviews, nextCursor: data.nextCursor };
  },

  async publishResponse(
    ctx: ProviderContext,
    input: PublishInput,
  ): Promise<PublishResult> {
    const key = ctx.credentials.apiKey;
    if (!key) throw new ProviderError("BBB API key missing", false);
    const res = await httpRequest<{ replyId?: string }>(
      `https://api.bbb.org/partner/v1/businesses/${ctx.externalLocationId}/reviews/${input.reviewExternalId}/response`,
      {
        method: "POST",
        headers: { "X-Api-Key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ body: input.responseBody }),
      },
    );
    return { publishedAt: new Date(), externalResponseId: res.replyId };
  },
};
