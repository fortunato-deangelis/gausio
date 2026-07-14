"use client";

import { openConsentBanner } from "@/lib/privacy/consent-client";

/** Voce del footer che riapre il banner di consenso cookie. */
export function OpenBannerButton() {
  return (
    <button
      type="button"
      onClick={openConsentBanner}
      className="text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Preferenze cookie
    </button>
  );
}
