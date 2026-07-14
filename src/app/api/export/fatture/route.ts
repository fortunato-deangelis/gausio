import { can, getWorkspaceContext } from "@/server/workspace";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { buildListPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { listInvoices, type InvoiceListRow } from "@/features/invoices/queries";
import { invoiceStatusLabel } from "@/features/invoices/schema";
import { formatCurrency, formatDate } from "@/lib/format";

/** Export elenco fatture: /api/export/fatture?direction=issued|received&format=pdf|xlsx */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const direction =
    url.searchParams.get("direction") === "received" ? "received" : "issued";
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";
  const moduleName =
    direction === "issued"
      ? ("invoices_issued" as const)
      : ("invoices_received" as const);

  const ctx = await getWorkspaceContext();
  if (!ctx || !can(ctx, moduleName, "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const rows = await listInvoices(ctx, direction);
  const columns: ExportColumn<InvoiceListRow>[] = [
    { header: "Numero", value: (r) => r.code, width: 16 },
    { header: "Data", value: (r) => formatDate(r.date), width: 12 },
    {
      header: direction === "issued" ? "Cliente" : "Fornitore",
      value: (r) => r.contactName,
      width: 32,
    },
    { header: "Scadenza", value: (r) => formatDate(r.dueDate), width: 12 },
    { header: "Stato", value: (r) => invoiceStatusLabel(r.status), width: 12 },
    { header: "Totale", value: (r) => formatCurrency(r.total), width: 14 },
  ];

  const title = direction === "issued" ? "Fatture emesse" : "Fatture ricevute";
  const filename = direction === "issued" ? "fatture-emesse" : "fatture-ricevute";

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
