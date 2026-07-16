import type { Metadata } from "next";
import { MfaPageContent } from "@/features/auth/components/mfa-page";

export const metadata: Metadata = {
  title: "Verifica in due passaggi",
  description: "Completa la verifica in due passaggi per accedere a Gausio.",
};

// La pagina dipende dal cookie di flusso e dalla config runtime: mai
// prerenderizzarla (senza env ZITADEL a build time verrebbe congelato
// il redirect verso /sign-in).
export const dynamic = "force-dynamic";

export default function MfaPage() {
  return <MfaPageContent />;
}
