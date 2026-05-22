import type { ReviewPlatform } from "@prisma/client";

/**
 * Platform-agnostic representation of a single review fetched from
 * an external source. Every provider adapter must produce this shape.
 */
export type NormalizedReview = {
  platform: ReviewPlatform;
  externalId: string;
  externalUrl?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  rating: number; // 1..5
  title?: string;
  body: string;
  language?: string;
  postedAt: Date;
  raw: unknown; // original payload
};

export type FetchResult = {
  reviews: NormalizedReview[];
  nextCursor?: string;
};

export type PublishInput = {
  reviewExternalId: string;
  responseBody: string;
};

export type PublishResult = {
  publishedAt: Date;
  externalResponseId?: string;
};

export type ProviderCredentials = {
  // OAuth-style
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  // Static API keys
  apiKey?: string;
  // Arbitrary extras (e.g. account id)
  extra?: Record<string, unknown>;
};

export type ProviderContext = {
  credentials: ProviderCredentials;
  externalLocationId: string;
  config?: Record<string, unknown>;
};

export interface ReviewProvider {
  readonly platform: ReviewPlatform;
  fetchSince(ctx: ProviderContext, cursor?: string): Promise<FetchResult>;
  publishResponse?(ctx: ProviderContext, input: PublishInput): Promise<PublishResult>;
}
