"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { AppCard, Button, Label, Switch } from "@/components/shared";
import {
  COOKIE_CATEGORIES,
  createCookieConsentState,
  parseCookieConsent,
  type CookieConsentPreferences,
} from "@/lib/privacy/cookie-consent";
import {
  getRawConsentCookie,
  subscribeConsentChange,
  writeConsentCookie,
} from "@/lib/privacy/consent-client";
import { formatDateTime } from "@/lib/format";

type DraftConsent = Omit<CookieConsentPreferences, "necessary">;

/**
 * Pannello inline di gestione del consenso per la pagina /preferenze-cookie:
 * mostra lo stato corrente e permette di aggiornarlo senza banner.
 */
export function CookiePreferences() {
  const rawConsent = useSyncExternalStore(
    subscribeConsentChange,
    getRawConsentCookie,
    () => null
  );
  const stored = useMemo(
    () => parseCookieConsent(rawConsent ?? undefined),
    [rawConsent]
  );

  const [draft, setDraft] = useState<DraftConsent | null>(null);
  const current: DraftConsent = draft ?? {
    preferences: stored?.preferences ?? false,
    analytics: stored?.analytics ?? false,
  };

  const save = (next: DraftConsent) => {
    writeConsentCookie(createCookieConsentState(next));
    setDraft(null);
    toast.success("Preferenze sui cookie salvate.");
  };

  return (
    <AppCard
      title="Le tue preferenze sui cookie"
      description={
        stored
          ? `Ultimo aggiornamento del consenso: ${formatDateTime(stored.updatedAt)}.`
          : "Non hai ancora espresso una scelta: valgono solo i cookie necessari."
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {COOKIE_CATEGORIES.map((category) => (
            <div
              key={category.key}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <Label
                htmlFor={`pref-cookie-${category.key}`}
                className="flex flex-col items-start gap-1 font-normal"
              >
                <span className="font-semibold">{category.title}</span>
                <span className="text-sm text-muted-foreground">
                  {category.description}
                </span>
              </Label>
              <Switch
                id={`pref-cookie-${category.key}`}
                checked={
                  category.required
                    ? true
                    : current[category.key as keyof DraftConsent]
                }
                disabled={category.required}
                onCheckedChange={(checked) =>
                  setDraft({
                    ...current,
                    [category.key]: checked === true,
                  })
                }
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save(current)}>Salva preferenze</Button>
          <Button
            variant="outline"
            onClick={() => save({ preferences: true, analytics: true })}
          >
            Accetta tutti
          </Button>
          <Button
            variant="outline"
            onClick={() => save({ preferences: false, analytics: false })}
          >
            Rifiuta opzionali
          </Button>
        </div>
      </div>
    </AppCard>
  );
}
