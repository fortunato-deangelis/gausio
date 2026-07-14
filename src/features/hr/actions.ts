"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import {
  employees,
  jobs,
  leaveRequests,
  timeEntries,
  workLogs,
} from "@/server/db/schema";
import { assertSameWorkspace, requirePermission } from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  employeeSchema,
  leaveSchema,
  normalizeDecimal,
  timeEntrySchema,
  workLogSchema,
  type EmployeeInput,
  type LeaveInput,
  type TimeEntryInput,
  type WorkLogInput,
} from "./schema";

/** Server action del modulo Personale (permesso "hr"). */

const HR_PATH = "/app/personale";

function employeeValues(parsed: EmployeeInput) {
  return {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    fiscalCode: parsed.fiscalCode || null,
    email: parsed.email || null,
    phone: parsed.phone || null,
    birthDate: parsed.birthDate || null,
    birthPlace: parsed.birthPlace || null,
    address: parsed.address || null,
    city: parsed.city || null,
    zipCode: parsed.zipCode || null,
    province: parsed.province || null,
    jobTitle: parsed.jobTitle || null,
    department: parsed.department || null,
    contractType: parsed.contractType || null,
    hiredAt: parsed.hiredAt || null,
    terminatedAt: parsed.terminatedAt || null,
    status: parsed.status,
    hourlyCost: normalizeDecimal(parsed.hourlyCost),
    annualLeaveDays: normalizeDecimal(parsed.annualLeaveDays),
    notes: parsed.notes || null,
  };
}

