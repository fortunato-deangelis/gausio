import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  employees,
  jobs,
  leaveRequests,
  timeEntries,
  workLogs,
} from "@/server/db/schema";
import { getWorkspaceContext } from "@/server/workspace";
import type { EntityOption } from "@/components/shared";

/** Query di lettura del modulo Personale (sempre filtrate per workspace). */

export type EmployeeRow = typeof employees.$inferSelect;

export async function listEmployees(): Promise<EmployeeRow[]> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return db.query.employees.findMany({
    where: eq(employees.workspaceId, ctx.workspace.id),
    orderBy: [employees.lastName, employees.firstName],
  });
}

export async function employeeOptions(): Promise<EntityOption[]> {
  const rows = await listEmployees();
  return rows
    .filter((e) => e.status !== "terminated")
    .map((e) => ({
      value: e.id,
      label: `${e.lastName} ${e.firstName}`,
      description: e.jobTitle ?? undefined,
    }));
}

export async function jobOptions(): Promise<EntityOption[]> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const rows = await db.query.jobs.findMany({
    where: eq(jobs.workspaceId, ctx.workspace.id),
    orderBy: desc(jobs.createdAt),
  });
  return rows.map((j) => ({
    value: j.id,
    label: `${j.code} — ${j.title}`,
  }));
}

/** Minuti lavorati di una timbratura (null se non chiusa). */
function entryMinutes(entry: {
  clockIn: string;
  clockOut: string | null;
  breakMinutes: string | null;
}): number | null {
  if (!entry.clockOut) return null;
  const [inH, inM] = entry.clockIn.split(":").map(Number);
  const [outH, outM] = entry.clockOut.split(":").map(Number);
  const raw = outH * 60 + outM - (inH * 60 + inM);
  const breakMin = entry.breakMinutes ? Number(entry.breakMinutes) : 0;
  return Math.max(raw - breakMin, 0);
}

export function entryHoursLabel(entry: {
  clockIn: string;
  clockOut: string | null;
  breakMinutes: string | null;
}): string {
  const minutes = entryMinutes(entry);
  if (minutes === null) return "—";
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

/** Giorni di calendario inclusivi tra due date ISO. */
function inclusiveDays(startDate: string, endDate: string): number {
  const ms =
    new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export type EmployeeDetail = Readonly<{
  employee: EmployeeRow;
  /** Giorni di ferie approvate nell'anno corrente. */
  approvedLeaveDaysThisYear: number;
  /** Ore timbrate nel mese corrente. */
  workedHoursThisMonth: number;
  recentTimeEntries: (typeof timeEntries.$inferSelect)[];
  leaves: (typeof leaveRequests.$inferSelect)[];
  logs: {
    id: string;
    date: string;
    hours: string;
    description: string | null;
    jobCode: string;
    jobTitle: string;
  }[];
}>;

export async function getEmployee(id: string): Promise<EmployeeDetail | null> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;
  const employee = await db.query.employees.findFirst({
    where: and(
      eq(employees.id, id),
      eq(employees.workspaceId, ctx.workspace.id)
    ),
  });
  if (!employee) return null;

  const [leaves, entries, logRows] = await Promise.all([
    db.query.leaveRequests.findMany({
      where: eq(leaveRequests.employeeId, employee.id),
      orderBy: desc(leaveRequests.startDate),
    }),
    db.query.timeEntries.findMany({
      where: eq(timeEntries.employeeId, employee.id),
      orderBy: [desc(timeEntries.date), desc(timeEntries.clockIn)],
    }),
    db
      .select({
        id: workLogs.id,
        date: workLogs.date,
        hours: workLogs.hours,
        description: workLogs.description,
        jobCode: jobs.code,
        jobTitle: jobs.title,
      })
      .from(workLogs)
      .innerJoin(jobs, eq(jobs.id, workLogs.jobId))
      .where(eq(workLogs.employeeId, employee.id))
      .orderBy(desc(workLogs.date)),
  ]);

  const year = new Date().getFullYear();
  const approvedLeaveDaysThisYear = leaves
    .filter(
      (l) =>
        l.type === "ferie" &&
        l.status === "approved" &&
        new Date(l.startDate).getFullYear() === year
    )
    .reduce((sum, l) => sum + inclusiveDays(l.startDate, l.endDate), 0);

  const now = new Date();
  const workedMinutesThisMonth = entries
    .filter((e) => {
      const d = new Date(e.date);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    })
    .reduce((sum, e) => sum + (entryMinutes(e) ?? 0), 0);

  return {
    employee,
    approvedLeaveDaysThisYear,
    workedHoursThisMonth: Math.round((workedMinutesThisMonth / 60) * 10) / 10,
    recentTimeEntries: entries.slice(0, 5),
    leaves,
    logs: logRows,
  };
}

export type LeaveListRow = Readonly<{
  id: string;
  employeeId: string;
  employeeName: string;
  type: "ferie" | "permesso" | "malattia";
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  protocolNumber: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewNotes: string | null;
}>;

export async function listLeaveRequests(
  status?: string
): Promise<LeaveListRow[]> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const validStatus = ["pending", "approved", "rejected", "cancelled"].includes(
    status ?? ""
  )
    ? (status as LeaveListRow["status"])
    : undefined;

  const rows = await db
    .select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      startTime: leaveRequests.startTime,
      endTime: leaveRequests.endTime,
      reason: leaveRequests.reason,
      protocolNumber: leaveRequests.protocolNumber,
      status: leaveRequests.status,
      reviewNotes: leaveRequests.reviewNotes,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
    .where(
      and(
        eq(leaveRequests.workspaceId, ctx.workspace.id),
        validStatus ? eq(leaveRequests.status, validStatus) : undefined
      )
    )
    .orderBy(desc(leaveRequests.startDate));

  return rows.map((r) => ({
    ...r,
    employeeName: `${r.lastName} ${r.firstName}`,
  }));
}

