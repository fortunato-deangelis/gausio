import { can, getWorkspaceContext } from "@/server/workspace";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { buildListPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { listOrders, type OrderListRow } from "@/features/orders/queries";
import { orderStatusLabel } from "@/features/orders/schema";
import { formatCurrency, formatDate } from "@/lib/format";

/** Export elenco ordini: /api/export/ordini?direction=issued|received&format=pdf|xlsx */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const direction =
    url.searchParams.get("direction") === "received" ? "received" : "issued";
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";
  const moduleName =
    direction === "issued" ? ("orders_issued" as const) : ("orders_received" as const);

  const ctx = await getWorkspaceContext();
  if (!ctx || !can(ctx, moduleName, "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const rows = await listOrders(ctx, direction);
  const columns: ExportColumn<OrderListRow>[] = [
    { header: "Codice", value: (r) => r.code, width: 16 },
    { header: "Data", value: (r) => formatDate(r.date), width: 12 },
    {
      header: direction === "issued" ? "Cliente" : "Fornitore",
      value: (r) => r.contactName,
      width: 32,
    },
    { header: "Commessa", value: (r) => r.jobCode, width: 16 },
    { header: "Stato", value: (r) => orderStatusLabel(r.status), width: 14 },
    { header: "Totale", value: (r) => formatCurrency(r.total), width: 14 },
  ];

  const title = direction === "issued" ? "Ordini emessi" : "Ordini ricevuti";
  const filename = direction === "issued" ? "ordini-emessi" : "ordini-ricevuti";

  if (format === "xlsx") {
    return fileResponse(await buildXlsx(title, columns, rows), filename, "xlsx");
  }
  return fileResponse(
    await buildListPdf({
      title,
      subtitle: ctx.workspace.name,
      columns,
      rows,
      landscape: true,
    }),
    filename,
    "pdf"
  );
}
