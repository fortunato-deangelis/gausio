import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/shared";
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

  return (
    <AuthPageShell
      title="Bentornato."
      description="Accedi alla tua azienda e riprendi il lavoro da dove lo avevi lasciato."
    >
      <div className="flex flex-col gap-6">
        {error === "flow" && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              La sessione di accesso è scaduta o non è più valida. Riprova.
            </AlertDescription>
          </Alert>
        )}

        {!configured && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              Accesso non configurato: servono AUTH_ZITADEL_* e
              ZITADEL_SERVICE_USER_TOKEN. Vedi docs/ZITADEL_CONFIGURATION.md.
            </AlertDescription>
          </Alert>
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
