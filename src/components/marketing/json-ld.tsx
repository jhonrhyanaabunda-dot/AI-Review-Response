/**
 * Inject Organization + Product + FAQPage structured data into the
 * landing page. Improves Google rich-result eligibility.
 */
import { config } from "@/lib/demo/config";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export function MarketingJsonLd() {
  const supportEmail = config.supportEmail;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "A3 Brands",
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    sameAs: ["https://a3brands.com"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: supportEmail,
      },
    ],
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "A3 Brands AI Review Response",
    description:
      "Auto-pulls reviews from Google, Yelp, Cars.com, DealerRater, Facebook, and BBB. AI drafts the reply. GM approves with one click. Published back automatically.",
    brand: { "@type": "Brand", name: "A3 Brands" },
    category: "SaaS",
    offers: config.pricing.tiers.map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      description: tier.tagline,
      price: tier.price.replace(/[^0-9.]/g, "") || undefined,
      priceCurrency: "USD",
      url: `${SITE_URL}/pricing`,
    })),
  };

  const faqPage =
    config.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: config.faq.map((q) => ({
            "@type": "Question",
            name: q.q,
            acceptedAnswer: { "@type": "Answer", text: q.a },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
      />
      {faqPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
        />
      )}
    </>
  );
}
