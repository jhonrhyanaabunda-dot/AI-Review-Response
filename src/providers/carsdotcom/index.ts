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

type CarsReview = {
  id: string;
  url?: string;
  reviewer?: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
};

export const carsdotcomProvider: ReviewProvider = {
  platform: ReviewPlatform.CARS_DOT_COM,

  async fetchSince(ctx: ProviderContext, cursor?: string): Promise<FetchResult> {
    const key = ctx.credentials.apiKey ?? process.env.CARSDOTCOM_API_KEY;
    if (!key) throw new ProviderError("Cars.com API key missing", false);
    const base = "https://api.cars.com/dealer/v1";
    const url = new URL(`${base}/dealers/${ctx.externalLocationId}/reviews`);
    url.searchParams.set("limit", "50");
    if (cursor) url.searchParams.set("cursor", cursor);

    const data = await httpRequest<{
      data?: CarsReview[];
      meta?: { nextCursor?: string };
    }>(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
    });

    return {
      reviews: (data.data ?? []).map((r) => ({
        platform: ReviewPlatform.CARS_DOT_COM,
        externalId: r.id,
        externalUrl: r.url,
        authorName: r.reviewer,
        rating: r.rating,
        title: r.title,
        body: r.body,
        postedAt: new Date(r.createdAt),
        raw: r,
      })),
      nextCursor: data.meta?.nextCursor,
    };
  },

  async publishResponse(
    ctx: ProviderContext,
    input: PublishInput,
  ): Promise<PublishResult> {
    const key = ctx.credentials.apiKey ?? process.env.CARSDOTCOM_API_KEY;
    if (!key) throw new ProviderError("Cars.com API key missing", false);
    await httpRequest<unknown>(
      `https://api.cars.com/dealer/v1/dealers/${ctx.externalLocationId}/reviews/${input.reviewExternalId}/reply`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: input.responseBody }),
      },
    );
    return { publishedAt: new Date() };
  },
};
