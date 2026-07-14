import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { documentCounters } from "@/server/db/schema";

/**
 * Numerazione progressiva per documento: scope tipico
 * "order:issued", "invoice:received", "ddt:issued", "job".
 * L'upsert atomico evita numeri duplicati in concorrenza.
 */
export async function nextDocumentNumber(
  workspaceId: string,
  scope: string,
  prefix: string,
  year = new Date().getFullYear()
): Promise<{ code: string; year: number; number: number }> {
  const [row] = await db
    .insert(documentCounters)
    .values({ workspaceId, scope, year, lastNumber: 1 })
    .onConflictDoUpdate({
      target: [
        documentCounters.workspaceId,
        documentCounters.scope,
        documentCounters.year,
      ],
      set: { lastNumber: sql`${documentCounters.lastNumber} + 1` },
    })
    .returning({ lastNumber: documentCounters.lastNumber });

  const number = row.lastNumber;
  return {
    code: `${prefix}-${year}-${String(number).padStart(4, "0")}`,
    year,
    number,
  };
}
