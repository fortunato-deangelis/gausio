import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  KeyRound,
  LogIn,
  RefreshCcw,
  UserRoundPlus,
} from "lucide-react";
import {
  BrandLogo,
  Button,
  Input,
  Label,
  LegalConsent,
  Separator,
} from "@/components/shared";
import { auth, isZitadelConfigured, signIn } from "@/server/auth";
import { AuthCopyright } from "./auth-shell";
import { AuthModeToggle, type AuthMode } from "./auth-mode-toggle";

type SignInPageContentProps = Readonly<{
  callbackUrl?: string;
  mode?: string;
  error?: string;
}>;

const MODE_COPY: Record<AuthMode, { title: string; description: string }> = {
  login: {
    title: "Bentornato.",
    description: "Accedi alla tua azienda e riprendi il lavoro da dove lo avevi lasciato.",
  },
  register: {
    title: "Crea il tuo account.",
    description: "Registrati in sicurezza, poi configura il primo workspace della tua azienda.",
  },
  recover: {
    title: "Recupera l'accesso.",
    description: "Continua su Zitadel per identificarti e ricevere il link sicuro di recupero.",
  },
};

function safeCallbackUrl(callbackUrl: string | undefined): string {
  return callbackUrl?.startsWith("/") ? callbackUrl : "/app";
}

function safeMode(mode: string | undefined): AuthMode {
  return mode === "register" || mode === "recover" ? mode : "login";
}

function hasAcceptedTerms(formData: FormData): boolean {
  return formData.get("termsAccepted") === "accepted";
}

function registrationErrorUrl(callbackUrl?: string): string {
  const params = new URLSearchParams({ mode: "register", error: "terms" });
  if (callbackUrl) params.set("callbackUrl", callbackUrl);
  return `/sign-in?${params.toString()}`;
}

function LegalNotice() {
  return (
    <p className="text-center text-sm leading-relaxed text-muted-foreground">
      Consulta la{" "}
      <Link
        href="/privacy-policy"
        className="font-medium underline underline-offset-4 hover:text-foreground"
      >
        Privacy Policy
      </Link>{" "}
      e i{" "}
      <Link
        href="/termini-e-condizioni"
        className="font-medium underline underline-offset-4 hover:text-foreground"
      >
        Termini e condizioni
      </Link>
      .
    </p>
  );
}

function DevCredentialsFields() {
  return (
    <>
      <p className="flex items-center gap-2 text-sm font-medium text-warning">
        <KeyRound aria-hidden className="size-[18px]" />
        Login di sviluppo (solo ambiente locale)
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dev-email">Email</Label>
        <Input
          id="dev-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@azienda.it"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dev-name">Nome</Label>
        <Input
          id="dev-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Mario Rossi"
        />
      </div>
    </>
  );
}

