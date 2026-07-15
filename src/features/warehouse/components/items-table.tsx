"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  AppDialog,
  AppDropdown,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  StatusBadge,
  type EntityOption,
} from "@/components/shared";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ItemListRow } from "../queries";
import { deleteItem } from "../actions";
import type { MovementType } from "../schema";
import { ItemForm } from "./item-form";
import { MovementFormDialog } from "./movement-form-dialog";

type ItemsTableProps = Readonly<{
  rows: ItemListRow[];
  itemOptions: readonly EntityOption[];
  supplierOptions: readonly EntityOption[];
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  canCreate: boolean;
  canDelete: boolean;
}>;

/** Tabella articoli con azioni rapide di carico/scarico e nuovo articolo. */
export function ItemsTable({
  rows,
  itemOptions,
  supplierOptions,
  contactOptions,
  jobOptions,
  canCreate,
  canDelete,
}: ItemsTableProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [movement, setMovement] = useState<{
    open: boolean;
    itemId?: string;
    type?: MovementType;
  }>({ open: false });

  const openMovement = (itemId?: string, type?: MovementType) =>
    setMovement({ open: true, itemId, type });

  const columns: ColumnDef<ItemListRow, unknown>[] = [
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="SKU" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/app/magazzino/${row.original.id}`}
          className="font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.sku}
        </Link>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => row.original.category ?? "—",
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Giacenza" />
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-2 tabular-nums">
          {formatNumber(row.original.quantity)} {row.original.unit}
          {row.original.belowMinStock && (
            <StatusBadge label="Sotto scorta" tone="warning" />
          )}
        </span>
      ),
    },
    {
      accessorKey: "unitPrice",
      header: "Prezzo",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatCurrency(row.original.unitPrice)}
        </span>
      ),
    },
    {
      accessorKey: "supplierName",
      header: "Fornitore",
      cell: ({ row }) => row.original.supplierName ?? "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {canCreate && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Carico ${row.original.name}`}
                className="text-success hover:text-success"
                onClick={() => openMovement(row.original.id, "in")}
              >
                <ArrowDownToLine />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Scarico ${row.original.name}`}
                className="text-warning hover:text-warning"
                onClick={() => openMovement(row.original.id, "out")}
              >
                <ArrowUpFromLine />
              </Button>
            </>
          )}
          <AppDropdown
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Azioni">
                <MoreHorizontal />
              </Button>
            }
            items={[
              {
                label: "Apri dettaglio",
                href: `/app/magazzino/${row.original.id}`,
              },
            ]}
          />
          {canDelete && (
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Elimina ${row.original.name}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              }
              title="Eliminare l'articolo?"
              description={`"${row.original.name}" verrà eliminato. Gli articoli con movimenti non possono essere eliminati.`}
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteItem(row.original.id);
                if (result.ok) {
                  toast.success("Articolo eliminato.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Cerca per SKU, nome o categoria…"
        onRowClick={(row) => router.push(`/app/magazzino/${row.id}`)}
        emptyMessage="Nessun articolo in magazzino."
        toolbar={
          canCreate ? (
            <>
              <Button variant="outline" onClick={() => openMovement()}>
                <ArrowDownToLine className="size-4" />
                Movimento
              </Button>
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Nuovo articolo
              </Button>
            </>
          ) : undefined
        }
      />

      <AppDialog
        open={creating}
        onOpenChange={setCreating}
        title="Nuovo articolo"
        size="lg"
      >
        <ItemForm
          supplierOptions={supplierOptions}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      </AppDialog>

      <MovementFormDialog
        open={movement.open}
        onOpenChange={(open) => setMovement((m) => ({ ...m, open }))}
        itemOptions={itemOptions}
        contactOptions={contactOptions}
        jobOptions={jobOptions}
        presetItemId={movement.itemId}
        presetType={movement.type}
      />
    </>
  );
}
