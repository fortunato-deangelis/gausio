import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileOutput } from "lucide-react";
import {
  AppCard,
  Button,
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
import { getOrder, type OrderDirection } from "../queries";
import { orderStatusLabel, orderStatusTone, type OrderInput } from "../schema";
import { OrderDetailActions } from "./order-detail-actions";

/** Pagina dettaglio ordine (server), condivisa tra vendite e acquisti. */
export async function OrderDetailPage({
  direction,
  id,
}: Readonly<{ direction: OrderDirection; id: string }>) {
  const ctx = await requireWorkspace();
  const moduleName =
    direction === "issued" ? ("orders_issued" as const) : ("orders_received" as const);
  if (!can(ctx, moduleName, "view")) redirect("/app");

  const data = await getOrder(ctx, id);
  if (!data || data.order.direction !== direction) notFound();
  const { order, lines, contact, job } = data;

  const basePath =
    direction === "issued" ? "/app/vendite/ordini" : "/app/acquisti/ordini";
  const invoiceNewPath =
    direction === "issued"
      ? `/app/vendite/fatture/nuovo?daOrdine=${order.id}`
      : `/app/acquisti/fatture/nuovo?daOrdine=${order.id}`;

  const initialValues: OrderInput = {
    contactId: order.contactId,
    jobId: order.jobId,
    date: order.date,
    expectedDate: order.expectedDate ?? "",
    status: order.status,
    currency: order.currency,
    notes: order.notes ?? "",
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

  const canCreateInvoice =
    direction === "issued"
      ? can(ctx, "invoices_issued", "create")
      : can(ctx, "invoices_received", "create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Ordine ${order.code}`}
        description={contact?.businessName ?? undefined}
        backHref={basePath}
        backLabel={direction === "issued" ? "Ordini emessi" : "Ordini ricevuti"}
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/ordini/${order.id}`} />
            {canCreateInvoice && (
              <Button asChild variant="outline">
                <Link href={invoiceNewPath}>
                  <FileOutput className="size-4" />
                  Crea fattura da ordine
                </Link>
              </Button>
            )}
            <OrderDetailActions
              orderId={order.id}
              code={order.code}
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
        <AppCard title="Dati ordine" className="lg:col-span-2">
          <DetailList
            items={[
              { label: "Codice", value: order.code },
              {
                label: "Stato",
                value: (
                  <StatusBadge
                    label={orderStatusLabel(order.status)}
                    tone={orderStatusTone(order.status)}
                  />
                ),
              },
              {
                label: direction === "issued" ? "Cliente" : "Fornitore",
                value: contact ? (
                  <Link
                    href={`/app/contatti/${contact.id}`}
                    className="text-primary hover:underline"
                  >
                    {contact.businessName}
                  </Link>
                ) : (
                  "—"
                ),
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
              { label: "Data", value: formatDate(order.date) },
              { label: "Data prevista", value: formatDate(order.expectedDate) },
              { label: "Note", value: order.notes || "—" },
            ]}
          />
        </AppCard>

        <AppCard title="Totali">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Imponibile</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(order.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">IVA</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(order.vatAmount)}
              </dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base">
              <dt className="font-semibold">Totale</dt>
              <dd className="font-semibold tabular-nums">
                {formatCurrency(order.total)}
              </dd>
            </div>
          </dl>
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

      <AttachmentsPanel entityType="order" entityId={order.id} />
    </div>
  );
}
