import { can, getWorkspaceContext } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { getInvoice } from "@/features/invoices/queries";
import { invoiceStatusLabel } from "@/features/invoices/schema";
import { computeTotals } from "@/features/documents-shared/totals";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

/** Export PDF dettaglio fattura in formato documento fiscale. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx) return new Response("Non autorizzato", { status: 403 });

  const data = await getInvoice(ctx, id);
  if (!data) return new Response("Non trovato", { status: 404 });
  const { invoice, lines, contact, job } = data;

  const moduleName =
    invoice.direction === "issued"
      ? ("invoices_issued" as const)
      : ("invoices_received" as const);
  if (!can(ctx, moduleName, "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const workspaceAddress = [
    ctx.workspace.address,
    [ctx.workspace.zipCode, ctx.workspace.city, ctx.workspace.province]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  const contactAddress = [
    contact?.address,
    [contact?.zipCode, contact?.city, contact?.province]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const issuer =
    invoice.direction === "issued"
      ? {
          name: ctx.workspace.name,
          vat: ctx.workspace.vatNumber,
          address: workspaceAddress,
        }
      : {
          name: contact?.businessName ?? "—",
          vat: contact?.vatNumber,
          address: contactAddress,
        };
  const recipient =
    invoice.direction === "issued"
      ? {
          name: contact?.businessName ?? "—",
          vat: contact?.vatNumber,
          address: contactAddress,
        }
      : {
          name: ctx.workspace.name,
          vat: ctx.workspace.vatNumber,
          address: workspaceAddress,
        };

  const vatBreakdown = computeTotals(lines).vatBreakdown;

  const buffer = await buildDetailPdf({
    title: `Fattura ${invoice.code}`,
    subtitle: `${issuer.name} — ${formatDate(invoice.date)}`,
    sections: [
      {
        title: "Emittente",
        fields: [
          { label: "Ragione sociale", value: issuer.name },
          { label: "Partita IVA", value: issuer.vat },
          { label: "Indirizzo", value: issuer.address },
        ],
      },
      {
        title: "Destinatario",
        fields: [
          { label: "Ragione sociale", value: recipient.name },
          { label: "Partita IVA", value: recipient.vat },
          { label: "Indirizzo", value: recipient.address },
        ],
      },
      {
        title: "Dati documento",
        fields: [
          { label: "Numero", value: invoice.code },
          { label: "Data", value: formatDate(invoice.date) },
          { label: "Scadenza", value: formatDate(invoice.dueDate) },
          { label: "Stato", value: invoiceStatusLabel(invoice.status) },
          {
            label: "Commessa",
            value: job ? `${job.code} — ${job.title}` : null,
          },
          {
            label: "Riferimento fornitore",
            value: invoice.externalReference,
          },
        ],
      },
      {
        title: "Righe",
        table: {
          headers: [
            "Descrizione",
            "Q.tà",
            "Prezzo unit.",
            "IVA %",
            "Sconto %",
            "Totale",
          ],
          rows: lines.map((line) => [
            line.description,
            `${formatNumber(line.quantity)} ${line.unit ?? ""}`,
            formatCurrency(line.unitPrice),
            formatNumber(line.vatRate),
            formatNumber(line.discount),
            formatCurrency(line.total),
          ]),
        },
      },
      {
        title: "Riepilogo IVA",
        table: {
          headers: ["Aliquota", "Imponibile", "Imposta"],
          rows: vatBreakdown.map((row) => [
            `${formatNumber(row.rate)}%`,
            formatCurrency(row.base),
            formatCurrency(row.vat),
          ]),
        },
      },
      {
        title: "Totali e pagamento",
        fields: [
          { label: "Imponibile", value: formatCurrency(invoice.subtotal) },
          { label: "IVA", value: formatCurrency(invoice.vatAmount) },
          { label: "Totale documento", value: formatCurrency(invoice.total) },
          { label: "Metodo di pagamento", value: invoice.paymentMethod },
          { label: "Condizioni", value: invoice.paymentTerms },
          { label: "Pagata il", value: formatDate(invoice.paidAt) },
        ],
      },
      ...(invoice.notes ? [{ title: "Note", text: invoice.notes }] : []),
    ],
  });

  return fileResponse(buffer, `fattura-${invoice.code}`, "pdf");
}
