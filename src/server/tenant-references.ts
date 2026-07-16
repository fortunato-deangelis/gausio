import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { contacts, jobs, workspaceMembers } from "@/server/db/schema";

/**
 * Verifiche per le FK globali che, da sole, non garantiscono l'isolamento
 * tenant. Ogni riferimento ricevuto dal client deve appartenere allo stesso
 * workspace dell'entità che lo salverà.
 */
export async function assertContactInWorkspace(
  workspaceId: string,
  contactId: string | null | undefined
): Promise<void> {
  if (!contactId) return;
  const contact = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.workspaceId, workspaceId)),
    columns: { id: true },
  });
  if (!contact) throw new Error("Contatto non valido.");
}

export async function assertJobInWorkspace(
  workspaceId: string,
  jobId: string | null | undefined
): Promise<void> {
  if (!jobId) return;
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)),
    columns: { id: true },
  });
  if (!job) throw new Error("Commessa non valida.");
}

export async function assertMemberInWorkspace(
  workspaceId: string,
  userId: string | null | undefined
): Promise<void> {
  if (!userId) return;
  const member = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId)
    ),
    columns: { id: true },
  });
  if (!member) throw new Error("Membro del workspace non valido.");
}
