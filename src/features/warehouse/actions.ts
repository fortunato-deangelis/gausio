"use server";

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import {
  contacts,
  jobs,
  stockMovements,
  warehouseItems,
} from "@/server/db/schema";
import { requirePermission, type WorkspaceContext } from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  itemSchema,
  movementSchema,
  type ItemInput,
  type MovementInput,
} from "./schema";

function generateSku(name: string): string {
  const base = name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
  return `${base || "ART"}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

async function assertItemRefs(
  ctx: WorkspaceContext,
  supplierId: string | null | undefined
): Promise<void> {
  if (!supplierId) return;
  const supplier = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.id, supplierId),
      eq(contacts.workspaceId, ctx.workspace.id)
    ),
  });
  if (!supplier) throw new Error("Fornitore non valido.");
}

export async function createItem(
  input: ItemInput
): Promise<ActionResult<{ id: string; sku: string; name: string }>> {
  try {
    const ctx = await requirePermission("warehouse", "create");
    const parsed = itemSchema.parse(input);
    await assertItemRefs(ctx, parsed.supplierId);
    const sku = parsed.sku?.trim() || generateSku(parsed.name);

    const [row] = await db
      .insert(warehouseItems)
      .values({
        workspaceId: ctx.workspace.id,
        sku,
        name: parsed.name,
        description: parsed.description || null,
        category: parsed.category || null,
        unit: parsed.unit,
        location: parsed.location || null,
        minStock: parsed.minStock || null,
        unitCost: parsed.unitCost || null,
        unitPrice: parsed.unitPrice || null,
        supplierId: parsed.supplierId || null,
        createdBy: ctx.userId,
      })
      .returning({ id: warehouseItems.id, sku: warehouseItems.sku });

    revalidatePath("/app/magazzino");
    return ok({ id: row.id, sku: row.sku, name: parsed.name });
  } catch (error) {
    return fail(error);
  }
}

/** Creazione rapida articolo dal quick-create (es. righe DDT). */
export async function quickCreateItem(input: {
  name: string;
}): Promise<ActionResult<{ id: string; sku: string; name: string }>> {
  return createItem({ name: input.name, unit: "pz" });
}

export async function updateItem(
  id: string,
  input: ItemInput
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("warehouse", "edit");
    const parsed = itemSchema.parse(input);
    const existing = await db.query.warehouseItems.findFirst({
      where: and(
        eq(warehouseItems.id, id),
        eq(warehouseItems.workspaceId, ctx.workspace.id)
      ),
    });
    if (!existing) return fail(new Error("Articolo non trovato."));
    await assertItemRefs(ctx, parsed.supplierId);

    await db
      .update(warehouseItems)
      .set({
        sku: parsed.sku?.trim() || existing.sku,
        name: parsed.name,
        description: parsed.description || null,
        category: parsed.category || null,
        unit: parsed.unit,
        location: parsed.location || null,
        minStock: parsed.minStock || null,
        unitCost: parsed.unitCost || null,
        unitPrice: parsed.unitPrice || null,
        supplierId: parsed.supplierId || null,
        updatedAt: new Date(),
      })
      .where(eq(warehouseItems.id, existing.id));

    revalidatePath("/app/magazzino");
    revalidatePath(`/app/magazzino/${existing.id}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteItem(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("warehouse", "delete");
    const existing = await db.query.warehouseItems.findFirst({
      where: and(
        eq(warehouseItems.id, id),
        eq(warehouseItems.workspaceId, ctx.workspace.id)
      ),
    });
    if (!existing) return fail(new Error("Articolo non trovato."));

    const movement = await db.query.stockMovements.findFirst({
      where: eq(stockMovements.itemId, existing.id),
    });
    if (movement) {
      return fail(
        new Error(
          "L'articolo ha movimenti di magazzino: non può essere eliminato."
        )
      );
    }

    await db.delete(warehouseItems).where(eq(warehouseItems.id, existing.id));
    revalidatePath("/app/magazzino");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

async function assertMovementRefs(
  ctx: WorkspaceContext,
  parsed: MovementInput
): Promise<void> {
  if (parsed.contactId) {
    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, parsed.contactId),
        eq(contacts.workspaceId, ctx.workspace.id)
      ),
    });
    if (!contact) throw new Error("Contatto non valido.");
  }
  if (parsed.jobId) {
    const job = await db.query.jobs.findFirst({
      where: and(
        eq(jobs.id, parsed.jobId),
        eq(jobs.workspaceId, ctx.workspace.id)
      ),
    });
    if (!job) throw new Error("Commessa non valida.");
  }
}

