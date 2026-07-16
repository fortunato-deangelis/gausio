"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { ddts, invoices, jobs, orders, workLogs } from "@/server/db/schema";
import { requirePermission } from "@/server/workspace";
import { nextDocumentNumber } from "@/server/numbering";
import {
  assertContactInWorkspace,
  assertMemberInWorkspace,
} from "@/server/tenant-references";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  jobSchema,
  quickCreateJobSchema,
  type JobInput,
  type QuickCreateJobInput,
} from "./schema";

function toRow(parsed: JobInput) {
  return {
    title: parsed.title,
    description: parsed.description || null,
    clientId: parsed.clientId || null,
    status: parsed.status,
    startDate: parsed.startDate || null,
    endDate: parsed.endDate || null,
    budgetAmount: parsed.budgetAmount || null,
    estimatedHours: parsed.estimatedHours || null,
    managerId: parsed.managerId || null,
    notes: parsed.notes || null,
  };
}

export async function createJob(
  input: JobInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const ctx = await requirePermission("jobs", "create");
    const parsed = jobSchema.parse(input);
    await Promise.all([
      assertContactInWorkspace(ctx.workspace.id, parsed.clientId),
      assertMemberInWorkspace(ctx.workspace.id, parsed.managerId),
    ]);
    const { code, year, number } = await nextDocumentNumber(
      ctx.workspace.id,
      "job",
      "COM"
    );
    const [row] = await db
      .insert(jobs)
      .values({
        ...toRow(parsed),
        workspaceId: ctx.workspace.id,
        code,
        year,
        number,
        createdBy: ctx.userId,
      })
      .returning({ id: jobs.id, code: jobs.code });
    revalidatePath("/app/commesse");
    return ok(row);
  } catch (error) {
    return fail(error);
  }
}

export async function updateJob(
  id: string,
  input: JobInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("jobs", "edit");
    const parsed = jobSchema.parse(input);
    const existing = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, id), eq(jobs.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Commessa non trovata."));
    await Promise.all([
      assertContactInWorkspace(ctx.workspace.id, parsed.clientId),
      assertMemberInWorkspace(ctx.workspace.id, parsed.managerId),
    ]);
    await db
      .update(jobs)
      .set({ ...toRow(parsed), updatedAt: new Date() })
      .where(eq(jobs.id, id));
    revalidatePath("/app/commesse");
    revalidatePath(`/app/commesse/${id}`);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}

/** Creazione rapida inline dagli altri moduli: basta il titolo. */
export async function quickCreateJob(
  input: QuickCreateJobInput
): Promise<ActionResult<{ id: string; code: string; title: string }>> {
  try {
    const ctx = await requirePermission("jobs", "create");
    const parsed = quickCreateJobSchema.parse(input);
    const { code, year, number } = await nextDocumentNumber(
      ctx.workspace.id,
      "job",
      "COM"
    );
    const [row] = await db
      .insert(jobs)
      .values({
        workspaceId: ctx.workspace.id,
        code,
        year,
        number,
        title: parsed.title,
        status: "open",
        createdBy: ctx.userId,
      })
      .returning({ id: jobs.id, code: jobs.code, title: jobs.title });
    revalidatePath("/app/commesse");
    return ok(row);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteJob(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("jobs", "delete");
    const existing = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, id), eq(jobs.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Commessa non trovata."));

    const [linkedOrder, linkedInvoice, linkedDdt, linkedLog] =
      await Promise.all([
        db.query.orders.findFirst({ where: eq(orders.jobId, id) }),
        db.query.invoices.findFirst({ where: eq(invoices.jobId, id) }),
        db.query.ddts.findFirst({ where: eq(ddts.jobId, id) }),
        db.query.workLogs.findFirst({ where: eq(workLogs.jobId, id) }),
      ]);
    if (linkedOrder || linkedInvoice || linkedDdt || linkedLog) {
      return fail(
        new Error(
          "La commessa ha documenti od ore lavorate collegati e non può essere eliminata."
        )
      );
    }

    await db.delete(jobs).where(eq(jobs.id, id));
    revalidatePath("/app/commesse");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
