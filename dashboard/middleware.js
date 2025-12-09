import { NextResponse } from "next/server";

const TENANT_PATH = "/tenant";
const LOGIN_PATH = "/tenant/login";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(TENANT_PATH) && !pathname.startsWith(LOGIN_PATH)) {
    const cookie = req.cookies.get("tenant-auth")?.value;
    if (cookie !== "1") {
      const loginUrl = new URL(LOGIN_PATH, req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tenant/:path*"],
};
