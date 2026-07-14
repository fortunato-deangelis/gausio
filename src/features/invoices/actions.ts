"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { contacts, invoiceLines, invoices, jobs, orders } from "@/server/db/schema";
import { nextDocumentNumber } from "@/server/numbering";
import {
  can,
  getWorkspaceContext,
  requirePermission,
  type WorkspaceContext,
} from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { computeTotals } from "@/features/documents-shared/totals";
import { invoiceSchema, type InvoiceInput, type InvoiceStatus } from "./schema";

type InvoiceDirection = "issued" | "received";

function moduleFor(direction: InvoiceDirection) {
  return direction === "issued"
    ? ("invoices_issued" as const)
    : ("invoices_received" as const);
}

function listPath(direction: InvoiceDirection): string {
  return direction === "issued" ? "/app/vendite/fatture" : "/app/acquisti/fatture";
}

async function assertRefs(
  ctx: WorkspaceContext,
  parsed: InvoiceInput
): Promise<void> {
  const contact = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.id, parsed.contactId),
      eq(contacts.workspaceId, ctx.workspace.id)
    ),
  });
  if (!contact) throw new Error("Contatto non valido.");
  if (parsed.jobId) {
    const job = await db.query.jobs.findFirst({
      where: and(
        eq(jobs.id, parsed.jobId),
        eq(jobs.workspaceId, ctx.workspace.id)
      ),
    });
    if (!job) throw new Error("Commessa non valida.");
  }
  if (parsed.orderId) {
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, parsed.orderId),
        eq(orders.workspaceId, ctx.workspace.id)
      ),
    });
    if (!order) throw new Error("Ordine non valido.");
  }
}

export async function createInvoice(
  direction: InvoiceDirection,
  input: InvoiceInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission(moduleFor(direction), "create");
    const parsed = invoiceSchema.parse(input);
    await assertRefs(ctx, parsed);

    const totals = computeTotals(parsed.lines);
    const { code, year, number } = await nextDocumentNumber(
      ctx.workspace.id,
      `invoice:${direction}`,
      direction === "issued" ? "FAT" : "FRC"
    );

    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(invoices)
        .values({
          workspaceId: ctx.workspace.id,
          direction,
          code,
          year,
          number,
          contactId: parsed.contactId,
          jobId: parsed.jobId || null,
          orderId: parsed.orderId || null,
          date: parsed.date,
          dueDate: parsed.dueDate || null,
          status: parsed.status,
          currency: parsed.currency,
          subtotal: totals.subtotal.toFixed(2),
          vatAmount: totals.vatAmount.toFixed(2),
          total: totals.total.toFixed(2),
          paymentMethod: parsed.paymentMethod || null,
          paymentTerms: parsed.paymentTerms || null,
          externalReference: parsed.externalReference || null,
          notes: parsed.notes || null,
          createdBy: ctx.userId,
        })
        .returning({ id: invoices.id });

      await tx.insert(invoiceLines).values(
        parsed.lines.map((line, index) => ({
          invoiceId: row.id,
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

    revalidatePath(listPath(direction));
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));
    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Fattura non trovata."));
    if (!can(ctx, moduleFor(existing.direction), "edit")) {
      return fail(new Error("Permesso negato per questa operazione."));
    }

    const parsed = invoiceSchema.parse(input);
    await assertRefs(ctx, parsed);
    const totals = computeTotals(parsed.lines);

    await db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({
          contactId: parsed.contactId,
          jobId: parsed.jobId || null,
          orderId: parsed.orderId || null,
          date: parsed.date,
          dueDate: parsed.dueDate || null,
          status: parsed.status,
          currency: parsed.currency,
          subtotal: totals.subtotal.toFixed(2),
          vatAmount: totals.vatAmount.toFixed(2),
          total: totals.total.toFixed(2),
          paymentMethod: parsed.paymentMethod || null,
          paymentTerms: parsed.paymentTerms || null,
          externalReference: parsed.externalReference || null,
          notes: parsed.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, existing.id));

      await tx.delete(invoiceLines).where(eq(invoiceLines.invoiceId, existing.id));
      await tx.insert(invoiceLines).values(
        parsed.lines.map((line, index) => ({
          invoiceId: existing.id,
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

    revalidatePath(listPath(existing.direction));
    revalidatePath(`${listPath(existing.direction)}/${existing.id}`);
    return ok({ id: existing.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));
    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Fattura non trovata."));
    if (!can(ctx, moduleFor(existing.direction), "edit")) {
      return fail(new Error("Permesso negato per questa operazione."));
    }

    await db
      .update(invoices)
      .set({
        status,
        paidAt: status === "paid" ? new Date().toISOString().slice(0, 10) : null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, existing.id));

    revalidatePath(listPath(existing.direction));
    revalidatePath(`${listPath(existing.direction)}/${existing.id}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/** Segna la fattura come pagata alla data odierna. */
export async function markInvoiceAsPaid(
  id: string
): Promise<ActionResult<undefined>> {
  return updateInvoiceStatus(id, "paid");
}

export async function deleteInvoice(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));
    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Fattura non trovata."));
    if (!can(ctx, moduleFor(existing.direction), "delete")) {
      return fail(new Error("Permesso negato per questa operazione."));
    }

    await db.delete(invoices).where(eq(invoices.id, existing.id));
    revalidatePath(listPath(existing.direction));
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
