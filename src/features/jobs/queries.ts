import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  contacts,
  ddts,
  invoices,
  jobs,
  orders,
  users,
  workLogs,
  workspaceMembers,
} from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/workspace";
import type { EntityOption } from "@/components/shared/entity-select";
import type { JobStatus } from "./schema";

export type JobRecord = typeof jobs.$inferSelect;

export type JobListRow = Readonly<{
  id: string;
  code: string;
  title: string;
  clientName: string | null;
  status: JobStatus;
  startDate: string | null;
  endDate: string | null;
  budgetAmount: string | null;
}>;

export async function listJobs(ctx: WorkspaceContext): Promise<JobListRow[]> {
  const rows = await db
    .select({
      id: jobs.id,
      code: jobs.code,
      title: jobs.title,
      clientName: contacts.businessName,
      status: jobs.status,
      startDate: jobs.startDate,
      endDate: jobs.endDate,
      budgetAmount: jobs.budgetAmount,
    })
    .from(jobs)
    .leftJoin(contacts, eq(contacts.id, jobs.clientId))
    .where(eq(jobs.workspaceId, ctx.workspace.id))
    .orderBy(desc(jobs.createdAt));
  return rows;
}

export async function getJob(
  ctx: WorkspaceContext,
  id: string
): Promise<(JobRecord & { clientName: string | null }) | null> {
  const [row] = await db
    .select({ job: jobs, clientName: contacts.businessName })
    .from(jobs)
    .leftJoin(contacts, eq(contacts.id, jobs.clientId))
    .where(and(eq(jobs.id, id), eq(jobs.workspaceId, ctx.workspace.id)));
  if (!row) return null;
  return { ...row.job, clientName: row.clientName };
}

export type JobLinkedDoc = Readonly<{
  id: string;
  code: string;
  status: string;
  total: string | null;
  date: string | null;
}>;

export type JobSummary = Readonly<{
  totalHours: string;
  orders: JobLinkedDoc[];
  invoices: JobLinkedDoc[];
  ddts: JobLinkedDoc[];
}>;

/** Riepilogo dei collegamenti della commessa: ore, ordini, fatture, DDT. */
export async function getJobSummary(
  ctx: WorkspaceContext,
  jobId: string
): Promise<JobSummary> {
  const [hoursRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${workLogs.hours}), 0)::text`,
    })
    .from(workLogs)
    .where(
      and(eq(workLogs.jobId, jobId), eq(workLogs.workspaceId, ctx.workspace.id))
    );

  const [orderRows, invoiceRows, ddtRows] = await Promise.all([
    db
      .select({
        id: orders.id,
        code: orders.code,
        status: orders.status,
        total: orders.total,
        date: orders.date,
      })
      .from(orders)
      .where(
        and(eq(orders.jobId, jobId), eq(orders.workspaceId, ctx.workspace.id))
      )
      .orderBy(desc(orders.date)),
    db
      .select({
        id: invoices.id,
        code: invoices.code,
        status: invoices.status,
        total: invoices.total,
        date: invoices.date,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.jobId, jobId),
          eq(invoices.workspaceId, ctx.workspace.id)
        )
      )
      .orderBy(desc(invoices.date)),
    db
      .select({
        id: ddts.id,
        code: ddts.code,
        status: ddts.status,
        date: ddts.date,
      })
      .from(ddts)
      .where(and(eq(ddts.jobId, jobId), eq(ddts.workspaceId, ctx.workspace.id)))
      .orderBy(desc(ddts.date)),
  ]);

  return {
    totalHours: hoursRow?.total ?? "0",
    orders: orderRows,
    invoices: invoiceRows,
    ddts: ddtRows.map((d) => ({ ...d, total: null })),
  };
}

export async function searchJobOptions(
  ctx: WorkspaceContext
): Promise<EntityOption[]> {
  const rows = await db.query.jobs.findMany({
    where: eq(jobs.workspaceId, ctx.workspace.id),
    orderBy: desc(jobs.createdAt),
  });
  return rows.map((j) => ({
    value: j.id,
    label: `${j.code} — ${j.title}`,
  }));
}

/** Opzioni membri del workspace (per responsabile/assegnatario). */
export async function listMemberOptions(
  ctx: WorkspaceContext
): Promise<{ value: string; label: string }[]> {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, ctx.workspace.id));
  return rows.map((r) => ({ value: r.id, label: r.name ?? r.email }));
}
