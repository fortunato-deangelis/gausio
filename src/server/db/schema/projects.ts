import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";
import { contacts } from "./contacts";
import { jobs } from "./jobs";

/** Project management: progetti (opzionalmente legati a una commessa) e task. */

export const projectStatusEnum = pgEnum("project_status", [
  "planned",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("planned"),
    clientId: uuid("client_id").references(() => contacts.id),
    jobId: uuid("job_id").references(() => jobs.id),
    startDate: date("start_date"),
    endDate: date("end_date"),
    budgetHours: numeric("budget_hours", { precision: 10, scale: 2 }),
    managerId: uuid("manager_id").references(() => users.id),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("projects_workspace_idx").on(t.workspaceId)]
);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "review",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    assigneeId: uuid("assignee_id").references(() => users.id),
    dueDate: date("due_date"),
    position: integer("position").notNull().default(0),
    estimatedHours: numeric("estimated_hours", { precision: 8, scale: 2 }),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("project_tasks_project_idx").on(t.projectId)]
);
