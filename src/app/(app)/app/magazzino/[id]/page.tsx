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
import { getItem, itemOptions } from "@/features/warehouse/queries";
import {
  movementTypeLabel,
  movementTypeTone,
  type ItemInput,
} from "@/features/warehouse/schema";
import { ItemDetailActions } from "@/features/warehouse/components/item-detail-actions";

export const metadata = { title: "Dettaglio articolo" };

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const ctx = await requireWorkspace();
  if (!can(ctx, "warehouse", "view")) redirect("/app");

  const data = await getItem(ctx, id);
  if (!data) notFound();
  const { item, supplier, movements } = data;

  const belowMinStock =
    item.minStock !== null && Number(item.quantity) < Number(item.minStock);

  const initialValues: ItemInput = {
    sku: item.sku,
    name: item.name,
    description: item.description ?? "",
    category: item.category ?? "",
    unit: item.unit,
    location: item.location ?? "",
    minStock: item.minStock ?? "",
    unitCost: item.unitCost ?? "",
    unitPrice: item.unitPrice ?? "",
    supplierId: item.supplierId,
  };

  const [itemOpts, supplierOpts, contactOpts, jobOpts] = await Promise.all([
    itemOptions(ctx),
    contactOptions(ctx, "supplier"),
    contactOptions(ctx, "all"),
    jobOptions(ctx),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.name}
        description={`SKU ${item.sku}`}
        backHref="/app/magazzino"
        backLabel="Magazzino"
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/magazzino/${item.id}`} />
            <ItemDetailActions
              itemId={item.id}
              itemName={item.name}
              initialValues={initialValues}
              itemOptions={itemOpts}
              supplierOptions={supplierOpts}
              contactOptions={contactOpts}
              jobOptions={jobOpts}
              canCreate={can(ctx, "warehouse", "create")}
              canEdit={can(ctx, "warehouse", "edit")}
              canDelete={can(ctx, "warehouse", "delete")}
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <AppCard title="Dati articolo" className="lg:col-span-2">
          <DetailList
            items={[
              { label: "SKU", value: item.sku },
              { label: "Categoria", value: item.category || "—" },
              { label: "Unità di misura", value: item.unit },
              { label: "Ubicazione", value: item.location || "—" },
              { label: "Costo unitario", value: formatCurrency(item.unitCost) },
              {
                label: "Prezzo di vendita",
                value: formatCurrency(item.unitPrice),
              },
              {
                label: "Fornitore abituale",
                value: supplier?.businessName ?? "—",
              },
              { label: "Descrizione", value: item.description || "—" },
            ]}
          />
        </AppCard>

        <AppCard title="Giacenza">
          <div className="flex flex-col gap-2">
            <span className="text-3xl font-semibold tabular-nums">
              {formatNumber(item.quantity)}{" "}
              <span className="text-base font-normal text-muted-foreground">
                {item.unit}
              </span>
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Scorta minima: {formatNumber(item.minStock)}
              {belowMinStock && <StatusBadge label="Sotto scorta" tone="warning" />}
            </div>
          </div>
        </AppCard>
      </div>

      <AppCard title="Ultimi movimenti">
        {movements.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">
            Nessun movimento registrato per questo articolo.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="pl-6">Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantità</TableHead>
                <TableHead>Causale</TableHead>
                <TableHead className="pr-6">Riferimenti</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="pl-6">
                    {formatDate(movement.date)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={movementTypeLabel(movement.type)}
                      tone={movementTypeTone(movement.type)}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(movement.quantity)} {item.unit}
                  </TableCell>
                  <TableCell>{movement.reason ?? "—"}</TableCell>
                  <TableCell className="pr-6">
                    {[
                      movement.contactName,
                      movement.jobCode,
                      movement.ddtId ? "da DDT" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AppCard>

      <AttachmentsPanel entityType="warehouse_item" entityId={item.id} />
    </div>
  );
}
