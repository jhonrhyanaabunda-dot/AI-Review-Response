import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { edgeAuthConfig } from "@/lib/auth/edge-config";

const { auth } = NextAuth(edgeAuthConfig);

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/pitch",
  "/api/auth",
  "/api/webhooks",
  "/api/health",
  "/_next",
  "/favicon",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  if (!req.auth?.user?.id) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
