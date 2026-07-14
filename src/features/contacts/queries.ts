import "server-only";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { db } from "@/server/db";
import { contacts, jobs } from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/workspace";
import type { EntityOption } from "@/components/shared/entity-select";
import type { ContactKind } from "./schema";

export type ContactRecord = typeof contacts.$inferSelect;

export type ContactListRow = Readonly<{
  id: string;
  businessName: string;
  kind: ContactKind;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  qualification: ContactRecord["qualification"];
  isArchived: boolean;
}>;

function kindFilter(kind?: ContactKind | null) {
  if (!kind) return undefined;
  // "client" include anche i contatti "both", idem per "supplier".
  if (kind === "both") return eq(contacts.kind, "both");
  return or(eq(contacts.kind, kind), eq(contacts.kind, "both"));
}

export async function listContacts(
  ctx: WorkspaceContext,
  options: { kind?: ContactKind | null } = {}
): Promise<ContactListRow[]> {
  const rows = await db.query.contacts.findMany({
    where: and(
      eq(contacts.workspaceId, ctx.workspace.id),
      kindFilter(options.kind)
    ),
    orderBy: asc(contacts.businessName),
  });
  return rows.map((r) => ({
    id: r.id,
    businessName: r.businessName,
    kind: r.kind,
    vatNumber: r.vatNumber,
    email: r.email,
    phone: r.phone,
    city: r.city,
    qualification: r.qualification,
    isArchived: r.isArchived,
  }));
}

export async function getContact(
  ctx: WorkspaceContext,
  id: string
): Promise<ContactRecord | null> {
  const row = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, id), eq(contacts.workspaceId, ctx.workspace.id)),
  });
  return row ?? null;
}

/** Commesse recenti collegate al contatto (per il dettaglio). */
export async function listContactJobs(
  ctx: WorkspaceContext,
  contactId: string
): Promise<{ id: string; code: string; title: string; status: string }[]> {
  const rows = await db.query.jobs.findMany({
    where: and(
      eq(jobs.workspaceId, ctx.workspace.id),
      eq(jobs.clientId, contactId)
    ),
    orderBy: desc(jobs.createdAt),
    limit: 10,
  });
  return rows.map((j) => ({
    id: j.id,
    code: j.code,
    title: j.title,
    status: j.status,
  }));
}

/** Opzioni per EntitySelect (esclusi gli archiviati). */
export async function searchContactOptions(
  ctx: WorkspaceContext,
  kind?: ContactKind | null
): Promise<EntityOption[]> {
  const rows = await db.query.contacts.findMany({
    where: and(
      eq(contacts.workspaceId, ctx.workspace.id),
      eq(contacts.isArchived, false),
      kindFilter(kind)
    ),
    orderBy: asc(contacts.businessName),
  });
  return rows.map((r) => ({
    value: r.id,
    label: r.businessName,
    description: r.vatNumber ? `P.IVA ${r.vatNumber}` : undefined,
  }));
}
