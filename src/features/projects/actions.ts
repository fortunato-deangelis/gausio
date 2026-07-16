"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { projectTasks, projects } from "@/server/db/schema";
import { requirePermission } from "@/server/workspace";
import {
  assertContactInWorkspace,
  assertJobInWorkspace,
  assertMemberInWorkspace,
} from "@/server/tenant-references";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  projectSchema,
  taskSchema,
  taskStatuses,
  type ProjectInput,
  type TaskInput,
  type TaskStatus,
} from "./schema";

function toProjectRow(parsed: ProjectInput) {
  return {
    name: parsed.name,
    description: parsed.description || null,
    status: parsed.status,
    clientId: parsed.clientId || null,
    jobId: parsed.jobId || null,
    startDate: parsed.startDate || null,
    endDate: parsed.endDate || null,
    budgetHours: parsed.budgetHours || null,
    managerId: parsed.managerId || null,
  };
}

async function getOwnedProject(workspaceId: string, projectId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)),
  });
}

export async function createProject(
  input: ProjectInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("projects", "create");
    const parsed = projectSchema.parse(input);
    await Promise.all([
      assertContactInWorkspace(ctx.workspace.id, parsed.clientId),
      assertJobInWorkspace(ctx.workspace.id, parsed.jobId),
      assertMemberInWorkspace(ctx.workspace.id, parsed.managerId),
    ]);
    const [row] = await db
      .insert(projects)
      .values({
        ...toProjectRow(parsed),
        workspaceId: ctx.workspace.id,
        createdBy: ctx.userId,
      })
      .returning({ id: projects.id });
    revalidatePath("/app/progetti");
    return ok({ id: row.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("projects", "edit");
    const parsed = projectSchema.parse(input);
    const existing = await getOwnedProject(ctx.workspace.id, id);
    if (!existing) return fail(new Error("Progetto non trovato."));
    await Promise.all([
      assertContactInWorkspace(ctx.workspace.id, parsed.clientId),
      assertJobInWorkspace(ctx.workspace.id, parsed.jobId),
      assertMemberInWorkspace(ctx.workspace.id, parsed.managerId),
    ]);
    await db
      .update(projects)
      .set({ ...toProjectRow(parsed), updatedAt: new Date() })
      .where(eq(projects.id, id));
    revalidatePath("/app/progetti");
    revalidatePath(`/app/progetti/${id}`);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProject(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("projects", "delete");
    const existing = await getOwnedProject(ctx.workspace.id, id);
    if (!existing) return fail(new Error("Progetto non trovato."));
    // Le attività vengono eliminate in cascata dal vincolo FK.
    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath("/app/progetti");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

function toTaskRow(parsed: TaskInput) {
  return {
    title: parsed.title,
    description: parsed.description || null,
    status: parsed.status,
    priority: parsed.priority,
    assigneeId: parsed.assigneeId || null,
    dueDate: parsed.dueDate || null,
    estimatedHours: parsed.estimatedHours || null,
  };
}

export async function createTask(
  projectId: string,
  input: TaskInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("projects", "create");
    const parsed = taskSchema.parse(input);
    const project = await getOwnedProject(ctx.workspace.id, projectId);
    if (!project) return fail(new Error("Progetto non trovato."));
    await assertMemberInWorkspace(ctx.workspace.id, parsed.assigneeId);
    const [row] = await db
      .insert(projectTasks)
      .values({ ...toTaskRow(parsed), projectId, createdBy: ctx.userId })
      .returning({ id: projectTasks.id });
    revalidatePath(`/app/progetti/${projectId}`);
    return ok({ id: row.id });
  } catch (error) {
    return fail(error);
  }
}

async function getOwnedTask(workspaceId: string, taskId: string) {
  const [row] = await db
    .select({ task: projectTasks, workspaceId: projects.workspaceId })
    .from(projectTasks)
    .innerJoin(projects, eq(projects.id, projectTasks.projectId))
    .where(eq(projectTasks.id, taskId));
  if (!row || row.workspaceId !== workspaceId) return null;
  return row.task;
}

export async function updateTask(
  taskId: string,
  input: TaskInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("projects", "edit");
    const parsed = taskSchema.parse(input);
    const task = await getOwnedTask(ctx.workspace.id, taskId);
    if (!task) return fail(new Error("Attività non trovata."));
    await assertMemberInWorkspace(ctx.workspace.id, parsed.assigneeId);
    await db
      .update(projectTasks)
      .set({ ...toTaskRow(parsed), updatedAt: new Date() })
      .where(eq(projectTasks.id, taskId));
    revalidatePath(`/app/progetti/${task.projectId}`);
    return ok({ id: taskId });
  } catch (error) {
    return fail(error);
  }
}

/** Sposta una task in un altro stato (colonne della board). */
export async function moveTask(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("projects", "edit");
    if (!taskStatuses.includes(status)) {
      return fail(new Error("Stato non valido."));
    }
    const task = await getOwnedTask(ctx.workspace.id, taskId);
    if (!task) return fail(new Error("Attività non trovata."));
    await db
      .update(projectTasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(projectTasks.id, taskId));
    revalidatePath(`/app/progetti/${task.projectId}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTask(
  taskId: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("projects", "delete");
    const task = await getOwnedTask(ctx.workspace.id, taskId);
    if (!task) return fail(new Error("Attività non trovata."));
    await db.delete(projectTasks).where(eq(projectTasks.id, taskId));
    revalidatePath(`/app/progetti/${task.projectId}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
