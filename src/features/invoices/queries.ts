import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { contacts, invoiceLines, invoices, jobs, orders } from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/workspace";

export type InvoiceDirection = "issued" | "received";

export async function listInvoices(
  ctx: WorkspaceContext,
  direction: InvoiceDirection
) {
  return db
    .select({
      id: invoices.id,
      code: invoices.code,
      date: invoices.date,
      dueDate: invoices.dueDate,
      status: invoices.status,
      total: invoices.total,
      currency: invoices.currency,
      contactName: contacts.businessName,
      jobCode: jobs.code,
      externalReference: invoices.externalReference,
    })
    .from(invoices)
    .leftJoin(contacts, eq(contacts.id, invoices.contactId))
    .leftJoin(jobs, eq(jobs.id, invoices.jobId))
    .where(
      and(
        eq(invoices.workspaceId, ctx.workspace.id),
        eq(invoices.direction, direction)
      )
    )
    .orderBy(desc(invoices.year), desc(invoices.number));
}

export type InvoiceListRow = Awaited<ReturnType<typeof listInvoices>>[number];

export async function getInvoice(ctx: WorkspaceContext, id: string) {
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.workspaceId, ctx.workspace.id)),
  });
  if (!invoice) return null;

  const [lines, contact, job, order] = await Promise.all([
    db.query.invoiceLines.findMany({
      where: eq(invoiceLines.invoiceId, invoice.id),
      orderBy: asc(invoiceLines.position),
    }),
    db.query.contacts.findFirst({ where: eq(contacts.id, invoice.contactId) }),
    invoice.jobId
      ? db.query.jobs.findFirst({ where: eq(jobs.id, invoice.jobId) })
      : Promise.resolve(null),
    invoice.orderId
      ? db.query.orders.findFirst({ where: eq(orders.id, invoice.orderId) })
      : Promise.resolve(null),
  ]);

  return {
    invoice,
    lines,
    contact: contact ?? null,
    job: job ?? null,
    order: order ?? null,
  };
}

export type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;
