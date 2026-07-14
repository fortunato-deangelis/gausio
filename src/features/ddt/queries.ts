import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  contacts,
  ddtLines,
  ddts,
  jobs,
  stockMovements,
} from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/workspace";

export type DdtDirection = "issued" | "received";

export async function listDdts(ctx: WorkspaceContext, direction: DdtDirection) {
  return db
    .select({
      id: ddts.id,
      code: ddts.code,
      date: ddts.date,
      status: ddts.status,
      transportReason: ddts.transportReason,
      contactName: contacts.businessName,
      jobCode: jobs.code,
    })
    .from(ddts)
    .leftJoin(contacts, eq(contacts.id, ddts.contactId))
    .leftJoin(jobs, eq(jobs.id, ddts.jobId))
    .where(
      and(eq(ddts.workspaceId, ctx.workspace.id), eq(ddts.direction, direction))
    )
    .orderBy(desc(ddts.year), desc(ddts.number));
}

export type DdtListRow = Awaited<ReturnType<typeof listDdts>>[number];

export async function getDdt(ctx: WorkspaceContext, id: string) {
  const ddt = await db.query.ddts.findFirst({
    where: and(eq(ddts.id, id), eq(ddts.workspaceId, ctx.workspace.id)),
  });
  if (!ddt) return null;

  const [lines, contact, job, existingMovement] = await Promise.all([
    db.query.ddtLines.findMany({
      where: eq(ddtLines.ddtId, ddt.id),
      orderBy: asc(ddtLines.position),
    }),
    db.query.contacts.findFirst({ where: eq(contacts.id, ddt.contactId) }),
    ddt.jobId
      ? db.query.jobs.findFirst({ where: eq(jobs.id, ddt.jobId) })
      : Promise.resolve(null),
    db.query.stockMovements.findFirst({
      where: eq(stockMovements.ddtId, ddt.id),
    }),
  ]);

  return {
    ddt,
    lines,
    contact: contact ?? null,
    job: job ?? null,
    movementsGenerated: Boolean(existingMovement),
  };
}

export type DdtDetail = NonNullable<Awaited<ReturnType<typeof getDdt>>>;
