import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";
import { contacts } from "./contacts";

/** Commesse: il perno che collega vendite, acquisti, progetti e ore lavorate. */

export const jobStatusEnum = pgEnum("job_status", [
  "draft",
  "open",
  "in_progress",
  "suspended",
  "completed",
  "cancelled",
]);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Codice progressivo tipo COM-2026-0001. */
    code: text("code").notNull(),
    year: integer("year").notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    clientId: uuid("client_id").references(() => contacts.id),
    status: jobStatusEnum("status").notNull().default("open"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    budgetAmount: numeric("budget_amount", { precision: 14, scale: 2 }),
    estimatedHours: numeric("estimated_hours", { precision: 10, scale: 2 }),
    managerId: uuid("manager_id").references(() => users.id),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("jobs_workspace_idx").on(t.workspaceId),
    uniqueIndex("jobs_code_idx").on(t.workspaceId, t.code),
  ]
);
