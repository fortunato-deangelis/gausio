import { NextResponse, type NextRequest } from "next/server";

/**
 * Protezione leggera delle rotte riservate: verifica la presenza del cookie
 * di sessione Auth.js e rimanda al sign-in in sua assenza. La verifica
 * completa della sessione (e dei permessi) avviene lato server nei layout
 * e nelle server action.
 */

const PROTECTED_PREFIXES = ["/app", "/onboarding"];
const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  Expires: "0",
  Pragma: "no-cache",
};

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token")
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (isProtected && !hasSessionCookie(request)) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(signIn);
    for (const [name, value] of Object.entries(NO_STORE_HEADERS)) {
      response.headers.set(name, value);
    }
    return response;
  }
  const response = NextResponse.next();
  if (isProtected) {
    for (const [name, value] of Object.entries(NO_STORE_HEADERS)) {
      response.headers.set(name, value);
    }
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*"],
};
