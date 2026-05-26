import { LegalPage } from "@/components/marketing/legal-page";
import { config } from "@/lib/demo/config";

export const metadata = {
  title: "Privacy policy",
  description: "How A3 Brands AI Review Response collects, uses, and protects data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      lede="We collect the minimum we need to draft replies on your behalf, never sell data, and let you export or delete anything you've put in."
      lastUpdated={config.legal.lastUpdated}
      sections={config.legal.privacy}
    />
  );
}
