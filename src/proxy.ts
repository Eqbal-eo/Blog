import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for private areas: no session cookie means straight to the
 * login page (remembering where the user was going). The real check, which
 * verifies the token and the user's role, runs in the pages and actions.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("auth_token")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
