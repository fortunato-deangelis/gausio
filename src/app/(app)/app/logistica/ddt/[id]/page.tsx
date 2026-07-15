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
import { formatDate, formatNumber } from "@/lib/format";
import { contactOptions, jobOptions } from "@/features/documents-shared/queries";
import { itemInfos, itemOptions } from "@/features/warehouse/queries";
import { getDdt } from "@/features/ddt/queries";
import {
  ddtStatusLabel,
  ddtStatusTone,
  type DdtInput,
} from "@/features/ddt/schema";
import { DdtDetailActions } from "@/features/ddt/components/ddt-detail-actions";

export const metadata = { title: "Dettaglio DDT" };

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const ctx = await requireWorkspace();
  if (!can(ctx, "ddt", "view")) redirect("/app");

  const data = await getDdt(ctx, id);
  if (!data) notFound();
  const { ddt, lines, contact, job, movementsGenerated } = data;
  const direction = ddt.direction;

  const initialValues: DdtInput = {
    contactId: ddt.contactId,
    jobId: ddt.jobId,
    date: ddt.date,
    status: ddt.status,
    transportReason: ddt.transportReason ?? "Vendita",
    transportedBy: ddt.transportedBy ?? "Mittente",
    carrier: ddt.carrier ?? "",
    packagesCount: ddt.packagesCount?.toString() ?? "",
    weight: ddt.weight ?? "",
    destinationAddress: ddt.destinationAddress ?? "",
    notes: ddt.notes ?? "",
    lines: lines.map((line) => ({
      itemId: line.itemId,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit ?? "pz",
    })),
  };

  const [contactOpts, jobOpts, itemOpts, infos] = await Promise.all([
    contactOptions(ctx, direction === "issued" ? "client" : "supplier"),
    jobOptions(ctx),
    itemOptions(ctx),
    itemInfos(ctx),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`DDT ${ddt.code}`}
        description={contact?.businessName ?? undefined}
        backHref="/app/logistica/ddt"
        backLabel="DDT"
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/ddt/${ddt.id}`} />
            <DdtDetailActions
              ddtId={ddt.id}
              code={ddt.code}
              direction={direction}
              initialValues={initialValues}
              contactOptions={contactOpts}
              jobOptions={jobOpts}
              itemOptions={itemOpts}
              itemInfos={infos}
              movementsGenerated={movementsGenerated}
              hasLinkedItems={lines.some((l) => l.itemId)}
              canEdit={can(ctx, "ddt", "edit")}
              canDelete={can(ctx, "ddt", "delete")}
              canGenerateMovements={
                can(ctx, "ddt", "edit") && can(ctx, "warehouse", "create")
              }
            />
          </>
        }
      />

      <AppCard title="Dati documento">
        <DetailList
          columns={3}
          items={[
            { label: "Numero", value: ddt.code },
            { label: "Data", value: formatDate(ddt.date) },
            {
              label: "Stato",
              value: (
                <StatusBadge
                  label={ddtStatusLabel(ddt.status)}
                  tone={ddtStatusTone(ddt.status)}
                />
              ),
            },
            {
              label: direction === "issued" ? "Destinatario" : "Mittente",
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
            { label: "Causale trasporto", value: ddt.transportReason },
            { label: "Trasporto a cura di", value: ddt.transportedBy },
            { label: "Vettore", value: ddt.carrier || "—" },
            {
              label: "Colli",
              value: ddt.packagesCount?.toString() ?? "—",
            },
            { label: "Peso", value: ddt.weight || "—" },
            {
              label: "Luogo di destinazione",
              value: ddt.destinationAddress || "—",
            },
            {
              label: "Movimenti magazzino",
              value: movementsGenerated ? (
                <StatusBadge label="Generati" tone="success" />
              ) : (
                <StatusBadge label="Non generati" tone="muted" />
              ),
            },
            { label: "Note", value: ddt.notes || "—" },
          ]}
        />
      </AppCard>

      <AppCard title="Righe merce">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="pl-6">Articolo</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="text-right">Q.tà</TableHead>
              <TableHead className="pr-6">Unità</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="pl-6">
                  {line.itemId ? (
                    <Link
                      href={`/app/magazzino/${line.itemId}`}
                      className="text-primary hover:underline"
                    >
                      Vedi articolo
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{line.description}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(line.quantity)}
                </TableCell>
                <TableCell className="pr-6">{line.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppCard>

      <AttachmentsPanel entityType="ddt" entityId={ddt.id} />
    </div>
  );
}