export async function SignInPageContent({
  callbackUrl,
  mode: requestedMode,
  error,
}: SignInPageContentProps) {
  const redirectTo = safeCallbackUrl(callbackUrl);
  const mode = safeMode(requestedMode);
  const copy = MODE_COPY[mode];

  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const devLoginEnabled = process.env.AUTH_DEV_LOGIN === "true";

  async function zitadelSignIn() {
    "use server";
    await signIn("zitadel", { redirectTo });
  }

  async function zitadelRegister(formData: FormData) {
    "use server";
    if (!hasAcceptedTerms(formData)) redirect(registrationErrorUrl(callbackUrl));
    await signIn("zitadel", { redirectTo: "/onboarding" }, { prompt: "create" });
  }

  async function zitadelRecover() {
    "use server";
    await signIn("zitadel", { redirectTo }, { prompt: "login" });
  }

  async function devSignIn(formData: FormData) {
    "use server";
    await signIn("dev-login", {
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      redirectTo,
    });
  }

  async function devRegister(formData: FormData) {
    "use server";
    if (!hasAcceptedTerms(formData)) redirect(registrationErrorUrl(callbackUrl));
    await signIn("dev-login", {
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      redirectTo: "/onboarding",
    });
  }

  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto grid min-h-dvh w-full max-w-360 grid-rows-[auto_1fr_auto] bg-white lg:grid-cols-2">
        <header className="col-span-full row-start-1 z-10 flex justify-center bg-transparent px-5 py-7 sm:px-8 lg:justify-start lg:px-12 lg:py-10">
          <BrandLogo
            showLabel
            imageClassName="size-12 bg-primary"
            labelClassName="text-3xl"
          />
        </header>

        <aside className="relative hidden overflow-hidden bg-[#f5f5f7] px-12 pb-12 pt-32 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:flex lg:flex-col lg:justify-center">
          <div className="mx-auto w-full max-w-xl">
            <p className="text-lg font-semibold text-primary">La tua azienda, insieme.</p>
            <h2 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance xl:text-6xl">
              Le persone cambiano. Il contesto resta.
            </h2>
            <p className="mt-6 max-w-lg text-xl leading-relaxed text-muted-foreground">
              Entra in uno spazio condiviso dove clienti, attività e documenti
              continuano a parlare la stessa lingua.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4" aria-hidden>
              <div className="h-56 overflow-hidden rounded-[2px] bg-white p-4 ring-1 ring-black/8">
                <Image
                  src="/auth/team-alessia.svg"
                  alt=""
                  width={1744}
                  height={1744}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-10 h-56 overflow-hidden rounded-[2px] bg-primary/10 p-4 ring-1 ring-primary/15">
                <Image
                  src="/auth/team-marco.svg"
                  alt=""
                  width={1744}
                  height={1744}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="col-span-2 -mt-12 ml-auto h-44 w-[52%] overflow-hidden rounded-[2px] bg-white p-4 ring-1 ring-black/8">
                <Image
                  src="/auth/team-giulia.svg"
                  alt=""
                  width={1744}
                  height={1744}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="row-start-2 flex items-center justify-center px-5 py-10 sm:px-8 lg:col-start-2 lg:px-12 lg:py-16">
          <div className="w-full max-w-lg">
            <AuthModeToggle mode={mode} callbackUrl={callbackUrl} />

            <div className="mt-10">
              <h1 className="text-4xl font-bold tracking-[-0.04em] text-balance sm:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {copy.description}
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-6">
              {mode === "login" && (
                <>
                  {isZitadelConfigured && (
                    <form action={zitadelSignIn}>
                      <Button type="submit" size="lg" className="w-full">
                        <LogIn aria-hidden className="size-[18px]" />
                        Accedi con Zitadel
                      </Button>
                    </form>
                  )}

                  {devLoginEnabled && (
                    <>
                      {isZitadelConfigured && (
                        <div className="flex items-center gap-3">
                          <Separator className="flex-1" />
                          <span className="text-sm text-muted-foreground">oppure</span>
                          <Separator className="flex-1" />
                        </div>
                      )}
                      <form action={devSignIn} className="flex flex-col gap-4">
                        <DevCredentialsFields />
                        <Button type="submit" size="lg" variant="outline">
                          Entra in sviluppo
                          <ArrowRight aria-hidden className="size-[18px]" />
                        </Button>
                      </form>
                    </>
                  )}
                </>
              )}

              {mode === "register" && (
                <form
                  action={isZitadelConfigured ? zitadelRegister : devRegister}
                  className="flex flex-col gap-6"
                >
                  {!isZitadelConfigured && devLoginEnabled && <DevCredentialsFields />}
                  <LegalConsent
                    id="registration-terms"
                    required
                    error={
                      error === "terms"
                        ? "Accetta i termini e la privacy policy per registrarti."
                        : undefined
                    }
                  />
                  {(isZitadelConfigured || devLoginEnabled) && (
                    <Button type="submit" size="lg" className="w-full">
                      <UserRoundPlus aria-hidden className="size-[18px]" />
                      Continua la registrazione
                    </Button>
                  )}
                </form>
              )}

              {mode === "recover" && (
                <>
                  {isZitadelConfigured ? (
                    <form action={zitadelRecover} className="flex flex-col gap-4">
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Nel portale sicuro inserisci il tuo identificativo, quindi
                        scegli “Password dimenticata” per ricevere le istruzioni.
                      </p>
                      <Button type="submit" size="lg" className="w-full">
                        <RefreshCcw aria-hidden className="size-[18px]" />
                        Avvia il recupero
                      </Button>
                    </form>
                  ) : (
                    <p className="text-base leading-relaxed text-muted-foreground">
                      Il login di sviluppo non usa password. Inserisci la tua email
                      nella sezione Accedi per entrare nell&apos;ambiente locale.
                    </p>
                  )}
                </>
              )}

              {!isZitadelConfigured && !devLoginEnabled && (
                <p role="alert" className="text-sm text-destructive">
                  Nessun metodo di accesso configurato: imposta le variabili
                  AUTH_ZITADEL_* oppure abilita AUTH_DEV_LOGIN in sviluppo.
                </p>
              )}

              <LegalNotice />
            </div>
          </div>
        </section>

        <footer className="row-start-3 px-5 py-7 sm:px-8 lg:col-start-2 lg:px-12">
          <AuthCopyright />
        </footer>
      </div>
    </main>
  );
}
