import { ReviewPlatform } from "@prisma/client";
import { httpRequest } from "../base/http";
import { ProviderError } from "@/lib/utils/errors";
import type {
  FetchResult,
  NormalizedReview,
  ProviderContext,
  ReviewProvider,
} from "../base/types";

// Yelp Fusion: public endpoint returns up to 3 most-recent reviews per business.
// For full review streams the dealership must enroll in Yelp Knowledge / partner API.
type YelpReview = {
  id: string;
  rating: number;
  text: string;
  time_created: string;
  url: string;
  user: { name?: string; image_url?: string };
};

export const yelpProvider: ReviewProvider = {
  platform: ReviewPlatform.YELP,

  async fetchSince(ctx: ProviderContext): Promise<FetchResult> {
    const key = ctx.credentials.apiKey ?? process.env.YELP_API_KEY;
    if (!key) throw new ProviderError("Yelp API key missing", false);
    const base = process.env.YELP_FUSION_BASE_URL ?? "https://api.yelp.com/v3";
    const url = `${base}/businesses/${encodeURIComponent(ctx.externalLocationId)}/reviews?limit=20&sort_by=newest`;

    const data = await httpRequest<{ reviews?: YelpReview[] }>(url, {
      headers: { Authorization: `Bearer ${key}` },
    });

    const reviews: NormalizedReview[] = (data.reviews ?? []).map((r) => ({
      platform: ReviewPlatform.YELP,
      externalId: r.id,
      externalUrl: r.url,
      authorName: r.user?.name,
      authorAvatarUrl: r.user?.image_url,
      rating: r.rating,
      body: r.text,
      postedAt: new Date(r.time_created),
      raw: r,
    }));

    return { reviews };
  },

  // Yelp does not officially allow programmatic owner replies via Fusion.
  // Publishing is left undefined; the worker treats this as "manual publish".
};
