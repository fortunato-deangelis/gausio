import Link from "next/link";
import { buttonVariants } from "@/components/shared";
import { PublicShell } from "@/features/marketing/components/public-shell";
import { PublicStatusPage } from "@/features/marketing/components/public-status-page";

export default function NotFound() {
  return (
    <PublicShell>
      <PublicStatusPage
        eyebrow="Errore 404"
        title={
          <>
            Questa pagina non porta
            <span className="block text-primary">da nessuna parte.</span>
          </>
        }
        description="Il collegamento potrebbe essere cambiato oppure la pagina non esiste più. Torna alla home e riparti da ciò che conta."
        code="404"
        actions={
          <Link href="/" className={buttonVariants({ size: "base" })}>
            Torna alla home
          </Link>
        }
      />
    </PublicShell>
  );
}
