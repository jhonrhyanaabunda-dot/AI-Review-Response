/**
 * Soft demo config (CTAs, banner copy) read from demo-data/fixture.json.
 *
 * Everything here is editable from the GitHub web UI - push and Vercel
 * rebuilds in ~30 seconds, no env vars touched.
 */
import fixture from "../../../demo-data/fixture.json";

export type PricingTier = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
  highlight: boolean;
};

export type RoiDefaults = {
  reviewsPerMonth: number;
  currentResponseHours: number;
  minutesPerReplyToday: number;
  minutesPerReplyWithA3: number;
  hourlyRate: number;
};

export type FaqItem = { q: string; a: string };

type Config = {
  bookACallUrl: string;
  bookACallLabel: string;
  supportEmail: string;
  demoBanner: { enabled: boolean; text: string };
  roi: { defaults: RoiDefaults };
  pricing: { tiers: PricingTier[] };
  faq: FaqItem[];
};

const FALLBACK: Config = {
  bookACallUrl: "mailto:a3brandsllc@gmail.com",
  bookACallLabel: "Book a call",
  supportEmail: "a3brandsllc@gmail.com",
  demoBanner: { enabled: true, text: "Interactive demo." },
  roi: {
    defaults: {
      reviewsPerMonth: 80,
      currentResponseHours: 48,
      minutesPerReplyToday: 8,
      minutesPerReplyWithA3: 1,
      hourlyRate: 35,
    },
  },
  pricing: { tiers: [] },
  faq: [],
};

export const config: Config = {
  ...FALLBACK,
  ...((fixture as { config?: Partial<Config> }).config ?? {}),
};
