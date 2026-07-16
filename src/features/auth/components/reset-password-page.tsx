import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { logZitadelError } from "@/server/zitadel/errors";
import {
  describePasswordPolicy,
  getPasswordComplexitySettings,
} from "@/server/zitadel/settings";
import { AuthLinkRow, AuthTextLink, LegalNotice } from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { ResetPasswordForm } from "./reset-password-form";

type ResetPasswordPageContentProps = Readonly<{
  userId?: string;
  code?: string;
}>;

/** Pagina raggiunta dal link dell'email di reset inviata da ZITADEL. */
export async function ResetPasswordPageContent({
  userId,
  code,
}: ResetPasswordPageContentProps) {
  const session = await auth();
  if (session?.user) redirect("/app");

  const linkValid = Boolean(userId && code);

  let passwordPolicyHint: string | undefined;
  if (linkValid) {
    try {
      passwordPolicyHint = describePasswordPolicy(await getPasswordComplexitySettings());
    } catch (error) {
      logZitadelError("password policy hint", error);
    }
  }

  return (
    <AuthPageShell
      title="Imposta la nuova password."
      description="Scegli una nuova password sicura per il tuo account."
    >
      <div className="flex flex-col gap-6">
        {linkValid ? (
          <ResetPasswordForm
            userId={userId as string}
            code={code as string}
            passwordPolicyHint={passwordPolicyHint}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <p role="alert" className="text-sm text-destructive">
              Il link di reset non è valido o è incompleto. Richiedi una nuova
              email di recupero.
            </p>
            <AuthLinkRow>
              <p>
                Vai a{" "}
                <AuthTextLink href="/forgot-password">Recupera password</AuthTextLink>
              </p>
              <p>
                Torna in <AuthTextLink href="/sign-in">Accedi</AuthTextLink>
              </p>
            </AuthLinkRow>
          </div>
        )}
        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
