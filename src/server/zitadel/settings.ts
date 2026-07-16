import "server-only";
import { zitadelFetch } from "./client";

/**
 * Settings Service v2 — policy lette da ZITADEL (mai replicate in locale).
 * Riferimenti:
 * - https://zitadel.com/docs/apis/resources/settings_service_v2/settings-service-get-login-settings
 * - https://zitadel.com/docs/apis/resources/settings_service_v2/settings-service-get-password-complexity-settings
 */

export type LoginSettings = Readonly<{
  allowUsernamePassword?: boolean;
  allowRegister?: boolean;
  allowExternalIdp?: boolean;
  forceMfa?: boolean;
  forceMfaLocalOnly?: boolean;
  ignoreUnknownUsernames?: boolean;
  hidePasswordReset?: boolean;
  passkeysType?: "PASSKEYS_TYPE_ALLOWED" | "PASSKEYS_TYPE_NOT_ALLOWED";
  secondFactors?: readonly string[];
  multiFactors?: readonly string[];
}>;

export type PasswordComplexitySettings = Readonly<{
  minLength?: string | number;
  requiresUppercase?: boolean;
  requiresLowercase?: boolean;
  requiresNumber?: boolean;
  requiresSymbol?: boolean;
}>;

export async function getLoginSettings(orgId?: string): Promise<LoginSettings> {
  const query = new URLSearchParams();
  if (orgId) query.set("ctx.orgId", orgId);
  else query.set("ctx.instance", "true");
  const response = await zitadelFetch<{ settings?: LoginSettings }>({
    method: "GET",
    path: "/v2/settings/login",
    query,
  });
  return response.settings ?? {};
}

export async function getPasswordComplexitySettings(
  orgId?: string
): Promise<PasswordComplexitySettings> {
  const query = new URLSearchParams();
  if (orgId) query.set("ctx.orgId", orgId);
  else query.set("ctx.instance", "true");
  const response = await zitadelFetch<{ settings?: PasswordComplexitySettings }>({
    method: "GET",
    path: "/v2/settings/password/complexity",
    query,
  });
  return response.settings ?? {};
}

/** Descrizione leggibile dei requisiti password per i form. */
export function describePasswordPolicy(settings: PasswordComplexitySettings): string {
  const min = Number(settings.minLength ?? 8);
  const parts = [`almeno ${min} caratteri`];
  if (settings.requiresUppercase) parts.push("una maiuscola");
  if (settings.requiresLowercase) parts.push("una minuscola");
  if (settings.requiresNumber) parts.push("un numero");
  if (settings.requiresSymbol) parts.push("un simbolo");
  return `La password deve contenere ${parts.join(", ")}.`;
}

/** Verifica locale (best effort) prima della chiamata a ZITADEL. */
export function passwordMeetsPolicy(
  password: string,
  settings: PasswordComplexitySettings
): boolean {
  const min = Number(settings.minLength ?? 8);
  if (password.length < min) return false;
  if (settings.requiresUppercase && !/[A-Z]/.test(password)) return false;
  if (settings.requiresLowercase && !/[a-z]/.test(password)) return false;
  if (settings.requiresNumber && !/[0-9]/.test(password)) return false;
  if (settings.requiresSymbol && !/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}
