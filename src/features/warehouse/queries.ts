import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  contacts,
  jobs,
  stockMovements,
  warehouseItems,
} from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/workspace";
import type { EntityOption } from "@/components/shared";

export async function listItems(ctx: WorkspaceContext) {
  const rows = await db
    .select({
      id: warehouseItems.id,
      sku: warehouseItems.sku,
      name: warehouseItems.name,
      category: warehouseItems.category,
      unit: warehouseItems.unit,
      location: warehouseItems.location,
      quantity: warehouseItems.quantity,
      minStock: warehouseItems.minStock,
      unitPrice: warehouseItems.unitPrice,
      supplierName: contacts.businessName,
    })
    .from(warehouseItems)
    .leftJoin(contacts, eq(contacts.id, warehouseItems.supplierId))
    .where(
      and(
        eq(warehouseItems.workspaceId, ctx.workspace.id),
        eq(warehouseItems.isArchived, false)
      )
    )
    .orderBy(asc(warehouseItems.name));

  return rows.map((row) => ({
    ...row,
    belowMinStock:
      row.minStock !== null && Number(row.quantity) < Number(row.minStock),
  }));
}

export type ItemListRow = Awaited<ReturnType<typeof listItems>>[number];

export async function getItem(ctx: WorkspaceContext, id: string) {
  const item = await db.query.warehouseItems.findFirst({
    where: and(
      eq(warehouseItems.id, id),
      eq(warehouseItems.workspaceId, ctx.workspace.id)
    ),
  });
  if (!item) return null;

  const [supplier, movements] = await Promise.all([
    item.supplierId
      ? db.query.contacts.findFirst({ where: eq(contacts.id, item.supplierId) })
      : Promise.resolve(null),
    db
      .select({
        id: stockMovements.id,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        date: stockMovements.date,
        reason: stockMovements.reason,
        contactName: contacts.businessName,
        jobCode: jobs.code,
        ddtId: stockMovements.ddtId,
      })
      .from(stockMovements)
      .leftJoin(contacts, eq(contacts.id, stockMovements.contactId))
      .leftJoin(jobs, eq(jobs.id, stockMovements.jobId))
      .where(eq(stockMovements.itemId, id))
      .orderBy(desc(stockMovements.date), desc(stockMovements.createdAt))
      .limit(30),
  ]);

  return { item, supplier: supplier ?? null, movements };
}

export type ItemDetail = NonNullable<Awaited<ReturnType<typeof getItem>>>;

export async function listMovements(ctx: WorkspaceContext) {
  return db
    .select({
      id: stockMovements.id,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      date: stockMovements.date,
      reason: stockMovements.reason,
      itemId: stockMovements.itemId,
      itemSku: warehouseItems.sku,
      itemName: warehouseItems.name,
      itemUnit: warehouseItems.unit,
      contactName: contacts.businessName,
      jobCode: jobs.code,
      ddtId: stockMovements.ddtId,
    })
    .from(stockMovements)
    .innerJoin(warehouseItems, eq(warehouseItems.id, stockMovements.itemId))
    .leftJoin(contacts, eq(contacts.id, stockMovements.contactId))
    .leftJoin(jobs, eq(jobs.id, stockMovements.jobId))
    .where(eq(stockMovements.workspaceId, ctx.workspace.id))
    .orderBy(desc(stockMovements.date), desc(stockMovements.createdAt));
}

export type MovementListRow = Awaited<ReturnType<typeof listMovements>>[number];

export async function itemOptions(ctx: WorkspaceContext): Promise<EntityOption[]> {
  const rows = await db
    .select({
      id: warehouseItems.id,
      sku: warehouseItems.sku,
      name: warehouseItems.name,
      unit: warehouseItems.unit,
      quantity: warehouseItems.quantity,
    })
    .from(warehouseItems)
    .where(
      and(
        eq(warehouseItems.workspaceId, ctx.workspace.id),
        eq(warehouseItems.isArchived, false)
      )
    )
    .orderBy(asc(warehouseItems.name));

  return rows.map((r) => ({
    value: r.id,
    label: `${r.sku} — ${r.name}`,
    description: `Giacenza: ${r.quantity} ${r.unit}`,
  }));
}

/** Info articoli per precompilare le righe DDT (descrizione/unità). */
export async function itemInfos(ctx: WorkspaceContext) {
  return db
    .select({
      id: warehouseItems.id,
      sku: warehouseItems.sku,
      name: warehouseItems.name,
      unit: warehouseItems.unit,
    })
    .from(warehouseItems)
    .where(
      and(
        eq(warehouseItems.workspaceId, ctx.workspace.id),
        eq(warehouseItems.isArchived, false)
      )
    )
    .orderBy(asc(warehouseItems.name));
}

export type ItemInfo = Awaited<ReturnType<typeof itemInfos>>[number];
