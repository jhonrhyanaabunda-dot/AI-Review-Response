import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pitch", "/pricing", "/methodology", "/security", "/privacy", "/terms"],
        // Per-prospect overlay URLs and demo internals shouldn't be indexed.
        disallow: ["/p/", "/api/", "/dashboard", "/inbox", "/reviews", "/analytics", "/dealerships", "/team", "/settings"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
