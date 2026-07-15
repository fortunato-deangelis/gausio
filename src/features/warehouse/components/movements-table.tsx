"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  StatusBadge,
  type EntityOption,
} from "@/components/shared";
import { formatDate, formatNumber } from "@/lib/format";
import type { MovementListRow } from "../queries";
import { deleteMovement } from "../actions";
import { movementTypeLabel, movementTypeTone } from "../schema";
import { MovementFormDialog } from "./movement-form-dialog";

type MovementsTableProps = Readonly<{
  rows: MovementListRow[];
  itemOptions: readonly EntityOption[];
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  canCreate: boolean;
  canDelete: boolean;
}>;

export function MovementsTable({
  rows,
  itemOptions,
  contactOptions,
  jobOptions,
  canCreate,
  canDelete,
}: MovementsTableProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const columns: ColumnDef<MovementListRow, unknown>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "itemName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Articolo" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/app/magazzino/${row.original.itemId}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.itemSku} — {row.original.itemName}
        </Link>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <StatusBadge
          label={movementTypeLabel(row.original.type)}
          tone={movementTypeTone(row.original.type)}
        />
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantità",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatNumber(row.original.quantity)} {row.original.itemUnit}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Causale",
      cell: ({ row }) => row.original.reason ?? "—",
    },
    {
      id: "refs",
      header: "Riferimenti",
      cell: ({ row }) => {
        const refs = [
          row.original.contactName,
          row.original.jobCode,
          row.original.ddtId ? "da DDT" : null,
        ].filter(Boolean);
        return refs.length ? refs.join(" · ") : "—";
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        canDelete ? (
          <div className="flex justify-end">
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Elimina movimento"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              }
              title="Eliminare il movimento?"
              description="La giacenza dell'articolo verrà stornata di conseguenza."
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteMovement(row.original.id);
                if (result.ok) {
                  toast.success("Movimento eliminato.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              }}
            />
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Cerca per articolo o causale…"
        emptyMessage="Nessun movimento registrato."
        toolbar={
          canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Nuovo movimento
            </Button>
          ) : undefined
        }
      />
      <MovementFormDialog
        open={creating}
        onOpenChange={setCreating}
        itemOptions={itemOptions}
        contactOptions={contactOptions}
        jobOptions={jobOptions}
      />
    </>
  );
}
