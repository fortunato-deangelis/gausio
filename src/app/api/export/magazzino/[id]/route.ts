import { can, getWorkspaceContext } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { getItem } from "@/features/warehouse/queries";
import { movementTypeLabel } from "@/features/warehouse/schema";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

/** Export PDF dettaglio articolo con ultimi movimenti. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx || !can(ctx, "warehouse", "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const data = await getItem(ctx, id);
  if (!data) return new Response("Non trovato", { status: 404 });
  const { item, supplier, movements } = data;

  const buffer = await buildDetailPdf({
    title: `Articolo ${item.sku}`,
    subtitle: ctx.workspace.name,
    sections: [
      {
        title: "Dati articolo",
        fields: [
          { label: "Nome", value: item.name },
          { label: "Categoria", value: item.category },
          { label: "Unità", value: item.unit },
          { label: "Ubicazione", value: item.location },
          {
            label: "Giacenza",
            value: `${formatNumber(item.quantity)} ${item.unit}`,
          },
          {
            label: "Scorta minima",
            value: item.minStock ? formatNumber(item.minStock) : null,
          },
          { label: "Costo unitario", value: formatCurrency(item.unitCost) },
          { label: "Prezzo di vendita", value: formatCurrency(item.unitPrice) },
          { label: "Fornitore abituale", value: supplier?.businessName },
          { label: "Descrizione", value: item.description },
        ],
      },
      {
        title: "Ultimi movimenti",
        table: {
          headers: ["Data", "Tipo", "Quantità", "Causale", "Riferimenti"],
          rows: movements.map((m) => [
            formatDate(m.date),
            movementTypeLabel(m.type),
            `${formatNumber(m.quantity)} ${item.unit}`,
            m.reason,
            [m.contactName, m.jobCode].filter(Boolean).join(" · "),
          ]),
        },
      },
    ],
  });

  return fileResponse(buffer, `articolo-${item.sku}`, "pdf");
}
