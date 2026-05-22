import "./globals.css";
import type { Metadata } from "next";
import { Sora } from "next/font/google";
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

export const metadata: Metadata = {
  title: "A3 Brands — AI Review Response",
  description:
    "A3 Brands AI Review Response: auto-pull reviews from Google, Yelp, Cars.com, DealerRater, Facebook, and BBB. AI drafts the reply. GM approves with one click. Published back automatically.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster richColors closeButton position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
