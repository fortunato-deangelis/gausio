import { can, getWorkspaceContext } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { getOrder } from "@/features/orders/queries";
import { orderStatusLabel } from "@/features/orders/schema";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

/** Export PDF dettaglio ordine. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx) return new Response("Non autorizzato", { status: 403 });

  const data = await getOrder(ctx, id);
  if (!data) return new Response("Non trovato", { status: 404 });
  const { order, lines, contact, job } = data;

  const moduleName =
    order.direction === "issued"
      ? ("orders_issued" as const)
      : ("orders_received" as const);
  if (!can(ctx, moduleName, "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const buffer = await buildDetailPdf({
    title: `Ordine ${order.code}`,
    subtitle: ctx.workspace.name,
    sections: [
      {
        title: "Dati ordine",
        fields: [
          {
            label: order.direction === "issued" ? "Cliente" : "Fornitore",
            value: contact?.businessName,
          },
          { label: "Partita IVA", value: contact?.vatNumber },
          { label: "Data", value: formatDate(order.date) },
          { label: "Data prevista", value: formatDate(order.expectedDate) },
          { label: "Stato", value: orderStatusLabel(order.status) },
          {
            label: "Commessa",
            value: job ? `${job.code} — ${job.title}` : null,
          },
          { label: "Note", value: order.notes },
        ],
      },
      {
        title: "Righe",
        table: {
          headers: [
            "Descrizione",
            "Q.tà",
            "Unità",
            "Prezzo unit.",
            "IVA %",
            "Sconto %",
            "Totale",
          ],
          rows: lines.map((line) => [
            line.description,
            formatNumber(line.quantity),
            line.unit,
            formatCurrency(line.unitPrice),
            formatNumber(line.vatRate),
            formatNumber(line.discount),
            formatCurrency(line.total),
          ]),
        },
      },
      {
        title: "Totali",
        fields: [
          { label: "Imponibile", value: formatCurrency(order.subtotal) },
          { label: "IVA", value: formatCurrency(order.vatAmount) },
          { label: "Totale", value: formatCurrency(order.total) },
        ],
      },
    ],
  });

  return fileResponse(buffer, `ordine-${order.code}`, "pdf");
}
