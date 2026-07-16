import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/shared";
import { auth } from "@/server/auth";
import { isCustomLoginEnabled } from "@/server/zitadel/config";
import { AuthLinkRow, AuthTextLink, LegalNotice } from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { authRouteUrl, safeCallbackUrl } from "./auth-url";
import { ForgotPasswordForm } from "./forgot-password-form";

type ForgotPasswordPageContentProps = Readonly<{ callbackUrl?: string }>;

export async function ForgotPasswordPageContent({
  callbackUrl,
}: ForgotPasswordPageContentProps) {
  const redirectTo = safeCallbackUrl(callbackUrl);
  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const configured = isCustomLoginEnabled();
  const signInUrl = authRouteUrl("/sign-in", callbackUrl);
  const signUpUrl = authRouteUrl("/sign-up", callbackUrl);

  return (
    <AuthPageShell
      title="Recupera l'accesso."
      description="Inserisci la tua email: ti invieremo un link sicuro per reimpostare la password."
    >
      <div className="flex flex-col gap-6">
        {!configured && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              Recupero non configurato: servono AUTH_ZITADEL_* e
              ZITADEL_SERVICE_USER_TOKEN. Vedi docs/ZITADEL_CONFIGURATION.md.
            </AlertDescription>
          </Alert>
        )}

        <ForgotPasswordForm />
        <AuthLinkRow>
          <p>
            Hai già un account? <AuthTextLink href={signInUrl}>Accedi</AuthTextLink>
          </p>
          <p>
            Non hai un account? Vai a{" "}
            <AuthTextLink href={signUpUrl}>Registrati</AuthTextLink>
          </p>
        </AuthLinkRow>
        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
