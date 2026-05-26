import { NextResponse } from "next/server";

// Demo mode: all routes are public. No auth required.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
