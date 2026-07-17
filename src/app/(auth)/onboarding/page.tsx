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
        <OnboardingWizard isAdditionalWorkspace={Boolean(ctx)} />
      </main>
    </CenteredAuthShell>
  );
}
