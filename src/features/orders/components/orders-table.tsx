"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderListRow } from "../queries";
import { deleteOrder, updateOrderStatus } from "../actions";
import {
  ORDER_STATUS_OPTIONS,
  orderStatusLabel,
  orderStatusTone,
  type OrderStatus,
} from "../schema";

type OrdersTableProps = Readonly<{
  rows: OrderListRow[];
  direction: "issued" | "received";
  canEdit: boolean;
  canDelete: boolean;
}>;

export function OrdersTable({
  rows,
  direction,
  canEdit,
  canDelete,
}: OrdersTableProps) {
  const router = useRouter();
  const basePath =
    direction === "issued" ? "/app/vendite/ordini" : "/app/acquisti/ordini";

  const changeStatus = async (id: string, status: OrderStatus) => {
    const result = await updateOrderStatus(id, status);
    if (result.ok) {
      toast.success("Stato aggiornato.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const columns: ColumnDef<OrderListRow, unknown>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Codice" />
      ),
      cell: ({ row }) => (
        <Link
          href={`${basePath}/${row.original.id}`}
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
          title={direction === "issued" ? "Cliente" : "Fornitore"}
        />
      ),
      cell: ({ row }) => row.original.contactName ?? "—",
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
          label={orderStatusLabel(row.original.status)}
          tone={orderStatusTone(row.original.status)}
        />
      ),
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Totale" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{formatCurrency(row.original.total)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const statusItems: AppDropdownItem[] = canEdit
          ? [
              { type: "label", label: "Cambia stato" },
              ...ORDER_STATUS_OPTIONS.filter(
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
                  icon: Pencil,
                  href: `${basePath}/${row.original.id}`,
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
                title="Eliminare l'ordine?"
                description={`L'ordine ${row.original.code} e le sue righe verranno eliminati definitivamente.`}
                confirmLabel="Elimina"
                onConfirm={async () => {
                  const result = await deleteOrder(row.original.id);
                  if (result.ok) {
                    toast.success("Ordine eliminato.");
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
      searchPlaceholder="Cerca per codice o contatto…"
      onRowClick={(row) => router.push(`${basePath}/${row.id}`)}
      emptyMessage="Nessun ordine trovato."
    />
  );
}
