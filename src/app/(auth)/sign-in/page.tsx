import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound, LogIn } from "lucide-react";
import {
  AppCard,
  Button,
  Input,
  Label,
  Separator,
} from "@/components/shared";
import { auth, isZitadelConfigured, signIn } from "@/server/auth";

export const metadata: Metadata = {
  title: "Accedi",
  description: "Accedi al tuo account Gausio.",
};

type SignInPageProps = Readonly<{
  searchParams: Promise<{ callbackUrl?: string }>;
}>;

function safeCallbackUrl(callbackUrl: string | undefined): string {
  return callbackUrl?.startsWith("/") ? callbackUrl : "/app";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;
  const redirectTo = safeCallbackUrl(callbackUrl);

  // Utente già autenticato: nessun motivo di restare sul sign-in.
  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const devLoginEnabled = process.env.AUTH_DEV_LOGIN === "true";

  async function zitadelSignIn() {
    "use server";
    await signIn("zitadel", { redirectTo });
  }

  async function devSignIn(formData: FormData) {
    "use server";
    await signIn("dev-login", {
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      redirectTo,
    });
  }

  return (
    <AppCard
      className="w-full max-w-md"
      title="Accedi a Gausio"
      description="Entra con la tua identità aziendale per raggiungere i tuoi workspace."
    >
      <div className="flex flex-col gap-6">
        {isZitadelConfigured && (
          <form action={zitadelSignIn}>
            <Button type="submit" size="lg" className="w-full">
              <LogIn aria-hidden className="size-4" />
              Accedi con Zitadel
            </Button>
          </form>
        )}

        {devLoginEnabled && (
          <>
            {isZitadelConfigured && (
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  oppure
                </span>
                <Separator className="flex-1" />
              </div>
            )}

            <form action={devSignIn} className="flex flex-col gap-4">
              <p className="flex items-center gap-2 text-sm font-medium text-warning">
                <KeyRound aria-hidden className="size-4" />
                Login di sviluppo (solo ambiente locale)
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dev-email">Email</Label>
                <Input
                  id="dev-email"
                  name="email"
                  type="email"
                  required
                  placeholder="tu@azienda.it"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dev-name">Nome</Label>
                <Input
                  id="dev-name"
                  name="name"
                  type="text"
                  placeholder="Mario Rossi"
                />
              </div>
              <Button type="submit" variant="outline">
                Entra in sviluppo
              </Button>
            </form>
          </>
        )}

        {!isZitadelConfigured && !devLoginEnabled && (
          <p role="alert" className="text-sm text-destructive">
            Nessun metodo di accesso configurato: imposta le variabili
            AUTH_ZITADEL_* (o AUTH_DEV_LOGIN=true in sviluppo) e riavvia.
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Accedendo dichiari di aver letto la nostra{" "}
          <a
            href="/privacy-policy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy Policy
          </a>{" "}
          e di accettare i{" "}
          <a
            href="/termini-e-condizioni"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Termini e condizioni
          </a>
          .
        </p>
      </div>
    </AppCard>
  );
}
