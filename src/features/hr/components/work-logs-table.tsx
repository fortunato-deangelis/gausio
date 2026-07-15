"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  EmptyState,
  type EntityOption,
} from "@/components/shared";
import { formatDate, formatNumber } from "@/lib/format";
import type { WorkLogListRow } from "../queries";
import { deleteWorkLog } from "../actions";
import type { WorkLogInput } from "../schema";
import { WorkLogFormDialog } from "./work-log-form-dialog";

function toInput(row: WorkLogListRow): { id: string } & WorkLogInput {
  return {
    id: row.id,
    employeeId: row.employeeId,
    jobId: row.jobId,
    date: row.date,
    hours: row.hours,
    description: row.description ?? "",
  };
}

type WorkLogsTableProps = Readonly<{
  rows: WorkLogListRow[];
  employees: EntityOption[];
  jobs: EntityOption[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}>;

export function WorkLogsTable({
  rows,
  employees,
  jobs,
  canEdit,
  canDelete,
  canCreate,
}: WorkLogsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<WorkLogListRow, unknown>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "employeeName",
      header: "Dipendente",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.employeeName}</span>
      ),
    },
    { accessorKey: "jobLabel", header: "Commessa" },
    {
      accessorKey: "hours",
      header: "Ore",
      cell: ({ row }) => formatNumber(row.original.hours),
    },
    {
      accessorKey: "description",
      header: "Descrizione",
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-72 text-muted-foreground">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canEdit && (
            <WorkLogFormDialog
              employees={employees}
              jobs={jobs}
              log={toInput(row.original)}
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
              title="Eliminare la scheda lavoro?"
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteWorkLog(row.original.id);
                if (result.ok) {
                  toast.success("Scheda eliminata.");
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
        icon={ClipboardList}
        title="Nessuna scheda lavoro"
        description="Imputa le ore dei dipendenti alle commesse."
        action={
          canCreate ? (
            <WorkLogFormDialog
              employees={employees}
              jobs={jobs}
              trigger={<Button>Nuova scheda</Button>}
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
      searchPlaceholder="Cerca per dipendente o commessa…"
      pageSize={15}
    />
  );
}
