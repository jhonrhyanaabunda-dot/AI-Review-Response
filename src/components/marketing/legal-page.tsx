import { MarketingShell } from "./marketing-shell";
import type { LegalSection } from "@/lib/demo/config";

export function LegalPage({
  title,
  eyebrow,
  lede,
  lastUpdated,
  sections,
}: {
  title: string;
  eyebrow: string;
  lede: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </span>
        <h1 className="mt-3 text-balance text-3xl font-black tracking-tight md:text-display-2">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated <time>{lastUpdated}</time>. Edit any time in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">demo-data/fixture.json</code>.
        </p>
        <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">{lede}</p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-base font-bold tracking-tight">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </article>
    </MarketingShell>
  );
}
