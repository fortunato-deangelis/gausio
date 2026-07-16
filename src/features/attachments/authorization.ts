import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import {
  attachmentEntityEnum,
  contacts,
  ddts,
  employees,
  invoices,
  isoDocuments,
  jobs,
  leaveRequests,
  orders,
  projectTasks,
  projects,
  stockMovements,
  warehouseItems,
  workLogs,
} from "@/server/db/schema";
import {
  can,
  getWorkspaceContext,
  type WorkspaceContext,
} from "@/server/workspace";
import type {
  AppModule,
  PermissionAction,
} from "@/server/auth/permissions";

export type AttachmentEntity = (typeof attachmentEntityEnum.enumValues)[number];

const entityIdSchema = z.string().uuid();

export function isAttachmentEntity(value: string): value is AttachmentEntity {
  return attachmentEntityEnum.enumValues.includes(value as AttachmentEntity);
}

async function attachmentModule(
  ctx: WorkspaceContext,
  entityType: AttachmentEntity,
  entityId: string
): Promise<AppModule | null> {
  const workspaceId = ctx.workspace.id;
  switch (entityType) {
    case "contact": {
      const row = await db.query.contacts.findFirst({
        where: and(eq(contacts.id, entityId), eq(contacts.workspaceId, workspaceId)),
        columns: { id: true },
      });
      return row ? "contacts" : null;
    }
    case "order": {
      const row = await db.query.orders.findFirst({
        where: and(eq(orders.id, entityId), eq(orders.workspaceId, workspaceId)),
        columns: { direction: true },
      });
      return row?.direction === "issued"
        ? "orders_issued"
        : row?.direction === "received"
          ? "orders_received"
          : null;
    }
    case "invoice": {
      const row = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, entityId), eq(invoices.workspaceId, workspaceId)),
        columns: { direction: true },
      });
      return row?.direction === "issued"
        ? "invoices_issued"
        : row?.direction === "received"
          ? "invoices_received"
          : null;
    }
    case "ddt": {
      const row = await db.query.ddts.findFirst({
        where: and(eq(ddts.id, entityId), eq(ddts.workspaceId, workspaceId)),
        columns: { id: true },
      });
      return row ? "ddt" : null;
    }
    case "warehouse_item": {
      const row = await db.query.warehouseItems.findFirst({
        where: and(
          eq(warehouseItems.id, entityId),
          eq(warehouseItems.workspaceId, workspaceId)
        ),
        columns: { id: true },
      });
      return row ? "warehouse" : null;
    }
    case "stock_movement": {
      const row = await db.query.stockMovements.findFirst({
        where: and(
          eq(stockMovements.id, entityId),
          eq(stockMovements.workspaceId, workspaceId)
        ),
        columns: { id: true },
      });
      return row ? "warehouse" : null;
    }
    case "job": {
      const row = await db.query.jobs.findFirst({
        where: and(eq(jobs.id, entityId), eq(jobs.workspaceId, workspaceId)),
        columns: { id: true },
      });
      return row ? "jobs" : null;
    }
    case "project": {
      const row = await db.query.projects.findFirst({
        where: and(eq(projects.id, entityId), eq(projects.workspaceId, workspaceId)),
        columns: { id: true },
      });
      return row ? "projects" : null;
    }
    case "project_task": {
      const [row] = await db
        .select({ id: projectTasks.id })
        .from(projectTasks)
        .innerJoin(projects, eq(projects.id, projectTasks.projectId))
        .where(
          and(eq(projectTasks.id, entityId), eq(projects.workspaceId, workspaceId))
        );
      return row ? "projects" : null;
    }
    case "employee": {
      const row = await db.query.employees.findFirst({
        where: and(eq(employees.id, entityId), eq(employees.workspaceId, workspaceId)),
        columns: { id: true },
      });
      return row ? "hr" : null;
    }
    case "leave_request": {
      const row = await db.query.leaveRequests.findFirst({
        where: and(
          eq(leaveRequests.id, entityId),
          eq(leaveRequests.workspaceId, workspaceId)
        ),
        columns: { id: true },
      });
      return row ? "hr" : null;
    }
    case "work_log": {
      const row = await db.query.workLogs.findFirst({
        where: and(eq(workLogs.id, entityId), eq(workLogs.workspaceId, workspaceId)),
        columns: { id: true },
      });
      return row ? "hr" : null;
    }
    case "iso_document": {
      const row = await db.query.isoDocuments.findFirst({
        where: and(
          eq(isoDocuments.id, entityId),
          eq(isoDocuments.workspaceId, workspaceId)
        ),
        columns: { id: true },
      });
      return row ? "iso" : null;
    }
    case "workspace":
      return entityId === workspaceId ? "settings" : null;
  }
}

export async function authorizeAttachmentEntity(
  entityType: AttachmentEntity,
  entityId: string,
  action: PermissionAction
): Promise<WorkspaceContext> {
  if (!isAttachmentEntity(entityType) || !entityIdSchema.safeParse(entityId).success) {
    throw new Error("Dati allegato non validi.");
  }
  const ctx = await getWorkspaceContext();
  if (!ctx) throw new Error("Non autenticato.");
  const appModule = await attachmentModule(ctx, entityType, entityId);
  if (!appModule || !can(ctx, appModule, action)) {
    throw new Error("Allegato non disponibile o permesso negato.");
  }
  return ctx;
}
