import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";
import { jobs } from "./jobs";

/**
 * Gestione del personale: anagrafica dipendenti, richieste di assenza
 * (ferie/permessi/malattia), timbrature e schede lavoro su commessa.
 */

export const employeeStatusEnum = pgEnum("employee_status", [
  "active",
  "suspended",
  "terminated",
]);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Collegamento opzionale all'utente applicativo (per self-service). */
    userId: uuid("user_id").references(() => users.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fiscalCode: text("fiscal_code"),
    email: text("email"),
    phone: text("phone"),
    birthDate: date("birth_date"),
    birthPlace: text("birth_place"),
    address: text("address"),
    city: text("city"),
    zipCode: text("zip_code"),
    province: text("province"),
    jobTitle: text("job_title"),
    department: text("department"),
    contractType: text("contract_type"),
    hiredAt: date("hired_at"),
    terminatedAt: date("terminated_at"),
    status: employeeStatusEnum("status").notNull().default("active"),
    hourlyCost: numeric("hourly_cost", { precision: 10, scale: 2 }),
    annualLeaveDays: numeric("annual_leave_days", { precision: 5, scale: 1 }),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("employees_workspace_idx").on(t.workspaceId)]
);

export const leaveTypeEnum = pgEnum("leave_type", [
  "ferie",
  "permesso",
  "malattia",
]);

export const leaveStatusEnum = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    type: leaveTypeEnum("type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    /** Per i permessi orari. */
    startTime: time("start_time"),
    endTime: time("end_time"),
    reason: text("reason"),
    /** Protocollo del certificato medico per la malattia. */
    protocolNumber: text("protocol_number"),
    status: leaveStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("leave_requests_employee_idx").on(t.employeeId)]
);

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    clockIn: time("clock_in").notNull(),
    clockOut: time("clock_out"),
    breakMinutes: numeric("break_minutes", { precision: 5, scale: 0 }).default(
      "0"
    ),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("time_entries_employee_date_idx").on(t.employeeId, t.date)]
);

/** Scheda lavoro: ore del dipendente imputate a una commessa. */
export const workLogs = pgTable(
  "work_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    hours: numeric("hours", { precision: 6, scale: 2 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("work_logs_employee_idx").on(t.employeeId),
    index("work_logs_job_idx").on(t.jobId),
  ]
);
