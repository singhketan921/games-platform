import { NextResponse } from "next/server";

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/tenant/login", request.url));
  const cookieOptions = { path: "/", maxAge: 0 };
  response.cookies.set("tenant-auth", "", cookieOptions);
  response.cookies.set("tenant-key", "", cookieOptions);
  response.cookies.set("tenant-secret", "", cookieOptions);
  response.cookies.set("tenant-id", "", cookieOptions);
  response.cookies.set("tenant-user-role", "", cookieOptions);
  response.cookies.set("tenant-user-id", "", cookieOptions);
  return response;
}
