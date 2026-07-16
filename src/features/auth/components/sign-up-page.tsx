import { redirect } from "next/navigation";
import { ArrowRight, KeyRound, UserRoundPlus } from "lucide-react";
import { Button, LegalConsent, Separator } from "@/components/shared";
import { auth, isZitadelConfigured, signIn } from "@/server/auth";
import {
  AuthField,
  AuthLinkRow,
  AuthTextLink,
  LegalNotice,
} from "./auth-form-elements";
import { AuthPageShell } from "./auth-page-shell";
import { authErrorUrl, authRouteUrl, safeCallbackUrl } from "./auth-url";

type SignUpPageContentProps = Readonly<{
  callbackUrl?: string;
  error?: string;
}>;

function hasAcceptedTerms(formData: FormData): boolean {
  return formData.get("termsAccepted") === "accepted";
}

export async function SignUpPageContent({
  callbackUrl,
  error,
}: SignUpPageContentProps) {
  const redirectTo = safeCallbackUrl(callbackUrl);
  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const devLoginEnabled = process.env.AUTH_DEV_LOGIN === "true";
  const signInUrl = authRouteUrl("/sign-in", callbackUrl);
  const forgotPasswordUrl = authRouteUrl("/forgot-password", callbackUrl);

  async function devRegister(formData: FormData) {
    "use server";
    if (!hasAcceptedTerms(formData)) {
      redirect(authErrorUrl("/sign-up", "terms", callbackUrl));
    }
    await signIn("dev-login", {
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      redirectTo: "/onboarding",
    });
  }

  async function zitadelRegister(formData: FormData) {
    "use server";
    if (!hasAcceptedTerms(formData)) {
      redirect(authErrorUrl("/sign-up", "terms", callbackUrl));
    }
    await signIn(
      "zitadel",
      { redirectTo: "/onboarding" },
      { prompt: "create" },
    );
  }

  return (
    <AuthPageShell
      title="Crea il tuo account."
      description="Registrati in sicurezza, poi configura il primo workspace della tua azienda."
    >
      <div className="flex flex-col gap-6">
        {devLoginEnabled && (
          <form action={devRegister} className="flex flex-col gap-6">
            <p className="flex items-center gap-2 text-sm font-medium text-warning">
              <KeyRound aria-hidden className="size-[18px]" />
              Registrazione di sviluppo (solo ambiente locale)
            </p>
            <div className="flex flex-col gap-4">
              <AuthField
                id="sign-up-name"
                name="name"
                label="Nome e cognome"
                type="text"
                autoComplete="name"
                placeholder="Mario Rossi"
              />
              <AuthField
                id="sign-up-email"
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="tu@azienda.it"
              />
              <AuthField
                id="sign-up-password"
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="Crea una password"
              />
            </div>
            <AuthLinkRow>
              <p>
                Hai già un account?{" "}
                <AuthTextLink href={signInUrl}>Accedi</AuthTextLink>
              </p>
              <p>
                Password dimenticata?{" "}
                <AuthTextLink href={forgotPasswordUrl}>Clicca qui</AuthTextLink>
                .
              </p>
            </AuthLinkRow>
            <LegalConsent
              id="development-registration-terms"
              labelClassName="text-sm"
              required
              error={
                error === "terms"
                  ? "Accetta i termini e la privacy policy per registrarti."
                  : undefined
              }
            />
            <Button type="submit" size="lg" className="w-full">
              Registrati
              <ArrowRight aria-hidden className="size-[18px]" />
            </Button>
            {isZitadelConfigured && (
              <>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-sm text-muted-foreground">oppure</span>
                  <Separator className="flex-1" />
                </div>
                <Button
                  type="submit"
                  formAction={zitadelRegister}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <UserRoundPlus aria-hidden className="size-[18px]" />
                  Registrati con Zitadel
                </Button>
              </>
            )}
          </form>
        )}

        {isZitadelConfigured && !devLoginEnabled && (
          <>
            <form action={zitadelRegister} className="flex flex-col gap-6">
              <AuthLinkRow>
                <p>
                  Hai già un account?{" "}
                  <AuthTextLink href={signInUrl}>Accedi</AuthTextLink>
                </p>
                <p>
                  Password dimenticata?{" "}
                  <AuthTextLink href={forgotPasswordUrl}>
                    Clicca qui
                  </AuthTextLink>
                  .
                </p>
              </AuthLinkRow>
              <LegalConsent
                id="registration-terms"
                labelClassName="text-sm"
                required
                error={
                  error === "terms"
                    ? "Accetta i termini e la privacy policy per registrarti."
                    : undefined
                }
              />
              <Button type="submit" size="lg" className="w-full">
                <UserRoundPlus aria-hidden className="size-[18px]" />
                Registrati con Zitadel
              </Button>
            </form>
          </>
        )}

        {!devLoginEnabled && !isZitadelConfigured && (
          <p role="alert" className="text-sm text-destructive">
            Nessun metodo di registrazione configurato: imposta le variabili
            AUTH_ZITADEL_* oppure abilita AUTH_DEV_LOGIN in sviluppo.
          </p>
        )}
        <LegalNotice />
      </div>
    </AuthPageShell>
  );
}
