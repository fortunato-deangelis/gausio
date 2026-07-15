"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/shared";
import { PublicStatusPage } from "@/features/marketing/components/public-status-page";

type PublicErrorProps = Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>;

export default function PublicError({
  error,
  unstable_retry,
}: PublicErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PublicStatusPage
      eyebrow="Errore imprevisto"
      title={
        <>
          Qualcosa si è fermato.
          <span className="block text-primary">Ripartiamo da qui.</span>
        </>
      }
      description="Non siamo riusciti a caricare questa pagina. Puoi riprovare ora oppure tornare alla home."
      code="500"
      actions={
        <>
          <Button size="base" onClick={unstable_retry}>
            Riprova
          </Button>
          <Link
            href="/"
            className="text-base font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Torna alla home
          </Link>
        </>
      }
    />
  );
}
