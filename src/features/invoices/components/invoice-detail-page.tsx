import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AppCard,
  DetailList,
  ExportMenu,
  PageHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared";
import { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";
import { can, requireWorkspace } from "@/server/workspace";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { contactOptions, jobOptions } from "@/features/documents-shared/queries";
import { computeTotals } from "@/features/documents-shared/totals";
import { getInvoice, type InvoiceDirection } from "../queries";
import {
  invoiceStatusLabel,
  invoiceStatusTone,
  type InvoiceInput,
} from "../schema";
import { InvoiceDetailActions } from "./invoice-detail-actions";

/** Pagina dettaglio fattura (server), condivisa tra vendite e acquisti. */
export async function InvoiceDetailPage({
  direction,
  id,
}: Readonly<{ direction: InvoiceDirection; id: string }>) {
  const ctx = await requireWorkspace();
  const moduleName =
    direction === "issued"
      ? ("invoices_issued" as const)
      : ("invoices_received" as const);
  if (!can(ctx, moduleName, "view")) redirect("/app");

  const data = await getInvoice(ctx, id);
  if (!data || data.invoice.direction !== direction) notFound();
  const { invoice, lines, contact, job, order } = data;

  const basePath =
    direction === "issued" ? "/app/vendite/fatture" : "/app/acquisti/fatture";
  const orderPath =
    direction === "issued" ? "/app/vendite/ordini" : "/app/acquisti/ordini";

  const initialValues: InvoiceInput = {
    contactId: invoice.contactId,
    jobId: invoice.jobId,
    orderId: invoice.orderId,
    date: invoice.date,
    dueDate: invoice.dueDate ?? "",
    status: invoice.status,
    currency: invoice.currency,
    paymentMethod: invoice.paymentMethod ?? "",
    paymentTerms: invoice.paymentTerms ?? "",
    externalReference: invoice.externalReference ?? "",
    notes: invoice.notes ?? "",
    lines: lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unit: line.unit ?? "pz",
      unitPrice: line.unitPrice,
      vatRate: line.vatRate,
      discount: line.discount,
    })),
  };

  const [contactOpts, jobOpts] = await Promise.all([
    contactOptions(ctx, direction === "issued" ? "client" : "supplier"),
    jobOptions(ctx),
  ]);

  const vatBreakdown = computeTotals(lines).vatBreakdown;

  const issuerFields =
    direction === "issued"
      ? [
          { label: "Emittente", value: ctx.workspace.name },
          { label: "P.IVA emittente", value: ctx.workspace.vatNumber || "—" },
          { label: "Destinatario", value: contact?.businessName ?? "—" },
          { label: "P.IVA destinatario", value: contact?.vatNumber || "—" },
        ]
      : [
          { label: "Emittente", value: contact?.businessName ?? "—" },
          { label: "P.IVA emittente", value: contact?.vatNumber || "—" },
          { label: "Destinatario", value: ctx.workspace.name },
          { label: "P.IVA destinatario", value: ctx.workspace.vatNumber || "—" },
        ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Fattura ${invoice.code}`}
        description={contact?.businessName ?? undefined}
        backHref={basePath}
        backLabel={direction === "issued" ? "Fatture emesse" : "Fatture ricevute"}
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/fatture/${invoice.id}`} />
            <InvoiceDetailActions
              invoiceId={invoice.id}
              code={invoice.code}
              status={invoice.status}
              direction={direction}
              initialValues={initialValues}
              contactOptions={contactOpts}
              jobOptions={jobOpts}
              canEdit={can(ctx, moduleName, "edit")}
              canDelete={can(ctx, moduleName, "delete")}
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <AppCard title="Testata" className="lg:col-span-2">
          <DetailList
            items={[
              ...issuerFields,
              { label: "Data", value: formatDate(invoice.date) },
              { label: "Scadenza", value: formatDate(invoice.dueDate) },
              {
                label: "Stato",
                value: (
                  <StatusBadge
                    label={invoiceStatusLabel(invoice.status)}
                    tone={invoiceStatusTone(invoice.status)}
                  />
                ),
              },
              {
                label: "Pagata il",
                value: formatDate(invoice.paidAt),
              },
              {
                label: "Commessa",
                value: job ? (
                  <Link
                    href={`/app/commesse/${job.id}`}
                    className="text-primary hover:underline"
                  >
                    {job.code} — {job.title}
                  </Link>
                ) : (
                  "—"
                ),
              },
              {
                label: "Ordine collegato",
                value: order ? (
                  <Link
                    href={`${orderPath}/${order.id}`}
                    className="text-primary hover:underline"
                  >
                    {order.code}
                  </Link>
                ) : (
                  "—"
                ),
              },
              { label: "Metodo di pagamento", value: invoice.paymentMethod || "—" },
              {
                label: "Condizioni di pagamento",
                value: invoice.paymentTerms || "—",
              },
              ...(direction === "received"
                ? [
                    {
                      label: "Riferimento fornitore",
                      value: invoice.externalReference || "—",
                    },
                  ]
                : []),
              { label: "Note", value: invoice.notes || "—" },
            ]}
          />
        </AppCard>

        <AppCard title="Totali">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Imponibile</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(invoice.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">IVA</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(invoice.vatAmount)}
              </dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base">
              <dt className="font-semibold">Totale</dt>
              <dd className="font-semibold tabular-nums">
                {formatCurrency(invoice.total)}
              </dd>
            </div>
          </dl>
          {vatBreakdown.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Riepilogo IVA
              </h3>
              <dl className="flex flex-col gap-1 text-sm">
                {vatBreakdown.map((row) => (
                  <div key={row.rate} className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {formatNumber(row.rate)}% su {formatCurrency(row.base)}
                    </dt>
                    <dd className="tabular-nums">{formatCurrency(row.vat)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </AppCard>
      </div>

      <AppCard title="Righe">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="pl-6">Descrizione</TableHead>
              <TableHead className="text-right">Q.tà</TableHead>
              <TableHead>Unità</TableHead>
              <TableHead className="text-right">Prezzo unit.</TableHead>
              <TableHead className="text-right">IVA %</TableHead>
              <TableHead className="text-right">Sconto %</TableHead>
              <TableHead className="pr-6 text-right">Totale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="pl-6">{line.description}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(line.quantity)}
                </TableCell>
                <TableCell>{line.unit}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(line.unitPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(line.vatRate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(line.discount)}
                </TableCell>
                <TableCell className="pr-6 text-right font-medium tabular-nums">
                  {formatCurrency(line.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppCard>

      <AttachmentsPanel entityType="invoice" entityId={invoice.id} />
    </div>
  );
}
