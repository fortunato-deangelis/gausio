import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "@/server/auth";
import { isCustomLoginEnabled } from "@/server/zitadel/config";
import { isSafeInternalPath } from "@/server/zitadel/security";

/**
 * Handshake OIDC post-autenticazione: quando credenziali (ed eventuale MFA)
 * sono già state verificate via Session API, questa route delega ad Auth.js
 * la creazione della authorize request (PKCE + state + nonce e relativi
 * cookie). ZITADEL, con Login V2 attivo, ritorna su /api/login, che
 * finalizza subito la auth request con la sessione del cookie di flusso:
 * l'utente vede solo redirect, mai una UI ZITADEL.
 *
 * Serve una route handler (non una pagina) perché signIn deve poter
 * scrivere i cookie del flusso OIDC, cosa vietata durante il render RSC.
 */

export async function GET(request: NextRequest) {
  if (!isCustomLoginEnabled()) {
    return NextResponse.redirect(new URL("/sign-in", request.nextUrl.origin));
  }

  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  const redirectTo = isSafeInternalPath(callbackUrl) ? callbackUrl : "/app";

  // signIn lancia un NEXT_REDIRECT verso l'authorize endpoint di ZITADEL.
  await signIn("zitadel", { redirectTo });
}
