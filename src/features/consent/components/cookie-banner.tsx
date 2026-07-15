"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button, Label, Switch } from "@/components/shared";
import {
  COOKIE_CATEGORIES,
  COOKIE_CONSENT_OPEN_EVENT,
  createCookieConsentState,
  parseCookieConsent,
  type CookieConsentPreferences,
} from "@/lib/privacy/cookie-consent";
import {
  getRawConsentCookie,
  subscribeConsentChange,
  writeConsentCookie,
} from "@/lib/privacy/consent-client";

const emptySubscribe = () => () => {};

type DraftConsent = Omit<CookieConsentPreferences, "necessary">;

const DEFAULT_DRAFT: DraftConsent = { preferences: false, analytics: false };

/**
 * Banner di consenso cookie:
 * - compare solo se non esiste un consenso valido memorizzato;
 * - riapribile via COOKIE_CONSENT_OPEN_EVENT (footer / pagina preferenze);
 * - non modale: non blocca la navigazione né intrappola il focus;
 * - le scelte sono annunciate alle tecnologie assistive (aria-live).
 */
export function CookieBanner() {
  // Snapshot reattivo del cookie di consenso (null sul server).
  const rawConsent = useSyncExternalStore(
    subscribeConsentChange,
    getRawConsentCookie,
    () => null
  );
  const stored = useMemo(
    () => parseCookieConsent(rawConsent ?? undefined),
    [rawConsent]
  );
  // false sul server / prima dell'idratazione: il banner non viene
  // renderizzato lato server, evitando mismatch.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [forcedOpen, setForcedOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [draft, setDraft] = useState<DraftConsent>(DEFAULT_DRAFT);
  const [announcement, setAnnouncement] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const onOpen = () => {
      const current = parseCookieConsent(getRawConsentCookie() ?? undefined);
      setDraft({
        preferences: current?.preferences ?? false,
        analytics: current?.analytics ?? false,
      });
      setManage(true);
      setForcedOpen(true);
    };
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
  }, []);

  // Riapertura esplicita: porta il focus sul titolo del pannello.
  useEffect(() => {
    if (forcedOpen) headingRef.current?.focus();
  }, [forcedOpen]);

  const persist = useCallback((next: DraftConsent) => {
    writeConsentCookie(createCookieConsentState(next));
    setAnnouncement("Preferenze sui cookie salvate.");
    setForcedOpen(false);
    setManage(false);
  }, []);

  const visible = mounted && (forcedOpen || stored === null);

  return (
    <>
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
      {visible && (
        <section
          aria-label="Consenso all'uso dei cookie"
          className="fixed inset-x-4 bottom-4 z-50 flex max-h-[85dvh] flex-col gap-4 overflow-y-auto rounded-[2px] border bg-card p-6 text-card-foreground shadow-lg sm:left-auto sm:right-6 sm:max-w-md"
        >
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="flex items-center gap-2 text-lg font-semibold outline-none"
          >
            <Cookie aria-hidden focusable="false" className="size-5 text-primary" />
            Questo sito usa i cookie
          </h2>
          <p className="text-sm text-muted-foreground">
            Usiamo cookie necessari al funzionamento dell&apos;applicazione e, solo
            con il tuo consenso, cookie di preferenza e statistici. Puoi
            cambiare idea in ogni momento dalla pagina Preferenze cookie.
          </p>
          <p className="text-sm">
            <Link
              href="/cookie-policy"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              Leggi la Cookie Policy
            </Link>
          </p>

          {manage && (
            <fieldset className="flex flex-col gap-4 rounded-[2px] border p-4">
              <legend className="px-1 text-sm font-semibold">
                Gestisci preferenze
              </legend>
              {COOKIE_CATEGORIES.map((category) => (
                <div key={category.key} className="flex items-start gap-3">
                  <Switch
                    id={`cookie-cat-${category.key}`}
                    shape="rectangular"
                    checked={
                      category.required
                        ? true
                        : draft[category.key as keyof DraftConsent]
                    }
                    disabled={category.required}
                    onCheckedChange={(checked) =>
                      setDraft((prev) => ({
                        ...prev,
                        [category.key]: checked === true,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`cookie-cat-${category.key}`}
                    className="flex flex-col items-start gap-0.5 font-normal"
                  >
                    <span className="font-semibold">{category.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  </Label>
                </div>
              ))}
            </fieldset>
          )}

          <div className="flex flex-wrap gap-2">
            {manage ? (
              <>
                <Button size="base" onClick={() => persist(draft)}>
                  Salva preferenze
                </Button>
                <Button
                  variant="outline"
                  size="base"
                  onClick={() => persist({ preferences: false, analytics: false })}
                >
                  Rifiuta opzionali
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="base"
                  onClick={() => persist({ preferences: true, analytics: true })}
                >
                  Accetta tutti
                </Button>
                <Button
                  variant="outline"
                  size="base"
                  onClick={() => persist({ preferences: false, analytics: false })}
                >
                  Rifiuta opzionali
                </Button>
                <Button
                  variant="ghost"
                  size="base"
                  onClick={() => {
                    setDraft({
                      preferences: stored?.preferences ?? false,
                      analytics: stored?.analytics ?? false,
                    });
                    setManage(true);
                  }}
                >
                  Gestisci preferenze
                </Button>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
