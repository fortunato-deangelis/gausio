import { NextResponse, type NextRequest } from "next/server";

/**
 * Protezione leggera delle rotte riservate: verifica la presenza del cookie
 * di sessione Auth.js e rimanda al sign-in in sua assenza. La verifica
 * completa della sessione (e dei permessi) avviene lato server nei layout
 * e nelle server action.
 */

const PROTECTED_PREFIXES = ["/app", "/onboarding"];

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
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*"],
};
