import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { workspaceInvitations, workspaces } from "@/server/db/schema";
import { acceptInvitation } from "@/features/workspaces/actions";
import { CenteredAuthShell } from "@/features/auth/components/auth-shell";
import { AppCard, Button } from "@/components/shared";

export const metadata = { title: "Invito" };

/** Accettazione di un invito a un workspace. */
export default async function InvitoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ errore?: string }>;
}) {
  const { token } = await params;
  const { errore } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/invito/${token}`)}`);
  }

  const invitation = await db.query.workspaceInvitations.findFirst({
    where: eq(workspaceInvitations.token, token),
  });
  const workspace = invitation
    ? await db.query.workspaces.findFirst({
        where: eq(workspaces.id, invitation.workspaceId),
      })
    : null;

  const isValid =
    invitation &&
    workspace &&
    invitation.email.trim().toLowerCase() ===
      session.user.email?.trim().toLowerCase() &&
    invitation.status === "pending" &&
    invitation.expiresAt > new Date();

  async function accept() {
    "use server";
    const result = await acceptInvitation(token);
    if (result.ok) redirect("/app");
    redirect(`/invito/${token}?errore=${encodeURIComponent(result.error)}`);
  }

  return (
    <CenteredAuthShell>
      <AppCard
        className="w-full max-w-md rounded-[2px] text-center"
        title={isValid ? "Sei stato invitato!" : "Invito non valido"}
      >
        {isValid ? (
          <form action={accept} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Sei stato invitato a unirti al workspace{" "}
              <strong className="text-foreground">{workspace.name}</strong> con
              l&apos;account {session!.user!.email}.
            </p>
            {errore && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {errore}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full">
              Accetta invito
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Questo invito è scaduto, è già stato utilizzato o non esiste.
            Chiedi a chi ti ha invitato di generarne uno nuovo.
          </p>
        )}
      </AppCard>
    </CenteredAuthShell>
  );
}
