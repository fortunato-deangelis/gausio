"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/server/auth";
import { buildEndSessionUrl, isZitadelConfigured } from "@/server/security/config";

/**
 * Logout dalla topbar.
 *
 * Strategia:
 * 1. Logout locale: `signOut({ redirect: false })` elimina la sessione Auth.js
 *    (cancella il cookie httpOnly cifrato).
 * 2. Logout federato: se ZITADEL è configurato, reindirizza all'endpoint
 *    end_session con client_id e post_logout_redirect_uri (registrato in
 *    ZITADEL). In caso contrario si torna alla landing.
 *
 * Nota: non passiamo id_token_hint perché l'id_token resta confinato nel JWT
 * server-side e non viene esposto; ZITADEL accetta il logout con client_id +
 * post_logout_redirect_uri registrato. Vedi docs/SECURITY.md.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });

  if (isZitadelConfigured) {
    const endSession = buildEndSessionUrl({});
    if (endSession) redirect(endSession);
  }

  redirect("/");
}
