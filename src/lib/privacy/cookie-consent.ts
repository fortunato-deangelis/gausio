/**
 * Modello puro (senza dipendenze da framework) per il consenso cookie.
 *
 * Il consenso è salvato in un cookie first-party versionato: se la policy
 * cambia in modo sostanziale, incrementare COOKIE_CONSENT_VERSION invalida
 * i consensi precedenti e ripropone il banner.
 *
 * Categorie:
 * - `necessary`   — sempre attiva (cookie di sessione, workspace attivo e
 *                   il cookie di consenso stesso).
 * - `preferences` — memoria delle preferenze di interfaccia (tema).
 * - `analytics`   — statistiche di utilizzo anonime (opzionale).
 */

export const COOKIE_CONSENT_COOKIE_NAME = "gausio_cookie_consent";
export const COOKIE_CONSENT_CHANGE_EVENT = "gausio-cookie-consent-change";
export const COOKIE_CONSENT_OPEN_EVENT = "gausio-cookie-consent-open";
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 giorni

export type CookieConsentPreferences = Readonly<{
  necessary: true;
  preferences: boolean;
  analytics: boolean;
}>;

export type CookieConsentState = CookieConsentPreferences &
  Readonly<{
    version: typeof COOKIE_CONSENT_VERSION;
    updatedAt: string;
  }>;

export const DEFAULT_COOKIE_CONSENT: CookieConsentPreferences = {
  necessary: true,
  preferences: false,
  analytics: false,
};

export const COOKIE_CATEGORIES: readonly {
  key: keyof CookieConsentPreferences;
  title: string;
  description: string;
  required: boolean;
}[] = [
  {
    key: "necessary",
    title: "Cookie necessari",
    description:
      "Indispensabili per il funzionamento del sito: sessione di accesso, workspace attivo e memorizzazione di questo consenso. Non possono essere disattivati.",
    required: true,
  },
  {
    key: "preferences",
    title: "Cookie di preferenza",
    description:
      "Ricordano le tue scelte di interfaccia, come il tema chiaro o scuro.",
    required: false,
  },
  {
    key: "analytics",
    title: "Cookie statistici",
    description:
      "Ci aiutano a capire come viene usata l'applicazione tramite statistiche aggregate e anonime.",
    required: false,
  },
] as const;

export function createCookieConsentState(
  preferences: Omit<CookieConsentPreferences, "necessary">,
  updatedAt = new Date().toISOString()
): CookieConsentState {
  return {
    version: COOKIE_CONSENT_VERSION,
    updatedAt,
    necessary: true,
    preferences: preferences.preferences,
    analytics: preferences.analytics,
  };
}

export function parseCookieConsent(
  value: string | undefined
): CookieConsentState | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as Partial<CookieConsentState>;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (parsed.necessary !== true) return null;
    if (typeof parsed.preferences !== "boolean") return null;
    if (typeof parsed.analytics !== "boolean") return null;
    if (typeof parsed.updatedAt !== "string") return null;
    return {
      version: COOKIE_CONSENT_VERSION,
      updatedAt: parsed.updatedAt,
      necessary: true,
      preferences: parsed.preferences,
      analytics: parsed.analytics,
    };
  } catch {
    return null;
  }
}

export function serializeCookieConsent(state: CookieConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}
