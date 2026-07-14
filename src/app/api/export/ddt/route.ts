import { can, getWorkspaceContext } from "@/server/workspace";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { buildListPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { listDdts, type DdtListRow } from "@/features/ddt/queries";
import { ddtStatusLabel } from "@/features/ddt/schema";
import { formatDate } from "@/lib/format";

/** Export elenco DDT: /api/export/ddt?direction=issued|received&format=pdf|xlsx */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const direction =
    url.searchParams.get("direction") === "received" ? "received" : "issued";
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";

  const ctx = await getWorkspaceContext();
  if (!ctx || !can(ctx, "ddt", "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const rows = await listDdts(ctx, direction);
  const columns: ExportColumn<DdtListRow>[] = [
    { header: "Numero", value: (r) => r.code, width: 16 },
    { header: "Data", value: (r) => formatDate(r.date), width: 12 },
    {
      header: direction === "issued" ? "Destinatario" : "Mittente",
      value: (r) => r.contactName,
      width: 32,
    },
    { header: "Causale", value: (r) => r.transportReason, width: 20 },
    { header: "Commessa", value: (r) => r.jobCode, width: 14 },
    { header: "Stato", value: (r) => ddtStatusLabel(r.status), width: 14 },
  ];

  const title = direction === "issued" ? "DDT emessi" : "DDT ricevuti";
  const filename = direction === "issued" ? "ddt-emessi" : "ddt-ricevuti";

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
