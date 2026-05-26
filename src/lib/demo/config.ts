/**
 * Soft demo config (CTAs, banner copy) read from demo-data/fixture.json.
 *
 * Everything here is editable from the GitHub web UI - push and Vercel
 * rebuilds in ~30 seconds, no env vars touched.
 */
import fixture from "../../../demo-data/fixture.json";

type Config = {
  bookACallUrl: string;
  bookACallLabel: string;
  supportEmail: string;
  demoBanner: { enabled: boolean; text: string };
};

const FALLBACK: Config = {
  bookACallUrl: "mailto:a3brandsllc@gmail.com",
  bookACallLabel: "Book a call",
  supportEmail: "a3brandsllc@gmail.com",
  demoBanner: { enabled: true, text: "Interactive demo." },
};

export const config: Config = {
  ...FALLBACK,
  ...((fixture as { config?: Partial<Config> }).config ?? {}),
};
