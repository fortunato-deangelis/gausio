import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getWorkspaceContext } from "@/server/workspace";
import { CenteredAuthShell } from "@/features/auth/components/auth-shell";
import { OnboardingWizard } from "@/features/workspaces/components/onboarding-wizard";

export const metadata = { title: "Onboarding" };

/** Creazione del profilo aziendale (workspace) dopo la registrazione. */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/onboarding");

  const ctx = await getWorkspaceContext();

  return (
    <CenteredAuthShell>
      <main className="w-full max-w-360">
        <div className="mb-10 text-center">
          <p className="text-lg font-semibold text-primary">
            Configurazione iniziale
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-balance sm:text-5xl">
            {ctx
              ? "Crea un nuovo workspace"
              : "Benvenuto! Configura la tua azienda"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {ctx
              ? "Stai creando un workspace aggiuntivo: sarai amministratore anche di questo."
              : "Rispondi a qualche domanda e crea il profilo della tua azienda: sarai l'amministratore del workspace."}
          </p>
        </div>
        <OnboardingWizard />
      </main>
    </CenteredAuthShell>
  );
}
