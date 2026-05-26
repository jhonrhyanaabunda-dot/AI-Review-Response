import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typedRoutes is overly strict for a prototype with dynamic redirects.
  typedRoutes: false,
  // pptxgenjs uses node:fs / node:https for its Node path; exclude it from
  // the webpack browser bundle so it only resolves server-side.
  serverExternalPackages: ["@prisma/client", "argon2", "pptxgenjs"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
