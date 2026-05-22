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

// Facebook recommendations are surfaced via the Page Ratings edge using a
// Page Access Token. Replies are posted as Comments on the rating's open_graph_story.
type FbRating = {
  open_graph_story?: { id?: string };
  reviewer?: { id?: string; name?: string };
  rating?: number;
  recommendation_type?: "positive" | "negative";
  review_text?: string;
  created_time: string;
  permalink_url?: string;
};

export const facebookProvider: ReviewProvider = {
  platform: ReviewPlatform.FACEBOOK,

  async fetchSince(ctx: ProviderContext, cursor?: string): Promise<FetchResult> {
    const token = ctx.credentials.accessToken;
    if (!token) throw new ProviderError("Facebook page token missing", false);
    const url = new URL(`https://graph.facebook.com/v18.0/${ctx.externalLocationId}/ratings`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("limit", "50");
    if (cursor) url.searchParams.set("after", cursor);

    const data = await httpRequest<{
      data?: FbRating[];
      paging?: { cursors?: { after?: string }; next?: string };
    }>(url.toString());

    const reviews: NormalizedReview[] = (data.data ?? [])
      .filter((r) => r.open_graph_story?.id)
      .map((r) => ({
        platform: ReviewPlatform.FACEBOOK,
        externalId: r.open_graph_story!.id!,
        externalUrl: r.permalink_url,
        authorName: r.reviewer?.name,
        rating:
          typeof r.rating === "number"
            ? r.rating
            : r.recommendation_type === "positive"
              ? 5
              : 1,
        body: r.review_text ?? "",
        postedAt: new Date(r.created_time),
        raw: r,
      }));

    return {
      reviews,
      nextCursor: data.paging?.next ? data.paging.cursors?.after : undefined,
    };
  },

  async publishResponse(
    ctx: ProviderContext,
    input: PublishInput,
  ): Promise<PublishResult> {
    const token = ctx.credentials.accessToken;
    if (!token) throw new ProviderError("Facebook page token missing", false);
    const res = await httpRequest<{ id?: string }>(
      `https://graph.facebook.com/v18.0/${input.reviewExternalId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.responseBody, access_token: token }),
      },
    );
    return { publishedAt: new Date(), externalResponseId: res.id };
  },
};
