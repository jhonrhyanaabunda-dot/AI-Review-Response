"use client";
import { useCallback, useState } from "react";

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export function useApi() {
  const [loading, setLoading] = useState(false);

  const request = useCallback(async <T>(input: string, init?: RequestInit): Promise<T> => {
    setLoading(true);
    try {
      const res = await fetch(input, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });
      const body: Envelope<T> = await res.json().catch(() => ({ ok: false, error: { code: "parse", message: "bad json" } }));
      if (!body.ok) throw new Error(body.error.message);
      return body.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading };
}
