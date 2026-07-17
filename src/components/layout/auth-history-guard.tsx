"use client";

import { useEffect } from "react";

/**
 * Se il browser ripristina una pagina protetta dalla back-forward cache,
 * forza una nuova richiesta: senza session cookie il proxy/server redirectano
 * alla pagina di accesso.
 */
export function AuthHistoryGuard() {
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) window.location.reload();
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}
