import { redirect } from "next/navigation";
import { Button } from "@/components/shared";
import { getWebAuthnDomain, isCustomLoginEnabled } from "@/server/zitadel/config";
import { readLoginFlowCookie } from "@/server/zitadel/cookies";
import { logZitadelError } from "@/server/zitadel/errors";
import { availableMfaMethods } from "@/server/zitadel/mfa";
import { listAuthenticationMethods } from "@/server/zitadel/users";
import { abandonLoginFlow } from "../actions";
import { LegalNotice } from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { MfaForm } from "./mfa-form";

/**
 * Verifica in due passaggi: pagina custom che completa la sessione ZITADEL
 * con il secondo fattore. Richiede un flusso di login attivo (cookie
 * HttpOnly cifrato impostato dal check password).
 */
export async function MfaPageContent() {
  if (!isCustomLoginEnabled()) redirect("/sign-in");

  const flow = await readLoginFlowCookie();
  if (!flow) redirect("/sign-in?error=flow");

  let methods: ReturnType<typeof availableMfaMethods>;
  try {
    const authMethods = await listAuthenticationMethods(flow.userId, getWebAuthnDomain());
    methods = availableMfaMethods(authMethods);
  } catch (error) {
    logZitadelError("mfa page", error);
    redirect("/sign-in?error=flow");
  }

  return (
    <AuthPageShell
      title="Verifica in due passaggi."
      description="Un ultimo controllo per proteggere il tuo account e i dati della tua azienda."
    >
      <div className="flex flex-col gap-6">
        <MfaForm methods={methods} loginName={flow.loginName} />
        <form action={abandonLoginFlow}>
          <Button type="submit" variant="ghost" className="w-full">
            Annulla e torna all&apos;accesso
          </Button>
        </form>
        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
