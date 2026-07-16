import { redirect } from "next/navigation";
import { ArrowRight, KeyRound, LogIn } from "lucide-react";
import { Button, Checkbox, Label, Separator } from "@/components/shared";
import { auth, isZitadelConfigured, signIn } from "@/server/auth";
import {
  AuthField,
  AuthLinkRow,
  AuthTextLink,
  LegalNotice,
} from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { authRouteUrl, safeCallbackUrl } from "./auth-url";

type SignInPageContentProps = Readonly<{ callbackUrl?: string }>;

export async function SignInPageContent({ callbackUrl }: SignInPageContentProps) {
  const redirectTo = safeCallbackUrl(callbackUrl);
  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const devLoginEnabled = process.env.AUTH_DEV_LOGIN === "true";
  const forgotPasswordUrl = authRouteUrl("/forgot-password", callbackUrl);
  const signUpUrl = authRouteUrl("/sign-up", callbackUrl);

  async function devSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    await signIn("dev-login", {
      email,
      name: email.split("@")[0],
      redirectTo,
    });
  }

  async function zitadelSignIn() {
    "use server";
    await signIn("zitadel", { redirectTo });
  }

  return (
    <AuthPageShell
      title="Bentornato."
      description="Accedi alla tua azienda e riprendi il lavoro da dove lo avevi lasciato."
    >
      <div className="flex flex-col gap-6">
        {devLoginEnabled && (
          <form action={devSignIn} className="flex flex-col gap-6">
            <p className="flex items-center gap-2 text-sm font-medium text-warning">
              <KeyRound aria-hidden className="size-[18px]" />
              Login di sviluppo (solo ambiente locale)
            </p>
            <div className="flex flex-col gap-4">
              <AuthField
                id="sign-in-email"
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="tu@azienda.it"
              />
              <AuthField
                id="sign-in-password"
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Inserisci la password"
              />
            </div>
            <AuthLinkRow>
              <Label
                htmlFor="remember-me"
                className="flex cursor-pointer items-center gap-2 text-sm font-normal text-foreground"
              >
                <Checkbox
                  id="remember-me"
                  name="remember"
                  className="size-[18px] rounded-[2px]"
                />
                Ricordami
              </Label>
              <p>
                Password dimenticata?{" "}
                <AuthTextLink href={forgotPasswordUrl}>
                  Clicca qui
                </AuthTextLink>
                .
              </p>
            </AuthLinkRow>
            <Button type="submit" size="lg" className="w-full">
              Accedi
              <ArrowRight aria-hidden className="size-[18px]" />
            </Button>
          </form>
        )}

        {isZitadelConfigured && (
          <>
            {devLoginEnabled && (
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">oppure</span>
                <Separator className="flex-1" />
              </div>
            )}
            <form action={zitadelSignIn}>
              <Button
                type="submit"
                size="lg"
                variant={devLoginEnabled ? "outline" : "default"}
                className="w-full"
              >
                <LogIn aria-hidden className="size-[18px]" />
                Accedi con Zitadel
              </Button>
            </form>
          </>
        )}

        {!devLoginEnabled && !isZitadelConfigured && (
          <p role="alert" className="text-sm text-destructive">
            Nessun metodo di accesso configurato: imposta le variabili AUTH_ZITADEL_*
            oppure abilita AUTH_DEV_LOGIN in sviluppo.
          </p>
        )}

        {!devLoginEnabled && (
          <AuthLinkRow>
            <p>
              Password dimenticata?{" "}
              <AuthTextLink href={forgotPasswordUrl}>Recuperala</AuthTextLink>
            </p>
            <p>
              Non hai un account? <AuthTextLink href={signUpUrl}>Registrati</AuthTextLink>
            </p>
          </AuthLinkRow>
        )}
        {devLoginEnabled && (
          <p className="text-center text-sm text-muted-foreground">
            Non hai un account? <AuthTextLink href={signUpUrl}>Registrati</AuthTextLink>
          </p>
        )}
        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
