import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getWorkspaceContext } from "@/server/workspace";
import { OnboardingWizard } from "@/features/workspaces/components/onboarding-wizard";

export const metadata = { title: "Onboarding" };

/** Creazione del profilo aziendale (workspace) dopo la registrazione. */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/onboarding");

  const ctx = await getWorkspaceContext();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-2xl font-bold tracking-tight text-primary">Gausio</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {ctx ? "Crea un nuovo workspace" : "Benvenuto! Configura la tua azienda"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {ctx
            ? "Stai creando un workspace aggiuntivo: sarai amministratore anche di questo."
            : "Rispondi a qualche domanda e crea il profilo della tua azienda: sarai l'amministratore del workspace."}
        </p>
      </div>
      <OnboardingWizard />
    </main>
  );
}
