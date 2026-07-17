import { redirect } from "next/navigation";
import { DismissibleAlert } from "@/components/shared";
import { auth } from "@/server/auth";
import { isCustomLoginEnabled } from "@/server/zitadel/config";
import { AUTH_REQUEST_ID_PATTERN } from "../schema";
import { LegalNotice } from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { authRouteUrl, safeCallbackUrl } from "./auth-url";
import { PasswordLoginForm } from "./password-login-form";

type SignInPageContentProps = Readonly<{
  callbackUrl?: string;
  authRequest?: string;
  loginHint?: string;
  error?: string;
}>;

const signInErrorMessages: Record<string, string> = {
  flow: "La sessione di accesso è scaduta o non è più valida. Riprova.",
  "email-unverified":
    "Prima di accedere devi verificare l'email del tuo account. Controlla la posta e riprova.",
  AccessDenied:
    "Accesso rifiutato. Verifica che l'email dell'account sia confermata e riprova.",
  Configuration:
    "Accesso non configurato correttamente. Contatta un amministratore.",
  OAuthCallbackError:
    "Non è stato possibile completare il rientro da Zitadel. Riprova.",
};

function signInErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  return signInErrorMessages[error] ?? "Non è stato possibile completare l'accesso. Riprova.";
}

export async function SignInPageContent({
  callbackUrl,
  authRequest,
  loginHint,
  error,
}: SignInPageContentProps) {
  const redirectTo = safeCallbackUrl(callbackUrl);
  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const configured = isCustomLoginEnabled();
  const forgotPasswordUrl = authRouteUrl("/forgot-password", callbackUrl);
  const signUpUrl = authRouteUrl("/sign-up", callbackUrl);

  // Presente solo quando il flusso arriva da una auth request OIDC già
  // aperta (redirect Login V2); il form la finalizzerà dopo il login.
  const validAuthRequest =
    authRequest && AUTH_REQUEST_ID_PATTERN.test(authRequest) ? authRequest : undefined;
  const errorMessage = signInErrorMessage(error);

  return (
    <AuthPageShell
      title="Bentornato."
      description="Accedi alla tua azienda e riprendi il lavoro da dove lo avevi lasciato."
    >
      <div className="flex flex-col gap-6">
        {errorMessage && (
          <DismissibleAlert variant="destructive" role="alert">
            {errorMessage}
          </DismissibleAlert>
        )}

        {!configured && (
          <DismissibleAlert variant="destructive" role="alert">
            Accesso non configurato: servono AUTH_ZITADEL_* e
            ZITADEL_SERVICE_USER_TOKEN. Vedi docs/ZITADEL_CONFIGURATION.md.
          </DismissibleAlert>
        )}

        <PasswordLoginForm
          authRequest={validAuthRequest}
          redirectTo={redirectTo}
          loginHint={loginHint}
          forgotPasswordUrl={forgotPasswordUrl}
          signUpUrl={signUpUrl}
        />

        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
