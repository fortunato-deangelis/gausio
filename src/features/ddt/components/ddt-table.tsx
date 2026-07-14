"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AppDropdown,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  StatusBadge,
  type AppDropdownItem,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import type { DdtListRow } from "../queries";
import { deleteDdt, updateDdtStatus } from "../actions";
import {
  DDT_STATUS_OPTIONS,
  ddtStatusLabel,
  ddtStatusTone,
  type DdtStatus,
} from "../schema";

type DdtTableProps = Readonly<{
  rows: DdtListRow[];
  direction: "issued" | "received";
  canEdit: boolean;
  canDelete: boolean;
}>;

export function DdtTable({ rows, direction, canEdit, canDelete }: DdtTableProps) {
  const router = useRouter();

  const changeStatus = async (id: string, status: DdtStatus) => {
    const result = await updateDdtStatus(id, status);
    if (result.ok) {
      toast.success("Stato aggiornato.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const columns: ColumnDef<DdtListRow, unknown>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Numero" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/app/logistica/ddt/${row.original.id}`}
          className="font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "contactName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={direction === "issued" ? "Destinatario" : "Mittente"}
        />
      ),
      cell: ({ row }) => row.original.contactName ?? "—",
    },
    {
      accessorKey: "transportReason",
      header: "Causale",
      cell: ({ row }) => row.original.transportReason ?? "—",
    },
    {
      accessorKey: "jobCode",
      header: "Commessa",
      cell: ({ row }) => row.original.jobCode ?? "—",
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <StatusBadge
          label={ddtStatusLabel(row.original.status)}
          tone={ddtStatusTone(row.original.status)}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const statusItems: AppDropdownItem[] = canEdit
          ? [
              { type: "label", label: "Cambia stato" },
              ...DDT_STATUS_OPTIONS.filter(
                (o) => o.value !== row.original.status
              ).map((o) => ({
                label: o.label,
                onSelect: () => changeStatus(row.original.id, o.value),
              })),
              { type: "separator" as const },
            ]
          : [];
        return (
          <div
            className="flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <AppDropdown
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label="Azioni">
                  <MoreHorizontal />
                </Button>
              }
              items={[
                ...statusItems,
                {
                  label: "Apri dettaglio",
                  href: `/app/logistica/ddt/${row.original.id}`,
                },
              ]}
            />
            {canDelete && (
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Elimina ${row.original.code}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                }
                title="Eliminare il DDT?"
                description={`Il documento ${row.original.code} verrà eliminato definitivamente.`}
                confirmLabel="Elimina"
                onConfirm={async () => {
                  const result = await deleteDdt(row.original.id);
                  if (result.ok) {
                    toast.success("DDT eliminato.");
                    router.refresh();
                  } else {
                    toast.error(result.error);
                  }
                }}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Cerca per numero o contatto…"
      onRowClick={(row) => router.push(`/app/logistica/ddt/${row.id}`)}
      emptyMessage="Nessun DDT trovato."
    />
  );
}
