import { can, getWorkspaceContext } from "@/server/workspace";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { buildListPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import {
  listMovements,
  type MovementListRow,
} from "@/features/warehouse/queries";
import { movementTypeLabel } from "@/features/warehouse/schema";
import { formatDate, formatNumber } from "@/lib/format";

/** Export elenco movimenti di magazzino: ?format=pdf|xlsx */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";

  const ctx = await getWorkspaceContext();
  if (!ctx || !can(ctx, "warehouse", "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const rows = await listMovements(ctx);
  const columns: ExportColumn<MovementListRow>[] = [
    { header: "Data", value: (r) => formatDate(r.date), width: 12 },
    {
      header: "Articolo",
      value: (r) => `${r.itemSku} — ${r.itemName}`,
      width: 34,
    },
    { header: "Tipo", value: (r) => movementTypeLabel(r.type), width: 12 },
    {
      header: "Quantità",
      value: (r) => `${formatNumber(r.quantity)} ${r.itemUnit}`,
      width: 14,
    },
    { header: "Causale", value: (r) => r.reason, width: 24 },
    { header: "Contatto", value: (r) => r.contactName, width: 24 },
    { header: "Commessa", value: (r) => r.jobCode, width: 14 },
  ];

  if (format === "xlsx") {
    return fileResponse(
      await buildXlsx("Movimenti", columns, rows),
      "magazzino-movimenti",
      "xlsx"
    );
  }
  return fileResponse(
    await buildListPdf({
      title: "Movimenti di magazzino",
      subtitle: ctx.workspace.name,
      columns,
      rows,
      landscape: true,
    }),
    "magazzino-movimenti",
    "pdf"
  );
}
