import { NextResponse } from "next/server";

// Demo mode: webhooks are not wired. Acknowledge so platforms don't retry.
export async function POST() {
  return NextResponse.json({ ok: true, mode: "demo" });
}
