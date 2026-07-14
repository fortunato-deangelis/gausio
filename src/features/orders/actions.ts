"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import {
  contacts,
  ddts,
  invoices,
  jobs,
  orderLines,
  orders,
} from "@/server/db/schema";
import { nextDocumentNumber } from "@/server/numbering";
import {
  can,
  getWorkspaceContext,
  requirePermission,
  type WorkspaceContext,
} from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { computeTotals } from "@/features/documents-shared/totals";
import { orderSchema, type OrderInput, type OrderStatus } from "./schema";

type OrderDirection = "issued" | "received";

function moduleFor(direction: OrderDirection) {
  return direction === "issued"
    ? ("orders_issued" as const)
    : ("orders_received" as const);
}

function listPaths(direction: OrderDirection): string {
  return direction === "issued" ? "/app/vendite/ordini" : "/app/acquisti/ordini";
}

async function assertRefs(
  ctx: WorkspaceContext,
  contactId: string,
  jobId: string | null | undefined
): Promise<void> {
  const contact = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.id, contactId),
      eq(contacts.workspaceId, ctx.workspace.id)
    ),
  });
  if (!contact) throw new Error("Contatto non valido.");
  if (jobId) {
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.workspaceId, ctx.workspace.id)),
    });
    if (!job) throw new Error("Commessa non valida.");
  }
}

export async function createOrder(
  direction: OrderDirection,
  input: OrderInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission(moduleFor(direction), "create");
    const parsed = orderSchema.parse(input);
    await assertRefs(ctx, parsed.contactId, parsed.jobId);

    const totals = computeTotals(parsed.lines);
    const { code, year, number } = await nextDocumentNumber(
      ctx.workspace.id,
      `order:${direction}`,
      direction === "issued" ? "ORD" : "ORA"
    );

    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(orders)
        .values({
          workspaceId: ctx.workspace.id,
          direction,
          code,
          year,
          number,
          contactId: parsed.contactId,
          jobId: parsed.jobId || null,
          date: parsed.date,
          expectedDate: parsed.expectedDate || null,
          status: parsed.status,
          currency: parsed.currency,
          subtotal: totals.subtotal.toFixed(2),
          vatAmount: totals.vatAmount.toFixed(2),
          total: totals.total.toFixed(2),
          notes: parsed.notes || null,
          createdBy: ctx.userId,
        })
        .returning({ id: orders.id });

      await tx.insert(orderLines).values(
        parsed.lines.map((line, index) => ({
          orderId: row.id,
          position: index,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit || "pz",
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
          discount: line.discount || "0",
          total: totals.lineTotals[index].toFixed(2),
        }))
      );
      return row.id;
    });

    revalidatePath(listPaths(direction));
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateOrder(
  id: string,
  input: OrderInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));
    const existing = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Ordine non trovato."));
    if (!can(ctx, moduleFor(existing.direction), "edit")) {
      return fail(new Error("Permesso negato per questa operazione."));
    }

    const parsed = orderSchema.parse(input);
    await assertRefs(ctx, parsed.contactId, parsed.jobId);
    const totals = computeTotals(parsed.lines);

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          contactId: parsed.contactId,
          jobId: parsed.jobId || null,
          date: parsed.date,
          expectedDate: parsed.expectedDate || null,
          status: parsed.status,
          currency: parsed.currency,
          subtotal: totals.subtotal.toFixed(2),
          vatAmount: totals.vatAmount.toFixed(2),
          total: totals.total.toFixed(2),
          notes: parsed.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existing.id));

      await tx.delete(orderLines).where(eq(orderLines.orderId, existing.id));
      await tx.insert(orderLines).values(
        parsed.lines.map((line, index) => ({
          orderId: existing.id,
          position: index,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit || "pz",
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
          discount: line.discount || "0",
          total: totals.lineTotals[index].toFixed(2),
        }))
      );
    });

    revalidatePath(listPaths(existing.direction));
    revalidatePath(`${listPaths(existing.direction)}/${existing.id}`);
    return ok({ id: existing.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));
    const existing = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Ordine non trovato."));
    if (!can(ctx, moduleFor(existing.direction), "edit")) {
      return fail(new Error("Permesso negato per questa operazione."));
    }

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, existing.id));

    revalidatePath(listPaths(existing.direction));
    revalidatePath(`${listPaths(existing.direction)}/${existing.id}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteOrder(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));
    const existing = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Ordine non trovato."));
    if (!can(ctx, moduleFor(existing.direction), "delete")) {
      return fail(new Error("Permesso negato per questa operazione."));
    }

    const [linkedInvoice, linkedDdt] = await Promise.all([
      db.query.invoices.findFirst({
        where: eq(invoices.orderId, existing.id),
        columns: { id: true },
      }),
      db.query.ddts.findFirst({
        where: eq(ddts.orderId, existing.id),
        columns: { id: true },
      }),
    ]);
    if (linkedInvoice || linkedDdt) {
      return fail(
        new Error(
          "L'ordine è collegato a fatture o DDT: elimina o scollega prima quei documenti."
        )
      );
    }

    await db.delete(orders).where(eq(orders.id, existing.id));
    revalidatePath(listPaths(existing.direction));
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
