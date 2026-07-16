import { AuthLinkRow, AuthTextLink, LegalNotice } from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { VerifyEmailForm } from "./verify-email-form";

type VerifyEmailPageContentProps = Readonly<{
  userId?: string;
  code?: string;
}>;

/**
 * Conferma email: raggiunta subito dopo la registrazione (l'utente incolla
 * il codice ricevuto) oppure dal link contenuto nell'email di ZITADEL.
 */
export async function VerifyEmailPageContent({
  userId,
  code,
}: VerifyEmailPageContentProps) {
  return (
    <AuthPageShell
      title="Conferma la tua email."
      description="Ti abbiamo inviato un codice di verifica: incollalo qui sotto per attivare il tuo account."
    >
      <div className="flex flex-col gap-6">
        {userId ? (
          <VerifyEmailForm userId={userId} code={code} />
        ) : (
          <div className="flex flex-col gap-6">
            <p role="alert" className="text-sm text-destructive">
              Il link di verifica non è valido o è incompleto.
            </p>
            <AuthLinkRow>
              <p>
                Torna in <AuthTextLink href="/sign-in">Accedi</AuthTextLink>
              </p>
              <p>
                Non hai un account? Vai a{" "}
                <AuthTextLink href="/sign-up">Registrati</AuthTextLink>
              </p>
            </AuthLinkRow>
          </div>
        )}
        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
