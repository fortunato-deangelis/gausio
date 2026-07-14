import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_OPEN_EVENT,
  type CookieConsentState,
  parseCookieConsent,
  serializeCookieConsent,
} from "./cookie-consent";

/** Helper lato browser per leggere/scrivere il cookie del consenso. */

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

function cookieAttributes(maxAge: number): string {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  return `; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export function readConsentCookie(): CookieConsentState | null {
  return parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE_NAME));
}

/** Valore grezzo (snapshot stabile per useSyncExternalStore). */
export function getRawConsentCookie(): string | null {
  return readCookie(COOKIE_CONSENT_COOKIE_NAME) ?? null;
}

/** Sottoscrizione ai cambi di consenso (per useSyncExternalStore). */
export function subscribeConsentChange(callback: () => void): () => void {
  window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, callback);
  return () =>
    window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, callback);
}

export function writeConsentCookie(state: CookieConsentState): void {
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${serializeCookieConsent(
    state
  )}${cookieAttributes(COOKIE_CONSENT_MAX_AGE_SECONDS)}`;
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGE_EVENT));
}

/** Riapre il banner (usato da footer e pagina preferenze cookie). */
export function openConsentBanner(): void {
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}
