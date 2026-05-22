import type { ReviewPlatform } from "@prisma/client";
import type { ReviewProvider } from "./types";
import { googleProvider } from "../google";
import { yelpProvider } from "../yelp";
import { dealerraterProvider } from "../dealerrater";
import { carsdotcomProvider } from "../carsdotcom";
import { facebookProvider } from "../facebook";
import { bbbProvider } from "../bbb";

const REGISTRY: Record<ReviewPlatform, ReviewProvider> = {
  GOOGLE: googleProvider,
  YELP: yelpProvider,
  DEALERRATER: dealerraterProvider,
  CARS_DOT_COM: carsdotcomProvider,
  FACEBOOK: facebookProvider,
  BBB: bbbProvider,
};

export function getProvider(platform: ReviewPlatform): ReviewProvider {
  const p = REGISTRY[platform];
  if (!p) throw new Error(`No provider registered for platform ${platform}`);
  return p;
}

export function allProviders(): ReviewProvider[] {
  return Object.values(REGISTRY);
}
