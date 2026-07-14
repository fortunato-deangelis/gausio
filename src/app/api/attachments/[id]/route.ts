import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { attachments } from "@/server/db/schema";
import { getWorkspaceContext } from "@/server/workspace";

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

  const root = path.resolve(
    process.cwd(),
    process.env.UPLOADS_DIR ?? "storage/uploads"
  );
  try {
    const data = await readFile(path.join(root, row.storagePath));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": row.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          row.fileName
        )}"`,
      },
    });
  } catch {
    return new Response("File non disponibile", { status: 404 });
  }
}
