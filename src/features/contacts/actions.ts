"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { contacts, ddts, invoices, jobs, orders } from "@/server/db/schema";
import { requirePermission } from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  contactSchema,
  quickCreateContactSchema,
  type ContactInput,
  type QuickCreateContactInput,
} from "./schema";

function toRow(parsed: ContactInput) {
  return {
    businessName: parsed.businessName,
    kind: parsed.kind,
    vatNumber: parsed.vatNumber || null,
    fiscalCode: parsed.fiscalCode || null,
    email: parsed.email || null,
    pec: parsed.pec || null,
    phone: parsed.phone || null,
    website: parsed.website || null,
    address: parsed.address || null,
    city: parsed.city || null,
    zipCode: parsed.zipCode || null,
    province: parsed.province || null,
    country: parsed.country || "IT",
    sdiCode: parsed.sdiCode || null,
    iban: parsed.iban || null,
    paymentTerms: parsed.paymentTerms || null,
    notes: parsed.notes || null,
    qualification: parsed.qualification ?? "not_qualified",
    qualificationDate: parsed.qualificationDate || null,
    qualificationExpiry: parsed.qualificationExpiry || null,
    qualificationNotes: parsed.qualificationNotes || null,
  };
}

export async function createContact(
  input: ContactInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("contacts", "create");
    const parsed = contactSchema.parse(input);
    const [row] = await db
      .insert(contacts)
      .values({
        ...toRow(parsed),
        workspaceId: ctx.workspace.id,
        createdBy: ctx.userId,
      })
      .returning({ id: contacts.id });
    revalidatePath("/app/contatti");
    return ok({ id: row.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateContact(
  id: string,
  input: ContactInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("contacts", "edit");
    const parsed = contactSchema.parse(input);
    const existing = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, id), eq(contacts.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Contatto non trovato."));
    await db
      .update(contacts)
      .set({ ...toRow(parsed), updatedAt: new Date() })
      .where(eq(contacts.id, id));
    revalidatePath("/app/contatti");
    revalidatePath(`/app/contatti/${id}`);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}

/** Creazione rapida inline dagli altri moduli: basta la ragione sociale. */
export async function quickCreateContact(
  input: QuickCreateContactInput
): Promise<ActionResult<{ id: string; businessName: string }>> {
  try {
    const ctx = await requirePermission("contacts", "create");
    const parsed = quickCreateContactSchema.parse(input);
    const [row] = await db
      .insert(contacts)
      .values({
        workspaceId: ctx.workspace.id,
        businessName: parsed.businessName,
        kind: parsed.kind,
        createdBy: ctx.userId,
      })
      .returning({ id: contacts.id, businessName: contacts.businessName });
    revalidatePath("/app/contatti");
    return ok(row);
  } catch (error) {
    return fail(error);
  }
}

export async function toggleArchiveContact(
  id: string
): Promise<ActionResult<{ isArchived: boolean }>> {
  try {
    const ctx = await requirePermission("contacts", "edit");
    const existing = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, id), eq(contacts.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Contatto non trovato."));
    const [row] = await db
      .update(contacts)
      .set({ isArchived: !existing.isArchived, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning({ isArchived: contacts.isArchived });
    revalidatePath("/app/contatti");
    revalidatePath(`/app/contatti/${id}`);
    return ok(row);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteContact(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("contacts", "delete");
    const existing = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, id), eq(contacts.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("Contatto non trovato."));

    const [linkedJob, linkedOrder, linkedInvoice, linkedDdt] =
      await Promise.all([
        db.query.jobs.findFirst({ where: eq(jobs.clientId, id) }),
        db.query.orders.findFirst({ where: eq(orders.contactId, id) }),
        db.query.invoices.findFirst({ where: eq(invoices.contactId, id) }),
        db.query.ddts.findFirst({ where: eq(ddts.contactId, id) }),
      ]);
    if (linkedJob || linkedOrder || linkedInvoice || linkedDdt) {
      return fail(
        new Error(
          "Il contatto ha documenti collegati (commesse, ordini, fatture o DDT): archivialo invece di eliminarlo."
        )
      );
    }

    await db.delete(contacts).where(eq(contacts.id, id));
    revalidatePath("/app/contatti");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
