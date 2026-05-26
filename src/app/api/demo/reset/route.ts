import { NextResponse } from "next/server";
import { cookieClear } from "@/lib/demo/state-cookie";

export async function POST() {
  return new NextResponse(JSON.stringify({ ok: true, data: { reset: true } }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": cookieClear(),
    },
  });
}
