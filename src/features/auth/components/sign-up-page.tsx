import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/shared";
import { auth } from "@/server/auth";
import { isCustomLoginEnabled } from "@/server/zitadel/config";
import { logZitadelError } from "@/server/zitadel/errors";
import {
  describePasswordPolicy,
  getPasswordComplexitySettings,
} from "@/server/zitadel/settings";
import { AUTH_REQUEST_ID_PATTERN } from "../schema";
import { LegalNotice } from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { authRouteUrl, safeCallbackUrl } from "./auth-url";
import { RegisterForm } from "./register-form";

type SignUpPageContentProps = Readonly<{
  callbackUrl?: string;
  error?: string;
  authRequest?: string;
  loginHint?: string;
}>;

export async function SignUpPageContent({
  callbackUrl,
  authRequest,
  loginHint,
}: SignUpPageContentProps) {
  const redirectTo = safeCallbackUrl(callbackUrl);
  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const configured = isCustomLoginEnabled();
  const signInUrl = authRouteUrl("/sign-in", callbackUrl);
  const forgotPasswordUrl = authRouteUrl("/forgot-password", callbackUrl);

  // Presente solo quando il flusso arriva da una auth request OIDC già
  // aperta (redirect Login V2 con prompt=create).
  const validAuthRequest =
    authRequest && AUTH_REQUEST_ID_PATTERN.test(authRequest) ? authRequest : undefined;

  let passwordPolicyHint: string | undefined;
  if (configured) {
    try {
      passwordPolicyHint = describePasswordPolicy(await getPasswordComplexitySettings());
    } catch (policyError) {
      logZitadelError("password policy hint", policyError);
    }
  }

  return (
    <AuthPageShell
      title="Crea il tuo account."
      description="Registrati in sicurezza, poi configura il primo workspace della tua azienda."
    >
      <div className="flex flex-col gap-6">
        {!configured && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              Registrazione non configurata: servono AUTH_ZITADEL_* e
              ZITADEL_SERVICE_USER_TOKEN. Vedi docs/ZITADEL_CONFIGURATION.md.
            </AlertDescription>
          </Alert>
        )}

        <RegisterForm
          authRequest={validAuthRequest}
          loginHint={loginHint}
          signInUrl={signInUrl}
          forgotPasswordUrl={forgotPasswordUrl}
          passwordPolicyHint={passwordPolicyHint}
        />

        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
