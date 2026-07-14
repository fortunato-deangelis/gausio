"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { isoDocumentRevisions, isoDocuments } from "@/server/db/schema";
import { assertSameWorkspace, requirePermission } from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isoDocumentSchema, type IsoDocumentInput } from "./schema";

/** Server action del modulo documentale ISO (permesso "iso"). */

const ISO_PATH = "/app/iso";

function documentValues(parsed: IsoDocumentInput) {
  return {
    code: parsed.code,
    title: parsed.title,
    standard: parsed.standard,
    type: parsed.type,
    status: parsed.status,
    content: parsed.content || null,
    issueDate: parsed.issueDate || null,
    reviewDate: parsed.reviewDate || null,
    ownerId: parsed.ownerId || null,
    notes: parsed.notes || null,
  };
}

export async function createIsoDocument(
  input: IsoDocumentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("iso", "create");
    const parsed = isoDocumentSchema.parse(input);

    const duplicate = await db.query.isoDocuments.findFirst({
      where: and(
        eq(isoDocuments.workspaceId, ctx.workspace.id),
        eq(isoDocuments.code, parsed.code)
      ),
    });
    if (duplicate) {
      return fail(new Error(`Esiste già un documento con codice ${parsed.code}.`));
    }

    const [row] = await db
      .insert(isoDocuments)
      .values({
        workspaceId: ctx.workspace.id,
        createdBy: ctx.userId,
        revision: 0,
        ...documentValues(parsed),
      })
      .returning({ id: isoDocuments.id });

    revalidatePath(ISO_PATH);
    return ok({ id: row.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateIsoDocument(
  id: string,
  input: IsoDocumentInput
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("iso", "edit");
    const parsed = isoDocumentSchema.parse(input);

    const existing = await db.query.isoDocuments.findFirst({
      where: eq(isoDocuments.id, id),
    });
    if (!existing) return fail(new Error("Documento non trovato."));
    assertSameWorkspace(ctx, existing.workspaceId);

    const contentChanged = (existing.content ?? "") !== (parsed.content ?? "");
    if (contentChanged && !parsed.changeDescription?.trim()) {
      return fail(
        new Error(
          "Descrivi la modifica al contenuto: verrà registrata nello storico revisioni."
        )
      );
    }

    await db.transaction(async (tx) => {
      if (contentChanged) {
        // Snapshot della revisione corrente prima di sovrascrivere.
        await tx.insert(isoDocumentRevisions).values({
          documentId: existing.id,
          revision: existing.revision,
          content: existing.content,
          changeDescription: parsed.changeDescription!.trim(),
          createdBy: ctx.userId,
        });
      }
      await tx
        .update(isoDocuments)
        .set({
          ...documentValues(parsed),
          revision: contentChanged ? existing.revision + 1 : existing.revision,
          updatedAt: new Date(),
        })
        .where(eq(isoDocuments.id, id));
    });

    revalidatePath(ISO_PATH);
    revalidatePath(`${ISO_PATH}/${id}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function approveIsoDocument(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("iso", "edit");
    const existing = await db.query.isoDocuments.findFirst({
      where: eq(isoDocuments.id, id),
    });
    if (!existing) return fail(new Error("Documento non trovato."));
    assertSameWorkspace(ctx, existing.workspaceId);
    if (existing.status === "approved") {
      return fail(new Error("Il documento è già approvato."));
    }

    await db
      .update(isoDocuments)
      .set({
        status: "approved",
        approvedBy: ctx.userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(isoDocuments.id, id));

    revalidatePath(ISO_PATH);
    revalidatePath(`${ISO_PATH}/${id}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function obsoleteIsoDocument(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("iso", "edit");
    const existing = await db.query.isoDocuments.findFirst({
      where: eq(isoDocuments.id, id),
    });
    if (!existing) return fail(new Error("Documento non trovato."));
    assertSameWorkspace(ctx, existing.workspaceId);

    await db
      .update(isoDocuments)
      .set({ status: "obsolete", updatedAt: new Date() })
      .where(eq(isoDocuments.id, id));

    revalidatePath(ISO_PATH);
    revalidatePath(`${ISO_PATH}/${id}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteIsoDocument(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("iso", "delete");
    const existing = await db.query.isoDocuments.findFirst({
      where: eq(isoDocuments.id, id),
    });
    if (!existing) return fail(new Error("Documento non trovato."));
    assertSameWorkspace(ctx, existing.workspaceId);

    await db.delete(isoDocuments).where(eq(isoDocuments.id, id));
    revalidatePath(ISO_PATH);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
