import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { attachments } from "@/server/db/schema";
import { getWorkspaceContext } from "@/server/workspace";
import { authorizeAttachmentEntity } from "@/features/attachments/authorization";

/** Download di un allegato del workspace attivo. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx) return new Response("Non autorizzato", { status: 401 });

  const row = await db.query.attachments.findFirst({
    where: and(
      eq(attachments.id, id),
      eq(attachments.workspaceId, ctx.workspace.id)
    ),
  });
  if (!row) return new Response("Non trovato", { status: 404 });
  try {
    await authorizeAttachmentEntity(row.entityType, row.entityId, "view");
  } catch {
    return new Response("Non trovato", { status: 404 });
  }

  const root = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.UPLOADS_DIR ?? "storage/uploads"
  );
  try {
    const absolutePath = path.normalize(
      path.join(/* turbopackIgnore: true */ root, row.storagePath)
    );
    if (!absolutePath.startsWith(`${root}${path.sep}`)) {
      return new Response("File non disponibile", { status: 404 });
    }
    const data = await readFile(absolutePath);
    const fallbackName =
      row.fileName
        .replace(/[^\x20-\x7e]+/g, "_")
        .replace(/["\\]/g, "_")
        .slice(0, 150) || "allegato";
    const mimeType = /^[\w.+-]+\/[\w.+-]+$/.test(row.mimeType)
      ? row.mimeType
      : "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(row.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("File non disponibile", { status: 404 });
  }
}