/**
 * Registra un movimento e aggiorna la giacenza dell'articolo:
 * carico = +q, scarico = −q (con controllo scorta), rettifica = imposta a q.
 */
export async function createMovement(
  input: MovementInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("warehouse", "create");
    const parsed = movementSchema.parse(input);
    await assertMovementRefs(ctx, parsed);

    const id = await db.transaction(async (tx) => {
      const item = await tx.query.warehouseItems.findFirst({
        where: and(
          eq(warehouseItems.id, parsed.itemId),
          eq(warehouseItems.workspaceId, ctx.workspace.id)
        ),
      });
      if (!item) throw new Error("Articolo non trovato.");

      const qty = Number(parsed.quantity);
      if (parsed.type === "out" && Number(item.quantity) < qty) {
        throw new Error(
          `Scorta insufficiente per "${item.name}": disponibili ${item.quantity} ${item.unit}.`
        );
      }

      const [row] = await tx
        .insert(stockMovements)
        .values({
          workspaceId: ctx.workspace.id,
          itemId: item.id,
          type: parsed.type,
          quantity: parsed.quantity,
          date: parsed.date,
          reason: parsed.reason || null,
          contactId: parsed.contactId || null,
          jobId: parsed.jobId || null,
          createdBy: ctx.userId,
        })
        .returning({ id: stockMovements.id });

      if (parsed.type === "adjustment") {
        await tx
          .update(warehouseItems)
          .set({ quantity: parsed.quantity, updatedAt: new Date() })
          .where(eq(warehouseItems.id, item.id));
      } else {
        const delta = parsed.type === "in" ? parsed.quantity : `-${parsed.quantity}`;
        const updated = await tx
          .update(warehouseItems)
          .set({
            quantity: sql`${warehouseItems.quantity} + ${delta}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(warehouseItems.id, item.id),
              eq(warehouseItems.workspaceId, ctx.workspace.id),
              parsed.type === "out"
                ? sql`${warehouseItems.quantity} >= ${parsed.quantity}`
                : undefined
            )
          )
          .returning({ id: warehouseItems.id });
        if (updated.length === 0) {
          throw new Error(
            `Scorta insufficiente per "${item.name}": il movimento non è stato registrato.`
          );
        }
      }
      return row.id;
    });

    revalidatePath("/app/magazzino");
    revalidatePath("/app/magazzino/movimenti");
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}

/** Elimina un movimento stornando la quantità (non ammesso per le rettifiche). */
export async function deleteMovement(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("warehouse", "delete");
    const existing = await db.query.stockMovements.findFirst({
      where: and(
        eq(stockMovements.id, id),
        eq(stockMovements.workspaceId, ctx.workspace.id)
      ),
    });
    if (!existing) return fail(new Error("Movimento non trovato."));
    if (existing.type === "adjustment") {
      return fail(
        new Error(
          "Le rettifiche non possono essere eliminate: registra una nuova rettifica."
        )
      );
    }

    await db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(stockMovements)
        .where(
          and(
            eq(stockMovements.id, existing.id),
            eq(stockMovements.workspaceId, ctx.workspace.id)
          )
        )
        .returning({
          type: stockMovements.type,
          quantity: stockMovements.quantity,
          itemId: stockMovements.itemId,
        });
      if (!deleted) throw new Error("Movimento già eliminato.");
      const delta =
        deleted.type === "in" ? `-${deleted.quantity}` : deleted.quantity;
      await tx
        .update(warehouseItems)
        .set({
          quantity: sql`${warehouseItems.quantity} + ${delta}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(warehouseItems.id, deleted.itemId),
            eq(warehouseItems.workspaceId, ctx.workspace.id)
          )
        );
    });

    revalidatePath("/app/magazzino");
    revalidatePath("/app/magazzino/movimenti");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
