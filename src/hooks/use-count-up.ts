"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 → `to` over `durationMs`. Uses requestAnimationFrame
 * with ease-out so big numbers feel snappy at the end.
 *
 * Pass `decimals` to render fractional values (e.g. avg rating 4.27).
 */
export function useCountUp(to: number, opts: { durationMs?: number; decimals?: number } = {}) {
  const { durationMs = 900, decimals = 0 } = opts;
  const [value, setValue] = useState(0);
  const start = useRef<number | null>(null);
  const target = useRef(to);

  useEffect(() => {
    target.current = to;
    start.current = null;
    let raf = 0;
    const step = (t: number) => {
      if (start.current === null) start.current = t;
      const elapsed = t - start.current;
      const progress = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target.current * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);

  return Number(value.toFixed(decimals));
}
