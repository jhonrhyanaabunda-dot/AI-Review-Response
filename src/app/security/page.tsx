import { LegalPage } from "@/components/marketing/legal-page";
import { config } from "@/lib/demo/config";

export const metadata = {
  title: "Security",
  description: "How A3 Brands AI Review Response keeps your data, credentials, and reviews safe.",
};

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Trust"
      title="Security"
      lede="Dealership data deserves enterprise-grade controls. Here's exactly how we handle yours."
      lastUpdated={config.security.lastUpdated}
      sections={config.security.sections}
    />
  );
}
