import type { Config } from "tailwindcss";

/**
 * Tailwind theme wired against the A3 Brands design system (see DESIGN.md).
 * Most tokens are CSS variables defined in `globals.css` so the same palette
 * drives light + dark modes. Custom values added here:
 *  - `font-sans`  → Sora (loaded via next/font in layout.tsx)
 *  - `rounded-pill` (50px) for primary CTAs
 *  - `shadow-emerald` for primary-button glow
 *  - extended shadow scale matching the elevation chart in DESIGN.md
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        // Raw A3 brand colors for direct use when shadcn tokens don't fit.
        a3: {
          emerald: "#1DB954",
          charcoal: "#2C3038",
          navy: "#0B0D0F",
          stone: "#5A6170",
          mute: "#8A919C",
          pale: "#E5E7EB",
          surface: "#F8F9FA",
        },
      },
      borderRadius: {
        // shadcn tokens; `--radius` set to 16px (A3 card radius) in globals.css.
        lg: "var(--radius)",
        md: "calc(var(--radius) - 8px)",
        sm: "calc(var(--radius) - 12px)",
        pill: "50px",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "Sora", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "Sora", "system-ui", "sans-serif"],
      },
      fontSize: {
        // A3 display scale - pinned for hero typography (DESIGN.md §3).
        "display-1": ["51px", { lineHeight: "56px", letterSpacing: "0.02em" }],
        "display-2": ["35px", { lineHeight: "39px", letterSpacing: "0.015em" }],
        "display-3": ["28px", { lineHeight: "33px", letterSpacing: "0.01em" }],
      },
      boxShadow: {
        // Elevation scale per DESIGN.md §6.
        subtle: "rgba(0, 0, 0, 0.08) 0px 4px 16px 0px",
        raised: "rgba(0, 0, 0, 0.12) 0px 8px 24px 0px",
        elevated: "rgba(0, 0, 0, 0.3) 0px 4px 30px 0px",
        emerald: "rgba(29, 185, 84, 0.3) 0px 4px 24px 0px",
        "emerald-hover": "rgba(29, 185, 84, 0.4) 0px 6px 28px 0px",
        "emerald-active": "rgba(29, 185, 84, 0.25) 0px 2px 12px 0px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
