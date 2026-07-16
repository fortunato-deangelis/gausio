import { redirect } from "next/navigation";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/shared";
import { auth, isZitadelConfigured, signIn } from "@/server/auth";
import {
  AuthField,
  AuthLinkRow,
  AuthTextLink,
  LegalNotice,
} from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { authRouteUrl, safeCallbackUrl } from "./auth-url";

type ForgotPasswordPageContentProps = Readonly<{ callbackUrl?: string }>;

export async function ForgotPasswordPageContent({
  callbackUrl,
}: ForgotPasswordPageContentProps) {
  const redirectTo = safeCallbackUrl(callbackUrl);
  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const signInUrl = authRouteUrl("/sign-in", callbackUrl);
  const signUpUrl = authRouteUrl("/sign-up", callbackUrl);

  async function zitadelRecover(formData: FormData) {
    "use server";
    await signIn(
      "zitadel",
      { redirectTo },
      {
        prompt: "login",
        login_hint: String(formData.get("email") ?? ""),
      }
    );
  }

  return (
    <AuthPageShell
      title="Recupera l'accesso."
      description="Inserisci la tua email e continua nel portale sicuro per recuperare la password."
    >
      <div className="flex flex-col gap-6">
        {isZitadelConfigured ? (
          <form action={zitadelRecover} className="flex flex-col gap-6">
            <AuthField
              id="forgot-password-email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="tu@azienda.it"
            />
            <AuthLinkRow>
              <p>
                Hai già un account? <AuthTextLink href={signInUrl}>Accedi</AuthTextLink>
              </p>
              <p>
                Non hai un account? Vai a{" "}
                <AuthTextLink href={signUpUrl}>Registrati</AuthTextLink>
              </p>
            </AuthLinkRow>
            <Button type="submit" size="lg" className="w-full">
              <RefreshCcw aria-hidden className="size-[18px]" />
              Recupera password
              <ArrowRight aria-hidden className="size-[18px]" />
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-base leading-relaxed text-muted-foreground">
              Il login di sviluppo non salva password. Per provare l’ambiente locale
              puoi tornare alla pagina di accesso e usare qualsiasi password non vuota.
            </p>
            <AuthLinkRow>
              <p>
                Torna in <AuthTextLink href={signInUrl}>Accedi</AuthTextLink>
              </p>
              <p>
                Non hai un account? Vai a{" "}
                <AuthTextLink href={signUpUrl}>Registrati</AuthTextLink>
              </p>
            </AuthLinkRow>
          </div>
        )}
        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
