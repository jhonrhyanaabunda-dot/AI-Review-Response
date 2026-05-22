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

// DealerRater Dealer Reviews API. Requires a partner contract with Cars.com.
// Endpoints below mirror their published shape; adjust to your contract.
type DealerRaterReview = {
  reviewId: string | number;
  url?: string;
  authorName?: string;
  rating: number;
  title?: string;
  body: string;
  postedAt: string;
};

export const dealerraterProvider: ReviewProvider = {
  platform: ReviewPlatform.DEALERRATER,

  async fetchSince(ctx: ProviderContext, cursor?: string): Promise<FetchResult> {
    const key = ctx.credentials.apiKey ?? process.env.DEALERRATER_API_KEY;
    if (!key) throw new ProviderError("DealerRater API key missing", false);
    const base = "https://api.dealerrater.com/v1";
    const url = new URL(`${base}/dealers/${ctx.externalLocationId}/reviews`);
    url.searchParams.set("pageSize", "50");
    if (cursor) url.searchParams.set("after", cursor);

    const data = await httpRequest<{
      reviews?: DealerRaterReview[];
      nextCursor?: string;
    }>(url.toString(), {
      headers: { "X-Api-Key": key },
    });

    const reviews: NormalizedReview[] = (data.reviews ?? []).map((r) => ({
      platform: ReviewPlatform.DEALERRATER,
      externalId: String(r.reviewId),
      externalUrl: r.url,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      body: r.body,
      postedAt: new Date(r.postedAt),
      raw: r,
    }));

    return { reviews, nextCursor: data.nextCursor };
  },

  async publishResponse(
    ctx: ProviderContext,
    input: PublishInput,
  ): Promise<PublishResult> {
    const key = ctx.credentials.apiKey ?? process.env.DEALERRATER_API_KEY;
    if (!key) throw new ProviderError("DealerRater API key missing", false);
    const url = `https://api.dealerrater.com/v1/dealers/${ctx.externalLocationId}/reviews/${input.reviewExternalId}/reply`;
    const res = await httpRequest<{ replyId?: string }>(url, {
      method: "POST",
      headers: { "X-Api-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ body: input.responseBody }),
    });
    return { publishedAt: new Date(), externalResponseId: res.replyId };
  },
};
