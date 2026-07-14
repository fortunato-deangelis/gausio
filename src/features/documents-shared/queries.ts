import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { contacts, jobs } from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/workspace";
import type { EntityOption } from "@/components/shared";

/**
 * Opzioni per i select di entità collegate, condivise dai documenti
 * (ordini, fatture, DDT, movimenti di magazzino).
 */

export async function contactOptions(
  ctx: WorkspaceContext,
  kind: "client" | "supplier" | "all" = "all"
): Promise<EntityOption[]> {
  const kindFilter =
    kind === "client"
      ? inArray(contacts.kind, ["client", "both"])
      : kind === "supplier"
        ? inArray(contacts.kind, ["supplier", "both"])
        : undefined;

  const rows = await db
    .select({
      id: contacts.id,
      businessName: contacts.businessName,
      vatNumber: contacts.vatNumber,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.workspaceId, ctx.workspace.id),
        eq(contacts.isArchived, false),
        kindFilter
      )
    )
    .orderBy(asc(contacts.businessName));

  return rows.map((r) => ({
    value: r.id,
    label: r.businessName,
    description: r.vatNumber ? `P.IVA ${r.vatNumber}` : undefined,
  }));
}

export async function jobOptions(ctx: WorkspaceContext): Promise<EntityOption[]> {
  const rows = await db
    .select({ id: jobs.id, code: jobs.code, title: jobs.title })
    .from(jobs)
    .where(
      and(eq(jobs.workspaceId, ctx.workspace.id), ne(jobs.status, "cancelled"))
    )
    .orderBy(asc(jobs.code));

  return rows.map((r) => ({
    value: r.id,
    label: `${r.code} — ${r.title}`,
  }));
}
