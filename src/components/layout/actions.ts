"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/server/auth";
import { buildEndSessionUrl, getIdTokenForLogout } from "@/server/auth/logout";

/**
 * Logout dalla topbar: termina la sessione applicativa (cookie Auth.js) e,
 * se disponibile un id_token, anche la sessione ZITADEL via OIDC
 * end_session (RP-initiated logout) con ritorno alla landing.
 */
export async function signOutAction(): Promise<void> {
  const idToken = await getIdTokenForLogout();
  const endSessionUrl = idToken ? buildEndSessionUrl(idToken) : null;
  await signOut({ redirect: false });
  redirect(endSessionUrl ?? "/");
}
