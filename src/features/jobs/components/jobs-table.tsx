"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AppDropdown,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  StatusBadge,
} from "@/components/shared";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteJob } from "../actions";
import { JOB_STATUS_LABELS, JOB_STATUS_TONES } from "../schema";
import type { JobListRow } from "../queries";

type JobsTableProps = Readonly<{
  data: JobListRow[];
  canEdit: boolean;
  canDelete: boolean;
}>;

export function JobsTable({ data, canEdit, canDelete }: JobsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<JobListRow, unknown>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Codice" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Titolo" />
      ),
    },
    {
      accessorKey: "clientName",
      header: "Cliente",
      cell: ({ row }) => row.original.clientName ?? "—",
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <StatusBadge
          label={JOB_STATUS_LABELS[row.original.status]}
          tone={JOB_STATUS_TONES[row.original.status]}
        />
      ),
    },
    {
      accessorKey: "startDate",
      header: "Inizio",
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: "budgetAmount",
      header: "Budget",
      cell: ({ row }) => formatCurrency(row.original.budgetAmount),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <AppDropdown
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Azioni">
                <MoreVertical />
              </Button>
            }
            items={[
              {
                label: "Dettaglio",
                icon: Eye,
                onSelect: () => router.push(`/app/commesse/${row.original.id}`),
              },
              ...(canEdit
                ? [
                    {
                      label: "Modifica",
                      icon: Pencil,
                      onSelect: () =>
                        router.push(`/app/commesse/${row.original.id}?edit=1`),
                    },
                  ]
                : []),
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
              title="Eliminare la commessa?"
              description={`"${row.original.code} — ${row.original.title}" verrà eliminata definitivamente.`}
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteJob(row.original.id);
                if (result.ok) {
                  toast.success("Commessa eliminata.");
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
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Cerca commessa…"
      emptyMessage="Nessuna commessa trovata."
      onRowClick={(row) => router.push(`/app/commesse/${row.id}`)}
    />
  );
}
