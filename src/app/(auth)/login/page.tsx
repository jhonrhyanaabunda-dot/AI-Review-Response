import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";

// useSearchParams() inside LoginForm requires the page to opt out of
// static prerendering — otherwise Next 15 errors at build time asking
// for a Suspense boundary. Login is inherently dynamic anyway.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left: dark navy hero panel — A3 brand */}
      <div className="relative hidden overflow-hidden bg-a3-navy text-white md:block">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(at 20% 30%, rgba(29,185,84,0.35) 0px, transparent 50%), radial-gradient(at 70% 80%, rgba(29,185,84,0.15) 0px, transparent 55%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">A3 BRANDS</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/60">
                AI Review Response
              </div>
            </div>
          </Link>

          <div className="max-w-md">
            <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight md:text-display-2">
              Every review answered.
              <br />
              <span className="text-primary">Approved with one click.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Auto-pull reviews from Google, Yelp, Cars.com, DealerRater, Facebook,
              and BBB. AI drafts. GM approves. Published back automatically.
            </p>
          </div>

          <div className="text-xs text-white/50">
            © {new Date().getFullYear()} A3 Brands. Internal prototype.
          </div>
        </div>
      </div>

      {/* Right: sign-in card */}
      <div className="flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden">
            <Link href="/" className="mb-8 inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold tracking-tight">A3 BRANDS</div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  AI Review Response
                </div>
              </div>
            </Link>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Sign in
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-display-3">
            Welcome back.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the demo credentials below or your A3 Brands account.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <div className="mt-6 rounded-md border border-border/60 bg-secondary p-3 text-[11px] text-muted-foreground">
            <div className="font-semibold text-foreground">Demo credentials</div>
            <div className="mt-1 font-mono">admin@example.com / password123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