export async function createEmployee(
  input: EmployeeInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("hr", "create");
    const parsed = employeeSchema.parse(input);
    const [row] = await db
      .insert(employees)
      .values({
        workspaceId: ctx.workspace.id,
        createdBy: ctx.userId,
        ...employeeValues(parsed),
      })
      .returning({ id: employees.id });
    revalidatePath(HR_PATH);
    return ok({ id: row.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateEmployee(
  id: string,
  input: EmployeeInput
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "edit");
    const parsed = employeeSchema.parse(input);
    const existing = await db.query.employees.findFirst({
      where: eq(employees.id, id),
    });
    if (!existing) return fail(new Error("Dipendente non trovato."));
    assertSameWorkspace(ctx, existing.workspaceId);

    await db
      .update(employees)
      .set({ ...employeeValues(parsed), updatedAt: new Date() })
      .where(eq(employees.id, id));
    revalidatePath(HR_PATH);
    revalidatePath(`${HR_PATH}/${id}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteEmployee(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "delete");
    const existing = await db.query.employees.findFirst({
      where: eq(employees.id, id),
    });
    if (!existing) return fail(new Error("Dipendente non trovato."));
    assertSameWorkspace(ctx, existing.workspaceId);

    const [leave, entry, log] = await Promise.all([
      db.query.leaveRequests.findFirst({
        where: eq(leaveRequests.employeeId, id),
      }),
      db.query.timeEntries.findFirst({ where: eq(timeEntries.employeeId, id) }),
      db.query.workLogs.findFirst({ where: eq(workLogs.employeeId, id) }),
    ]);
    if (leave || entry || log) {
      return fail(
        new Error(
          "Il dipendente ha assenze, timbrature o schede lavoro registrate: impostalo come Cessato invece di eliminarlo."
        )
      );
    }

    await db.delete(employees).where(eq(employees.id, id));
    revalidatePath(HR_PATH);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/* ------------------------------- Assenze -------------------------------- */

async function assertEmployeeInWorkspace(
  workspaceId: string,
  employeeId: string
) {
  const employee = await db.query.employees.findFirst({
    where: and(
      eq(employees.id, employeeId),
      eq(employees.workspaceId, workspaceId)
    ),
  });
  if (!employee) throw new Error("Dipendente non valido.");
}

function leaveValues(parsed: LeaveInput) {
  return {
    employeeId: parsed.employeeId,
    type: parsed.type,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    startTime: parsed.type === "permesso" ? parsed.startTime || null : null,
    endTime: parsed.type === "permesso" ? parsed.endTime || null : null,
    reason: parsed.reason || null,
    protocolNumber:
      parsed.type === "malattia" ? parsed.protocolNumber || null : null,
  };
}

export async function createLeaveRequest(
  input: LeaveInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("hr", "create");
    const parsed = leaveSchema.parse(input);
    await assertEmployeeInWorkspace(ctx.workspace.id, parsed.employeeId);
    const [row] = await db
      .insert(leaveRequests)
      .values({ workspaceId: ctx.workspace.id, ...leaveValues(parsed) })
      .returning({ id: leaveRequests.id });
    revalidatePath(`${HR_PATH}/assenze`);
    return ok({ id: row.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateLeaveRequest(
  id: string,
  input: LeaveInput
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "edit");
    const parsed = leaveSchema.parse(input);
    const existing = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, id),
    });
    if (!existing) return fail(new Error("Richiesta non trovata."));
    assertSameWorkspace(ctx, existing.workspaceId);
    await assertEmployeeInWorkspace(ctx.workspace.id, parsed.employeeId);

    await db
      .update(leaveRequests)
      .set({ ...leaveValues(parsed), updatedAt: new Date() })
      .where(eq(leaveRequests.id, id));
    revalidatePath(`${HR_PATH}/assenze`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function reviewLeaveRequest(
  id: string,
  decision: "approved" | "rejected",
  reviewNotes?: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "edit");
    const existing = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, id),
    });
    if (!existing) return fail(new Error("Richiesta non trovata."));
    assertSameWorkspace(ctx, existing.workspaceId);
    if (existing.status !== "pending") {
      return fail(new Error("La richiesta è già stata valutata."));
    }

    await db
      .update(leaveRequests)
      .set({
        status: decision,
        reviewedBy: ctx.userId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id));
    revalidatePath(`${HR_PATH}/assenze`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteLeaveRequest(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "delete");
    const existing = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, id),
    });
    if (!existing) return fail(new Error("Richiesta non trovata."));
    assertSameWorkspace(ctx, existing.workspaceId);
    await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    revalidatePath(`${HR_PATH}/assenze`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/* ------------------------------ Timbrature ------------------------------ */

function timeEntryValues(parsed: TimeEntryInput) {
  return {
    employeeId: parsed.employeeId,
    date: parsed.date,
    clockIn: parsed.clockIn,
    clockOut: parsed.clockOut || null,
    breakMinutes: parsed.breakMinutes || "0",
    notes: parsed.notes || null,
  };
}

export async function createTimeEntry(
  input: TimeEntryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("hr", "create");
    const parsed = timeEntrySchema.parse(input);
    await assertEmployeeInWorkspace(ctx.workspace.id, parsed.employeeId);
    const [row] = await db
      .insert(timeEntries)
      .values({ workspaceId: ctx.workspace.id, ...timeEntryValues(parsed) })
      .returning({ id: timeEntries.id });
    revalidatePath(`${HR_PATH}/timbrature`);
    return ok({ id: row.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateTimeEntry(
  id: string,
  input: TimeEntryInput
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "edit");
    const parsed = timeEntrySchema.parse(input);
    const existing = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, id),
    });
    if (!existing) return fail(new Error("Timbratura non trovata."));
    assertSameWorkspace(ctx, existing.workspaceId);
    await assertEmployeeInWorkspace(ctx.workspace.id, parsed.employeeId);

    await db
      .update(timeEntries)
      .set({ ...timeEntryValues(parsed), updatedAt: new Date() })
      .where(eq(timeEntries.id, id));
    revalidatePath(`${HR_PATH}/timbrature`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTimeEntry(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "delete");
    const existing = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, id),
    });
    if (!existing) return fail(new Error("Timbratura non trovata."));
    assertSameWorkspace(ctx, existing.workspaceId);
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
    revalidatePath(`${HR_PATH}/timbrature`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/* ----------------------------- Schede lavoro ----------------------------- */

async function assertJobInWorkspace(workspaceId: string, jobId: string) {
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)),
  });
  if (!job) throw new Error("Commessa non valida.");
}

function workLogValues(parsed: WorkLogInput) {
  return {
    employeeId: parsed.employeeId,
    jobId: parsed.jobId,
    date: parsed.date,
    hours: String(Number(parsed.hours.replace(",", "."))),
    description: parsed.description || null,
  };
}

export async function createWorkLog(
  input: WorkLogInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("hr", "create");
    const parsed = workLogSchema.parse(input);
    await assertEmployeeInWorkspace(ctx.workspace.id, parsed.employeeId);
    await assertJobInWorkspace(ctx.workspace.id, parsed.jobId);
    const [row] = await db
      .insert(workLogs)
      .values({
        workspaceId: ctx.workspace.id,
        createdBy: ctx.userId,
        ...workLogValues(parsed),
      })
      .returning({ id: workLogs.id });
    revalidatePath(`${HR_PATH}/schede-lavoro`);
    return ok({ id: row.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateWorkLog(
  id: string,
  input: WorkLogInput
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "edit");
    const parsed = workLogSchema.parse(input);
    const existing = await db.query.workLogs.findFirst({
      where: eq(workLogs.id, id),
    });
    if (!existing) return fail(new Error("Scheda lavoro non trovata."));
    assertSameWorkspace(ctx, existing.workspaceId);
    await assertEmployeeInWorkspace(ctx.workspace.id, parsed.employeeId);
    await assertJobInWorkspace(ctx.workspace.id, parsed.jobId);

    await db
      .update(workLogs)
      .set({ ...workLogValues(parsed), updatedAt: new Date() })
      .where(eq(workLogs.id, id));
    revalidatePath(`${HR_PATH}/schede-lavoro`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteWorkLog(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("hr", "delete");
    const existing = await db.query.workLogs.findFirst({
      where: eq(workLogs.id, id),
    });
    if (!existing) return fail(new Error("Scheda lavoro non trovata."));
    assertSameWorkspace(ctx, existing.workspaceId);
    await db.delete(workLogs).where(eq(workLogs.id, id));
    revalidatePath(`${HR_PATH}/schede-lavoro`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
