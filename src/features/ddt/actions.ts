"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import {
  contacts,
  ddtLines,
  ddts,
  jobs,
  stockMovements,
  warehouseItems,
} from "@/server/db/schema";
import { nextDocumentNumber } from "@/server/numbering";
import {
  can,
  getWorkspaceContext,
  requirePermission,
  type WorkspaceContext,
} from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { ddtSchema, type DdtInput, type DdtStatus } from "./schema";

type DdtDirection = "issued" | "received";

const LIST_PATH = "/app/logistica/ddt";

async function assertRefs(
  ctx: WorkspaceContext,
  parsed: DdtInput
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
  const itemIds = parsed.lines
    .map((l) => l.itemId)
    .filter((v): v is string => Boolean(v));
  for (const itemId of itemIds) {
    const item = await db.query.warehouseItems.findFirst({
      where: and(
        eq(warehouseItems.id, itemId),
        eq(warehouseItems.workspaceId, ctx.workspace.id)
      ),
    });
    if (!item) throw new Error("Articolo di magazzino non valido.");
  }
}

export async function createDdt(
  direction: DdtDirection,
  input: DdtInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("ddt", "create");
    const parsed = ddtSchema.parse(input);
    await assertRefs(ctx, parsed);

    const { code, year, number } = await nextDocumentNumber(
      ctx.workspace.id,
      `ddt:${direction}`,
      direction === "issued" ? "DDT" : "DDR"
    );

    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(ddts)
        .values({
          workspaceId: ctx.workspace.id,
          direction,
          code,
          year,
          number,
          contactId: parsed.contactId,
          jobId: parsed.jobId || null,
          date: parsed.date,
          status: parsed.status,
          transportReason: parsed.transportReason,
          transportedBy: parsed.transportedBy,
          carrier: parsed.carrier || null,
          packagesCount: parsed.packagesCount ? Number(parsed.packagesCount) : null,
          weight: parsed.weight || null,
          destinationAddress: parsed.destinationAddress || null,
          notes: parsed.notes || null,
          createdBy: ctx.userId,
        })
        .returning({ id: ddts.id });

      await tx.insert(ddtLines).values(
        parsed.lines.map((line, index) => ({
          ddtId: row.id,
          position: index,
          itemId: line.itemId || null,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit || "pz",
        }))
      );
      return row.id;
    });

    revalidatePath(LIST_PATH);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateDdt(
  id: string,
  input: DdtInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("ddt", "edit");
    const existing = await db.query.ddts.findFirst({
      where: and(eq(ddts.id, id), eq(ddts.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("DDT non trovato."));

    const parsed = ddtSchema.parse(input);
    await assertRefs(ctx, parsed);

    await db.transaction(async (tx) => {
      await tx
        .update(ddts)
        .set({
          contactId: parsed.contactId,
          jobId: parsed.jobId || null,
          date: parsed.date,
          status: parsed.status,
          transportReason: parsed.transportReason,
          transportedBy: parsed.transportedBy,
          carrier: parsed.carrier || null,
          packagesCount: parsed.packagesCount ? Number(parsed.packagesCount) : null,
          weight: parsed.weight || null,
          destinationAddress: parsed.destinationAddress || null,
          notes: parsed.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(ddts.id, existing.id));

      await tx.delete(ddtLines).where(eq(ddtLines.ddtId, existing.id));
      await tx.insert(ddtLines).values(
        parsed.lines.map((line, index) => ({
          ddtId: existing.id,
          position: index,
          itemId: line.itemId || null,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit || "pz",
        }))
      );
    });

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${existing.id}`);
    return ok({ id: existing.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateDdtStatus(
  id: string,
  status: DdtStatus
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("ddt", "edit");
    const existing = await db.query.ddts.findFirst({
      where: and(eq(ddts.id, id), eq(ddts.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("DDT non trovato."));

    await db
      .update(ddts)
      .set({ status, updatedAt: new Date() })
      .where(eq(ddts.id, existing.id));

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${existing.id}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteDdt(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("ddt", "delete");
    const existing = await db.query.ddts.findFirst({
      where: and(eq(ddts.id, id), eq(ddts.workspaceId, ctx.workspace.id)),
    });
    if (!existing) return fail(new Error("DDT non trovato."));

    const movement = await db.query.stockMovements.findFirst({
      where: eq(stockMovements.ddtId, existing.id),
    });
    if (movement) {
      return fail(
        new Error(
          "Il DDT ha movimenti di magazzino collegati: eliminali prima dal magazzino."
        )
      );
    }

    await db.delete(ddts).where(eq(ddts.id, existing.id));
    revalidatePath(LIST_PATH);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Genera i movimenti di magazzino dalle righe del DDT collegate ad articoli:
 * DDT emesso → scarico, DDT ricevuto → carico. Operazione una tantum.
 */
export async function generateDdtMovements(
  id: string
): Promise<ActionResult<{ created: number }>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return fail(new Error("Non autenticato."));
    if (!can(ctx, "ddt", "edit") || !can(ctx, "warehouse", "create")) {
      return fail(
        new Error("Servono i permessi di modifica DDT e creazione magazzino.")
      );
    }

    const ddt = await db.query.ddts.findFirst({
      where: and(eq(ddts.id, id), eq(ddts.workspaceId, ctx.workspace.id)),
    });
    if (!ddt) return fail(new Error("DDT non trovato."));

    const lines = await db.query.ddtLines.findMany({
      where: eq(ddtLines.ddtId, ddt.id),
    });
    const linkedLines = lines.filter((l) => l.itemId);
    if (linkedLines.length === 0) {
      return fail(
        new Error("Nessuna riga del DDT è collegata a un articolo di magazzino.")
      );
    }

    const type = ddt.direction === "issued" ? ("out" as const) : ("in" as const);

    const created = await db.transaction(async (tx) => {
      // Serializza la generazione sul singolo DDT: due richieste concorrenti
      // non possono creare due volte gli stessi movimenti.
      await tx.execute(sql`select ${ddts.id} from ${ddts} where ${ddts.id} = ${ddt.id} for update`);
      const already = await tx.query.stockMovements.findFirst({
        where: eq(stockMovements.ddtId, ddt.id),
        columns: { id: true },
      });
      if (already) {
        throw new Error("I movimenti per questo DDT sono già stati generati.");
      }

      let count = 0;
      for (const line of linkedLines) {
        const item = await tx.query.warehouseItems.findFirst({
          where: and(
            eq(warehouseItems.id, line.itemId!),
            eq(warehouseItems.workspaceId, ctx.workspace.id)
          ),
        });
        if (!item) throw new Error("Articolo di magazzino non trovato.");
        if (type === "out" && Number(item.quantity) < Number(line.quantity)) {
          throw new Error(
            `Scorta insufficiente per "${item.name}": disponibili ${item.quantity} ${item.unit}.`
          );
        }

        await tx.insert(stockMovements).values({
          workspaceId: ctx.workspace.id,
          itemId: item.id,
          type,
          quantity: line.quantity,
          date: ddt.date,
          reason: `DDT ${ddt.code}`,
          contactId: ddt.contactId,
          jobId: ddt.jobId,
          ddtId: ddt.id,
          createdBy: ctx.userId,
        });

        const delta = type === "in" ? line.quantity : `-${line.quantity}`;
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
              type === "out"
                ? sql`${warehouseItems.quantity} >= ${line.quantity}`
                : undefined
            )
          )
          .returning({ id: warehouseItems.id });
        if (updated.length === 0) {
          throw new Error(
            `Scorta insufficiente per "${item.name}": i movimenti non sono stati generati.`
          );
        }
        count += 1;
      }
      return count;
    });

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${ddt.id}`);
    revalidatePath("/app/magazzino");
    revalidatePath("/app/magazzino/movimenti");
    return ok({ created });
  } catch (error) {
    return fail(error);
  }
}
