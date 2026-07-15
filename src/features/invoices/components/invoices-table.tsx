"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/shared/toast";
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
import type { InvoiceListRow } from "../queries";
import {
  deleteInvoice,
  markInvoiceAsPaid,
  updateInvoiceStatus,
} from "../actions";
import {
  INVOICE_STATUS_OPTIONS,
  invoiceStatusLabel,
  invoiceStatusTone,
  type InvoiceStatus,
} from "../schema";

type InvoicesTableProps = Readonly<{
  rows: InvoiceListRow[];
  direction: "issued" | "received";
  canEdit: boolean;
  canDelete: boolean;
}>;

export function InvoicesTable({
  rows,
  direction,
  canEdit,
  canDelete,
}: InvoicesTableProps) {
  const router = useRouter();
  const basePath =
    direction === "issued" ? "/app/vendite/fatture" : "/app/acquisti/fatture";

  const changeStatus = async (id: string, status: InvoiceStatus) => {
    const result = await updateInvoiceStatus(id, status);
    if (result.ok) {
      toast.success("Stato aggiornato.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const columns: ColumnDef<InvoiceListRow, unknown>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Numero" />
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
      accessorKey: "dueDate",
      header: "Scadenza",
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <StatusBadge
          label={invoiceStatusLabel(row.original.status)}
          tone={invoiceStatusTone(row.original.status)}
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
              ...INVOICE_STATUS_OPTIONS.filter(
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
            {canEdit && row.original.status !== "paid" && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Segna come pagata ${row.original.code}`}
                className="text-success hover:text-success"
                onClick={async () => {
                  const result = await markInvoiceAsPaid(row.original.id);
                  if (result.ok) {
                    toast.success("Fattura segnata come pagata.");
                    router.refresh();
                  } else {
                    toast.error(result.error);
                  }
                }}
              >
                <CheckCircle2 />
              </Button>
            )}
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
                title="Eliminare la fattura?"
                description={`La fattura ${row.original.code} e le sue righe verranno eliminate definitivamente.`}
                confirmLabel="Elimina"
                onConfirm={async () => {
                  const result = await deleteInvoice(row.original.id);
                  if (result.ok) {
                    toast.success("Fattura eliminata.");
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
      onRowClick={(row) => router.push(`${basePath}/${row.id}`)}
      emptyMessage="Nessuna fattura trovata."
    />
  );
}
