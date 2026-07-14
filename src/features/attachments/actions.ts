"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { attachments, type attachmentEntityEnum } from "@/server/db/schema";
import { getWorkspaceContext } from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";

/**
 * Allegati polimorfici: upload su disco (UPLOADS_DIR) + riga su DB.
 * Qualsiasi form di modulo può montare il pannello allegati.
 */

export type AttachmentEntity = (typeof attachmentEntityEnum.enumValues)[number];

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function uploadsRoot(): string {
  return path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "storage/uploads");
}

export type AttachmentDto = Readonly<{
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}>;

export async function listAttachments(
  entityType: AttachmentEntity,
  entityId: string
): Promise<AttachmentDto[]> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const rows = await db.query.attachments.findMany({
    where: and(
      eq(attachments.workspaceId, ctx.workspace.id),
      eq(attachments.entityType, entityType),
      eq(attachments.entityId, entityId)
    ),
    orderBy: desc(attachments.createdAt),
  });
  return rows.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function uploadAttachment(
  formData: FormData
): Promise<ActionResult<AttachmentDto>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));

    const file = formData.get("file");
    const entityType = String(formData.get("entityType")) as AttachmentEntity;
    const entityId = String(formData.get("entityId"));
    if (!(file instanceof File) || !entityType || !entityId) {
      return fail(new Error("Dati allegato non validi."));
    }
    if (file.size === 0 || file.size > MAX_SIZE_BYTES) {
      return fail(new Error("Il file deve essere tra 1 byte e 20 MB."));
    }

    const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
    const storagePath = path.join(
      ctx.workspace.id,
      `${randomUUID()}-${safeName}`
    );
    const absolute = path.join(uploadsRoot(), storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, Buffer.from(await file.arrayBuffer()));

    const [row] = await db
      .insert(attachments)
      .values({
        workspaceId: ctx.workspace.id,
        entityType,
        entityId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        storagePath,
        uploadedBy: ctx.userId,
      })
      .returning();

    revalidatePath("/app", "layout");
    return ok({
      id: row.id,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAttachment(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));

    const row = await db.query.attachments.findFirst({
      where: and(
        eq(attachments.id, id),
        eq(attachments.workspaceId, ctx.workspace.id)
      ),
    });
    if (!row) return fail(new Error("Allegato non trovato."));

    await db.delete(attachments).where(eq(attachments.id, row.id));
    await unlink(path.join(uploadsRoot(), row.storagePath)).catch(() => {
      // Il file potrebbe essere già stato rimosso: la riga DB è la fonte di verità.
    });

    revalidatePath("/app", "layout");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
