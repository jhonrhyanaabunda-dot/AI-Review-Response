import { z } from "zod";

export const cuid = z.string().min(20).max(40);

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const reviewFilterSchema = z.object({
  // Accept arbitrary string IDs - the demo store uses short slugs like
  // "d-smith" rather than CUIDs, so the stricter `cuid` shape would reject them.
  dealershipId: z.string().min(1).max(60).optional(),
  platform: z
    .enum(["GOOGLE", "YELP", "DEALERRATER", "CARS_DOT_COM", "FACEBOOK", "BBB"])
    .optional(),
  sentiment: z
    .enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "ANGRY", "LEGAL_RISK"])
    .optional(),
  status: z
    .enum(["NEW", "IN_PROGRESS", "RESPONDED", "IGNORED", "ESCALATED"])
    .optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  q: z.string().trim().max(200).optional(),
  // Last-N-days window. "all" or omitted = no filter.
  days: z
    .union([z.literal("all"), z.coerce.number().int().min(1).max(365)])
    .optional(),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});

export const responseDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().max(2000).optional(),
  finalBody: z.string().max(8000).optional(),
});

export const dealershipUpsertSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, digits, hyphens"),
  brand: z.string().max(60).optional(),
  websiteUrl: z.string().url().optional(),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().max(30).optional(),
  timezone: z.string().max(60).default("America/New_York"),
  tonePreset: z
    .enum(["LUXURY", "FRIENDLY", "CORPORATE", "OEM_COMPLIANT", "CUSTOM"])
    .default("FRIENDLY"),
  customTone: z.string().max(2000).optional(),
  aiInstructions: z.string().max(4000).optional(),
  signOff: z.string().max(200).optional(),
  escalationKeywords: z.array(z.string().min(1).max(80)).max(100).default([]),
  escalationEmails: z.array(z.string().email()).max(50).default([]),
  autoPublishThreshold: z.number().int().min(1).max(5).default(4),
  requireApproval: z.boolean().default(true),
});

export const locationUpsertSchema = z.object({
  dealershipId: cuid,
  name: z.string().min(2).max(120),
  address1: z.string().max(200).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).default("US"),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "AGENCY_ADMIN",
    "GENERAL_MANAGER",
    "MARKETING_DIRECTOR",
    "RESPONSE_AGENT",
  ]),
  dealershipId: cuid.optional(),
});

export type ReviewFilter = z.infer<typeof reviewFilterSchema>;
export type DealershipInput = z.infer<typeof dealershipUpsertSchema>;
