import "./globals.css";
import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "sonner";

// Note: Sora ships up to 800 on Google Fonts (not 900). Tailwind's font-black
// (900) gracefully falls back to the closest weight (800), which is still
// extra-bold and matches DESIGN.md visually.
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

// On Vercel, VERCEL_PROJECT_PRODUCTION_URL is the canonical https hostname.
// Locally we fall back to localhost so OG previews still resolve absolutely.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "A3 Brands - AI Review Response",
    template: "%s · A3 Brands",
  },
  description:
    "A3 Brands AI Review Response: auto-pull reviews from Google, Yelp, Cars.com, DealerRater, Facebook, and BBB. AI drafts the reply. GM approves with one click. Published back automatically.",
  openGraph: {
    type: "website",
    title: "A3 Brands - AI Review Response",
    description:
      "Every review answered. AI drafts. GM approves with one click. Published back to Google, Yelp, BBB, and more.",
    siteName: "A3 Brands",
  },
  twitter: {
    card: "summary_large_image",
    title: "A3 Brands - AI Review Response",
    description:
      "Every review answered. AI drafts. GM approves with one click. Published back automatically.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster richColors closeButton position="bottom-right" />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
