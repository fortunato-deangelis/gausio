"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  EmptyState,
  type EntityOption,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import type { TimeEntryListRow } from "../queries";
import { deleteTimeEntry } from "../actions";
import type { TimeEntryInput } from "../schema";
import { TimeEntryFormDialog } from "./time-entry-form-dialog";

function toInput(row: TimeEntryListRow): { id: string } & TimeEntryInput {
  return {
    id: row.id,
    employeeId: row.employeeId,
    date: row.date,
    clockIn: row.clockIn.slice(0, 5),
    clockOut: row.clockOut?.slice(0, 5) ?? "",
    breakMinutes: row.breakMinutes ?? "0",
    notes: row.notes ?? "",
  };
}

type TimeEntriesTableProps = Readonly<{
  rows: TimeEntryListRow[];
  employees: EntityOption[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}>;

export function TimeEntriesTable({
  rows,
  employees,
  canEdit,
  canDelete,
  canCreate,
}: TimeEntriesTableProps) {
  const router = useRouter();

  const columns: ColumnDef<TimeEntryListRow, unknown>[] = [
    {
      accessorKey: "employeeName",
      header: "Dipendente",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.employeeName}</span>
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
      accessorKey: "clockIn",
      header: "Entrata",
      cell: ({ row }) => row.original.clockIn.slice(0, 5),
    },
    {
      accessorKey: "clockOut",
      header: "Uscita",
      cell: ({ row }) => row.original.clockOut?.slice(0, 5) ?? "—",
    },
    {
      accessorKey: "breakMinutes",
      header: "Pausa",
      cell: ({ row }) =>
        row.original.breakMinutes && row.original.breakMinutes !== "0"
          ? `${row.original.breakMinutes} min`
          : "—",
    },
    { accessorKey: "hoursLabel", header: "Ore" },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canEdit && (
            <TimeEntryFormDialog
              employees={employees}
              entry={toInput(row.original)}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label="Modifica">
                  <Pencil />
                </Button>
              }
            />
          )}
          {canDelete && (
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Elimina"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              }
              title="Eliminare la timbratura?"
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteTimeEntry(row.original.id);
                if (result.ok) {
                  toast.success("Timbratura eliminata.");
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

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Nessuna timbratura"
        description="Registra entrate e uscite dei dipendenti."
        action={
          canCreate ? (
            <TimeEntryFormDialog
              employees={employees}
              trigger={<Button>Nuova timbratura</Button>}
            />
          ) : undefined
        }
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Cerca per dipendente…"
      pageSize={15}
    />
  );
}
