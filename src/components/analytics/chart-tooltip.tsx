/**
 * Shared chart tooltip surface. Branded, sharper than the Recharts default,
 * works for line/area/bar/pie payloads.
 */
import type { ReactNode } from "react";

export function ChartTooltipSurface({
  title,
  subtitle,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-[180px] rounded-lg border border-border/80 bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {title && (
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </div>
      )}
      {subtitle && (
        <div className="mb-1.5 text-sm font-semibold text-foreground">{subtitle}</div>
      )}
      {children}
    </div>
  );
}

export function ChartTooltipRow({
  label,
  value,
  color,
}: {
  label: string;
  value: ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color && (
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
        )}
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
