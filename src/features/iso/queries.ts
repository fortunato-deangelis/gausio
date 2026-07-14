import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  isoDocumentRevisions,
  isoDocuments,
  users,
  workspaceMembers,
} from "@/server/db/schema";
import { getWorkspaceContext } from "@/server/workspace";
import type { EntityOption } from "@/components/shared";

/** Query di lettura del modulo ISO (sempre filtrate per workspace). */

export type IsoDocumentRow = typeof isoDocuments.$inferSelect;

const STANDARD_VALUES = [
  "iso9001",
  "iso27001",
  "iso14001",
  "iso45001",
  "other",
] as const;
const STATUS_VALUES = ["draft", "in_review", "approved", "obsolete"] as const;

export async function listIsoDocuments(filters?: {
  standard?: string;
  status?: string;
}): Promise<IsoDocumentRow[]> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];

  const standard = STANDARD_VALUES.includes(
    filters?.standard as (typeof STANDARD_VALUES)[number]
  )
    ? (filters?.standard as (typeof STANDARD_VALUES)[number])
    : undefined;
  const status = STATUS_VALUES.includes(
    filters?.status as (typeof STATUS_VALUES)[number]
  )
    ? (filters?.status as (typeof STATUS_VALUES)[number])
    : undefined;

  return db.query.isoDocuments.findMany({
    where: and(
      eq(isoDocuments.workspaceId, ctx.workspace.id),
      standard ? eq(isoDocuments.standard, standard) : undefined,
      status ? eq(isoDocuments.status, status) : undefined
    ),
    orderBy: [isoDocuments.code],
  });
}

export type IsoRevisionRow = Readonly<{
  id: string;
  revision: number;
  changeDescription: string | null;
  createdAt: Date;
  authorName: string | null;
}>;

export type IsoDocumentDetail = Readonly<{
  document: IsoDocumentRow;
  revisions: IsoRevisionRow[];
  ownerName: string | null;
  approverName: string | null;
}>;

export async function getIsoDocument(
  id: string
): Promise<IsoDocumentDetail | null> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;
  const document = await db.query.isoDocuments.findFirst({
    where: and(
      eq(isoDocuments.id, id),
      eq(isoDocuments.workspaceId, ctx.workspace.id)
    ),
  });
  if (!document) return null;

  const revisionRows = await db
    .select({
      id: isoDocumentRevisions.id,
      revision: isoDocumentRevisions.revision,
      changeDescription: isoDocumentRevisions.changeDescription,
      createdAt: isoDocumentRevisions.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(isoDocumentRevisions)
    .leftJoin(users, eq(users.id, isoDocumentRevisions.createdBy))
    .where(eq(isoDocumentRevisions.documentId, document.id))
    .orderBy(desc(isoDocumentRevisions.revision));

  const [owner, approver] = await Promise.all([
    document.ownerId
      ? db.query.users.findFirst({ where: eq(users.id, document.ownerId) })
      : null,
    document.approvedBy
      ? db.query.users.findFirst({ where: eq(users.id, document.approvedBy) })
      : null,
  ]);

  return {
    document,
    revisions: revisionRows.map((r) => ({
      id: r.id,
      revision: r.revision,
      changeDescription: r.changeDescription,
      createdAt: r.createdAt,
      authorName: r.authorName ?? r.authorEmail,
    })),
    ownerName: owner?.name ?? owner?.email ?? null,
    approverName: approver?.name ?? approver?.email ?? null,
  };
}

/** Membri del workspace, per il campo "responsabile" dei documenti. */
export async function listMemberOptions(): Promise<EntityOption[]> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, ctx.workspace.id));
  return rows.map((r) => ({
    value: r.id,
    label: r.name ?? r.email,
    description: r.name ? r.email : undefined,
  }));
}
