"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Reveals `text` character-by-character. When `text` changes mid-stream
 * (e.g. the regenerated draft from the AI), the animation restarts.
 *
 * Returns the currently-displayed substring + a `done` boolean so the
 * caller can hide a typing cursor when finished.
 */
export function useTypewriter(text: string, opts: { charsPerTick?: number; tickMs?: number; enabled?: boolean } = {}) {
  const { charsPerTick = 3, tickMs = 25, enabled = true } = opts;
  const [shown, setShown] = useState(enabled ? "" : text);
  const target = useRef(text);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    target.current = text;
    if (!enabled) {
      setShown(text);
      return;
    }
    setShown("");
    if (timer.current) clearInterval(timer.current);
    let i = 0;
    timer.current = setInterval(() => {
      i = Math.min(text.length, i + charsPerTick);
      setShown(text.slice(0, i));
      if (i >= text.length && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, tickMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [text, charsPerTick, tickMs, enabled]);

  return { shown, done: shown.length >= text.length };
}
