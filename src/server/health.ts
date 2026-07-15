import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { getZitadelIssuer, isZitadelConfigured } from "@/server/security/config";
import { logger } from "@/server/security/log";

/**
 * Logica condivisa degli health check. Non espone MAI valori di configurazione
 * o segreti: solo booleani/etichette di stato.
 */

export type CheckStatus = "ok" | "error" | "skipped";

export type ReadinessReport = {
  status: "ok" | "degraded";
  checks: {
    config: CheckStatus;
    database: CheckStatus;
    zitadel: CheckStatus;
  };
};

/** Configurazione minima presente per far girare l'app. */
export function checkMinimalConfig(): CheckStatus {
  const hasDb = Boolean(process.env.DATABASE_URL);
  const hasAuthSecret = Boolean(
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  );
  // In sviluppo è accettabile usare il dev-login senza ZITADEL.
  const hasAuthMethod =
    isZitadelConfigured || process.env.AUTH_DEV_LOGIN === "true";
  return hasDb && hasAuthSecret && hasAuthMethod ? "ok" : "error";
}

/** Verifica che il database sia raggiungibile con una query banale. */
export async function checkDatabase(): Promise<CheckStatus> {
  try {
    await db.execute(sql`select 1`);
    return "ok";
  } catch (error) {
    logger.error("Health: database non raggiungibile", error);
    return "error";
  }
}

/**
 * Verifica la raggiungibilità di ZITADEL tramite il documento di discovery
 * OIDC. Se ZITADEL non è configurato il check è "skipped" (non un errore:
 * l'ambiente potrebbe usare solo il dev-login).
 */
export async function checkZitadel(timeoutMs = 3000): Promise<CheckStatus> {
  const issuer = getZitadelIssuer();
  if (!issuer) return "skipped";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${issuer}/.well-known/openid-configuration`, {
      signal: controller.signal,
      cache: "no-store",
    });
    return res.ok ? "ok" : "error";
  } catch (error) {
    logger.warn("Health: discovery ZITADEL non raggiungibile", error);
    return "error";
  } finally {
    clearTimeout(timer);
  }
}

/** Report di readiness completo. */
export async function getReadiness(): Promise<ReadinessReport> {
  const [database, zitadel] = await Promise.all([
    checkDatabase(),
    checkZitadel(),
  ]);
  const config = checkMinimalConfig();

  const degraded =
    config === "error" || database === "error" || zitadel === "error";

  return {
    status: degraded ? "degraded" : "ok",
    checks: { config, database, zitadel },
  };
}
