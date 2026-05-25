"use client";
import { useCountUp } from "@/hooks/use-count-up";

/**
 * Drop-in animated number. For pure-string values (e.g. "1-click", "90s")
 * just render the value directly — this component is only useful for plain
 * numeric values that should count up on mount.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  durationMs,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  durationMs?: number;
}) {
  const animated = useCountUp(value, { durationMs, decimals });
  const formatted =
    decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString();
  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