export type TimeEntryListRow = Readonly<{
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: string | null;
  notes: string | null;
  hoursLabel: string;
}>;

export async function listTimeEntries(): Promise<TimeEntryListRow[]> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const rows = await db
    .select({
      id: timeEntries.id,
      employeeId: timeEntries.employeeId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      date: timeEntries.date,
      clockIn: timeEntries.clockIn,
      clockOut: timeEntries.clockOut,
      breakMinutes: timeEntries.breakMinutes,
      notes: timeEntries.notes,
    })
    .from(timeEntries)
    .innerJoin(employees, eq(employees.id, timeEntries.employeeId))
    .where(eq(timeEntries.workspaceId, ctx.workspace.id))
    .orderBy(desc(timeEntries.date), desc(timeEntries.clockIn));

  return rows.map((r) => ({
    ...r,
    employeeName: `${r.lastName} ${r.firstName}`,
    hoursLabel: entryHoursLabel(r),
  }));
}

export type WorkLogListRow = Readonly<{
  id: string;
  employeeId: string;
  employeeName: string;
  jobId: string;
  jobLabel: string;
  date: string;
  hours: string;
  description: string | null;
}>;

export async function listWorkLogs(): Promise<WorkLogListRow[]> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const rows = await db
    .select({
      id: workLogs.id,
      employeeId: workLogs.employeeId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      jobId: workLogs.jobId,
      jobCode: jobs.code,
      jobTitle: jobs.title,
      date: workLogs.date,
      hours: workLogs.hours,
      description: workLogs.description,
    })
    .from(workLogs)
    .innerJoin(employees, eq(employees.id, workLogs.employeeId))
    .innerJoin(jobs, eq(jobs.id, workLogs.jobId))
    .where(eq(workLogs.workspaceId, ctx.workspace.id))
    .orderBy(desc(workLogs.date));

  return rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: `${r.lastName} ${r.firstName}`,
    jobId: r.jobId,
    jobLabel: `${r.jobCode} — ${r.jobTitle}`,
    date: r.date,
    hours: r.hours,
    description: r.description,
  }));
}
