import { NextResponse, type NextRequest } from "next/server";
import { getAuthRequest, failAuthRequest, finalizeAuthRequest } from "@/server/zitadel/auth-request";
import { isCustomLoginEnabled, getAppOrigin } from "@/server/zitadel/config";
import { clearLoginFlowCookie, readLoginFlowCookie } from "@/server/zitadel/cookies";
import { logZitadelError } from "@/server/zitadel/errors";
import {
  isAllowedCallbackUrl,
  isExpectedAuthRequest,
} from "@/server/zitadel/security";

/**
 * Entry point della feature ZITADEL "Login V2": ricevuta una authorize
 * request OIDC, ZITADEL redirige il browser a
 * {baseUri}/login?authRequest=V2_<id> (baseUri = "<origin>/api").
 *
 * Percorso normale (form-first): l'utente ha GIÀ completato credenziali e
 * MFA sulle pagine custom; la sessione autenticata è nel cookie di flusso
 * e la auth request viene finalizzata qui immediatamente — l'intero
 * handshake OIDC è una catena di redirect invisibili, nessuna UI ZITADEL.
 *
 * Percorso esterno: se non esiste un flusso attivo (auth request avviata
 * da un altro client o link diretto), l'utente viene portato al form
 * custom con l'id in query, che verrà finalizzato dopo il login.
 */

const AUTH_REQUEST_ID_PATTERN = /^V2_[0-9A-Za-z_-]+$/;

function extractRequestId(params: URLSearchParams): string | null {
  const direct = params.get("authRequest");
  if (direct) return direct;
  // L'app login ufficiale accetta anche il parametro unificato requestId.
  const unified = params.get("requestId");
  if (unified?.startsWith("oidc_")) return unified.slice("oidc_".length);
  return null;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const requestId = extractRequestId(request.nextUrl.searchParams);

  if (!isCustomLoginEnabled() || !requestId || !AUTH_REQUEST_ID_PATTERN.test(requestId)) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  // Flusso attivo e completo (tutti i fattori verificati) → finalizza subito.
  const flow = await readLoginFlowCookie();
  if (flow?.completed) {
    try {
      const authRequest = await getAuthRequest(requestId);
      if (
        !isExpectedAuthRequest(
          requestId,
          flow.pendingRequestId,
          authRequest.redirectUri,
          getAppOrigin()
        )
      ) {
        console.error("[auth] auth request non associata al flusso corrente");
        await clearLoginFlowCookie();
        return NextResponse.redirect(new URL("/sign-in?error=flow", origin));
      }
      const callbackUrl = await finalizeAuthRequest(requestId, {
        sessionId: flow.sessionId,
        sessionToken: flow.sessionToken,
      });
      const allowed = [
        getAppOrigin(),
        ...(authRequest.redirectUri ? [authRequest.redirectUri] : []),
      ];
      if (!isAllowedCallbackUrl(callbackUrl, allowed)) {
        console.error("[auth] callbackUrl non consentita, redirect rifiutato");
        await clearLoginFlowCookie();
        return NextResponse.redirect(new URL("/sign-in?error=flow", origin));
      }
      await clearLoginFlowCookie();
      return NextResponse.redirect(callbackUrl);
    } catch (error) {
      logZitadelError("finalize su /api/login", error);
      await clearLoginFlowCookie();
      return NextResponse.redirect(new URL("/sign-in?error=flow", origin));
    }
  }

  // Nessun flusso attivo: auth request esterna → instrada al form custom.
  let prompts: readonly string[] = [];
  let loginHint: string | undefined;
  let redirectUri: string | undefined;
  try {
    const authRequest = await getAuthRequest(requestId);
    prompts = authRequest.prompt ?? [];
    loginHint = authRequest.loginHint;
    redirectUri = authRequest.redirectUri;
  } catch (error) {
    logZitadelError("getAuthRequest", error);
    const target = new URL("/sign-in", origin);
    target.searchParams.set("error", "flow");
    return NextResponse.redirect(target);
  }

  // prompt=none: nessuna interazione possibile; chiudi con login_required.
  if (prompts.includes("PROMPT_NONE")) {
    try {
      const callbackUrl = await failAuthRequest(requestId, {
        error: "ERROR_REASON_LOGIN_REQUIRED",
      });
      const allowed = [getAppOrigin(), ...(redirectUri ? [redirectUri] : [])];
      if (isAllowedCallbackUrl(callbackUrl, allowed)) {
        return NextResponse.redirect(callbackUrl);
      }
    } catch (error) {
      logZitadelError("failAuthRequest", error);
    }
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  const target = new URL(
    prompts.includes("PROMPT_CREATE") ? "/sign-up" : "/sign-in",
    origin
  );
  target.searchParams.set("authRequest", requestId);
  if (loginHint) target.searchParams.set("login_hint", loginHint);
  return NextResponse.redirect(target);
}
