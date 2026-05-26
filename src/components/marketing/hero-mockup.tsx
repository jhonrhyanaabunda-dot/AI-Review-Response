import { Sparkles, CheckCircle2, Star } from "lucide-react";

/**
 * Above-the-fold visual for the landing page. A miniature browser frame
 * containing a stylized "inbox + AI draft" mockup, rendered entirely in
 * markup/SVG so there's no image to manage. Edit copy here directly.
 */
export function HeroMockup() {
  return (
    <div className="relative mx-auto mt-12 w-full max-w-3xl">
      {/* Soft glow */}
      <div
        aria-hidden
        className="absolute -inset-x-10 -inset-y-6 -z-10 rounded-3xl bg-primary/20 blur-3xl"
      />
      {/* Browser chrome */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F172A] text-white shadow-2xl shadow-black/40 ring-1 ring-white/5">
        <div className="flex items-center gap-2 border-b border-white/10 bg-[#0B1220] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <div className="ml-3 flex-1 truncate rounded-md bg-white/5 px-3 py-1 text-[11px] text-white/50">
            a3brands.review/inbox
          </div>
        </div>

        {/* Sidebar + content */}
        <div className="grid grid-cols-[140px_1fr] gap-0 text-xs">
          {/* Sidebar */}
          <aside className="border-r border-white/5 p-3">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-sm bg-primary/15 text-[8px] font-extrabold text-primary">
                A3
              </span>
              <span className="text-[10px] font-extrabold tracking-tight">A3 BRANDS</span>
            </div>
            <ul className="space-y-1 text-white/60">
              {["Dashboard", "Inbox", "Reviews", "Analytics"].map((it, i) => (
                <li
                  key={it}
                  className={
                    i === 1
                      ? "rounded-md bg-primary/15 px-2 py-1 font-medium text-white"
                      : "px-2 py-1"
                  }
                >
                  {it}
                </li>
              ))}
            </ul>
          </aside>

          {/* Inbox panel */}
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                  GM workflow
                </div>
                <div className="text-sm font-black tracking-tight">Inbox</div>
              </div>
              <span className="rounded-pill bg-success/15 px-2 py-0.5 text-[9px] font-medium text-success">
                3 ready
              </span>
            </div>

            <div className="space-y-2">
              <ReviewRow
                stars={5}
                author="Maria L."
                snippet="Best buying experience ever. Carlos helped us trade up to a new Camry."
                platform="Google"
                confidence="High"
              />
              <ReviewRow
                stars={4}
                author="Devon S."
                snippet="Friendly staff, fair pricing. Wish the financing process was faster."
                platform="DealerRater"
                confidence="High"
              />
            </div>

            {/* AI draft card */}
            <div className="mt-3 rounded-md border border-white/10 bg-primary/10 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> AI-drafted reply · 92% confidence
              </div>
              <p className="text-[11px] leading-snug text-white/85">
                Maria, thank you so much for taking the time to share this! We&apos;re glad
                Smith Toyota could make this a smooth experience. Welcome to the family.
              </p>
              <div className="mt-2 flex items-center justify-end gap-1.5">
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70">
                  Edit
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-success px-2 py-1 text-[10px] font-medium text-white">
                  <CheckCircle2 className="h-3 w-3" /> Approve &amp; publish
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  stars,
  author,
  snippet,
  platform,
  confidence,
}: {
  stars: number;
  author: string;
  snippet: string;
  platform: string;
  confidence: "High" | "Medium" | "Low";
}) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] text-white/60">
        <span className="text-white/80">{platform}</span>
        <span className="text-white/30">·</span>
        <span className="flex items-center gap-0.5 text-warning">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="h-2.5 w-2.5 fill-current" />
          ))}
        </span>
        <span className="ml-auto rounded-pill bg-success/15 px-1.5 py-px text-[9px] font-medium text-success">
          {confidence}
        </span>
      </div>
      <div className="mt-1 text-[11px]">
        <span className="font-semibold">{author}</span>{" "}
        <span className="text-white/70">- {snippet}</span>
      </div>
    </div>
  );
}
