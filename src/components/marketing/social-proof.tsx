import { Quote } from "lucide-react";
import type { LogoMark, Testimonial } from "@/lib/demo/config";

export function LogoCloud({ logos, label = "Trusted by rooftops across the country" }: { logos: LogoMark[]; label?: string }) {
  if (logos.length === 0) return null;
  return (
    <div className="border-y bg-muted/30">
      <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-14">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-6 grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-5 opacity-60 sm:grid-cols-3 md:grid-cols-6 md:gap-x-10">
          {logos.map((l) => (
            <span
              key={l.name}
              className="text-[11px] font-extrabold tracking-[0.18em] text-foreground/70"
              title={l.name}
            >
              {l.wordmark}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-14">
        <div className="mb-10 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Voices from the lot
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-display-2">
            What dealerships say.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {items.slice(0, 3).map((t) => (
            <figure
              key={t.author + t.quote.slice(0, 12)}
              className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card p-6"
            >
              <Quote className="h-5 w-5 text-primary/60" />
              <blockquote className="text-pretty text-sm leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto border-t pt-4 text-xs">
                <div className="font-semibold text-foreground">{t.author}</div>
                <div className="text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
