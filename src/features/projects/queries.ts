import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  contacts,
  jobs,
  projectTasks,
  projects,
  users,
} from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/workspace";
import type { ProjectStatus, TaskPriority, TaskStatus } from "./schema";

export type ProjectRecord = typeof projects.$inferSelect;
export type TaskRecord = typeof projectTasks.$inferSelect;

export type ProjectListRow = Readonly<{
  id: string;
  name: string;
  clientName: string | null;
  jobCode: string | null;
  status: ProjectStatus;
  endDate: string | null;
  tasksTotal: number;
  tasksDone: number;
}>;

export async function listProjects(
  ctx: WorkspaceContext
): Promise<ProjectListRow[]> {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: contacts.businessName,
      jobCode: jobs.code,
      status: projects.status,
      endDate: projects.endDate,
      tasksTotal: sql<number>`(select count(*)::int from ${projectTasks} where ${projectTasks.projectId} = ${projects.id})`,
      tasksDone: sql<number>`(select count(*)::int from ${projectTasks} where ${projectTasks.projectId} = ${projects.id} and ${projectTasks.status} = 'done')`,
    })
    .from(projects)
    .leftJoin(contacts, eq(contacts.id, projects.clientId))
    .leftJoin(jobs, eq(jobs.id, projects.jobId))
    .where(eq(projects.workspaceId, ctx.workspace.id))
    .orderBy(desc(projects.createdAt));
  return rows;
}

export type TaskWithAssignee = TaskRecord &
  Readonly<{ assigneeName: string | null }>;

export async function getProjectWithTasks(
  ctx: WorkspaceContext,
  id: string
): Promise<
  | (ProjectRecord & {
      clientName: string | null;
      jobCode: string | null;
      tasks: TaskWithAssignee[];
    })
  | null
> {
  const [row] = await db
    .select({
      project: projects,
      clientName: contacts.businessName,
      jobCode: jobs.code,
    })
    .from(projects)
    .leftJoin(contacts, eq(contacts.id, projects.clientId))
    .leftJoin(jobs, eq(jobs.id, projects.jobId))
    .where(and(eq(projects.id, id), eq(projects.workspaceId, ctx.workspace.id)));
  if (!row) return null;

  const tasks = await db
    .select({ task: projectTasks, assigneeName: users.name, assigneeEmail: users.email })
    .from(projectTasks)
    .leftJoin(users, eq(users.id, projectTasks.assigneeId))
    .where(eq(projectTasks.projectId, id))
    .orderBy(asc(projectTasks.position), asc(projectTasks.createdAt));

  return {
    ...row.project,
    clientName: row.clientName,
    jobCode: row.jobCode,
    tasks: tasks.map((t) => ({
      ...t.task,
      assigneeName: t.assigneeName ?? t.assigneeEmail,
    })),
  };
}

/** Elenco task per l'export di dettaglio, raggruppabile per stato. */
export type TaskExportRow = Readonly<{
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName: string | null;
  dueDate: string | null;
}>;
