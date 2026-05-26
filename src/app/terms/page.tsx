import { LegalPage } from "@/components/marketing/legal-page";
import { config } from "@/lib/demo/config";

export const metadata = {
  title: "Terms of service",
  description: "The agreement between you and A3 Brands when you use AI Review Response.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      lede="Plain-language terms. You stay in control of every reply; we provide the tooling that gets you to one-click approval."
      lastUpdated={config.legal.lastUpdated}
      sections={config.legal.terms}
    />
  );
}
