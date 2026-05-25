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

// Google Business Profile (Locations / Reviews) v4.9 endpoints.
// The integration uses OAuth2 with the My Business Account API.
// We only sketch the shapes here - credentials must be supplied via OAuth.
type GoogleReview = {
  name: string; // accounts/{a}/locations/{l}/reviews/{r}
  reviewId: string;
  reviewer: { displayName?: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
};

const STAR_MAP: Record<GoogleReview["starRating"], number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

function normalize(r: GoogleReview, locationName: string): NormalizedReview {
  return {
    platform: ReviewPlatform.GOOGLE,
    externalId: r.reviewId,
    externalUrl: `https://search.google.com/local/reviews?placeid=${locationName}`,
    authorName: r.reviewer?.displayName,
    authorAvatarUrl: r.reviewer?.profilePhotoUrl,
    rating: STAR_MAP[r.starRating],
    body: r.comment ?? "",
    postedAt: new Date(r.createTime),
    raw: r,
  };
}

export const googleProvider: ReviewProvider = {
  platform: ReviewPlatform.GOOGLE,

  async fetchSince(ctx: ProviderContext, cursor?: string): Promise<FetchResult> {
    const accessToken = ctx.credentials.accessToken;
    if (!accessToken) {
      throw new ProviderError("Google access token missing", false);
    }
    const base = "https://mybusiness.googleapis.com/v4";
    const url = new URL(`${base}/${ctx.externalLocationId}/reviews`);
    url.searchParams.set("pageSize", "50");
    if (cursor) url.searchParams.set("pageToken", cursor);

    const data = await httpRequest<{
      reviews?: GoogleReview[];
      nextPageToken?: string;
    }>(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      reviews: (data.reviews ?? []).map((r) => normalize(r, ctx.externalLocationId)),
      nextCursor: data.nextPageToken,
    };
  },

  async publishResponse(
    ctx: ProviderContext,
    input: PublishInput,
  ): Promise<PublishResult> {
    const accessToken = ctx.credentials.accessToken;
    if (!accessToken) throw new ProviderError("Google access token missing", false);
    const base = "https://mybusiness.googleapis.com/v4";
    const url = `${base}/${ctx.externalLocationId}/reviews/${input.reviewExternalId}/reply`;
    await httpRequest<unknown>(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: input.responseBody }),
    });
    return { publishedAt: new Date() };
  },
};
