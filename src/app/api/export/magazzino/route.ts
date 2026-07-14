import { can, getWorkspaceContext } from "@/server/workspace";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { buildListPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { listItems, type ItemListRow } from "@/features/warehouse/queries";
import { formatCurrency, formatNumber } from "@/lib/format";

/** Export elenco articoli di magazzino: ?format=pdf|xlsx */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";

  const ctx = await getWorkspaceContext();
  if (!ctx || !can(ctx, "warehouse", "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const rows = await listItems(ctx);
  const columns: ExportColumn<ItemListRow>[] = [
    { header: "SKU", value: (r) => r.sku, width: 18 },
    { header: "Nome", value: (r) => r.name, width: 32 },
    { header: "Categoria", value: (r) => r.category, width: 18 },
    {
      header: "Giacenza",
      value: (r) => `${formatNumber(r.quantity)} ${r.unit}`,
      width: 14,
    },
    {
      header: "Scorta min.",
      value: (r) => (r.minStock ? formatNumber(r.minStock) : ""),
      width: 12,
    },
    {
      header: "Sotto scorta",
      value: (r) => (r.belowMinStock ? "Sì" : ""),
      width: 12,
    },
    { header: "Prezzo", value: (r) => formatCurrency(r.unitPrice), width: 12 },
    { header: "Fornitore", value: (r) => r.supplierName, width: 26 },
  ];

  if (format === "xlsx") {
    return fileResponse(
      await buildXlsx("Magazzino", columns, rows),
      "magazzino-articoli",
      "xlsx"
    );
  }
  return fileResponse(
    await buildListPdf({
      title: "Articoli di magazzino",
      subtitle: ctx.workspace.name,
      columns,
      rows,
      landscape: true,
    }),
    "magazzino-articoli",
    "pdf"
  );
}
