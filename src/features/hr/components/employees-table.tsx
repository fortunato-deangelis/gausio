"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  EmptyState,
  StatusBadge,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import { deleteEmployee } from "../actions";
import { EMPLOYEE_STATUSES, type EmployeeInput } from "../schema";
import { EmployeeFormDialog } from "./employee-form-dialog";

export type EmployeeTableRow = Readonly<
  { id: string } & EmployeeInput
>;

const statusTone = {
  active: "success",
  suspended: "warning",
  terminated: "muted",
} as const;

function statusLabel(status: EmployeeTableRow["status"]): string {
  return EMPLOYEE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

type EmployeesTableProps = Readonly<{
  rows: EmployeeTableRow[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}>;

export function EmployeesTable({
  rows,
  canEdit,
  canDelete,
  canCreate,
}: EmployeesTableProps) {
  const router = useRouter();

  const columns: ColumnDef<EmployeeTableRow, unknown>[] = [
    {
      id: "name",
      accessorFn: (row) => `${row.lastName} ${row.firstName}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nominativo" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/app/personale/${row.original.id}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.lastName} {row.original.firstName}
        </Link>
      ),
    },
    { accessorKey: "jobTitle", header: "Mansione", cell: ({ row }) => row.original.jobTitle || "—" },
    { accessorKey: "department", header: "Reparto", cell: ({ row }) => row.original.department || "—" },
    { accessorKey: "contractType", header: "Contratto", cell: ({ row }) => row.original.contractType || "—" },
    {
      accessorKey: "hiredAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assunzione" />
      ),
      cell: ({ row }) => formatDate(row.original.hiredAt || null),
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <StatusBadge
          label={statusLabel(row.original.status)}
          tone={statusTone[row.original.status]}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button asChild variant="ghost" size="icon-sm" aria-label="Dettaglio">
            <Link href={`/app/personale/${row.original.id}`}>
              <Eye />
            </Link>
          </Button>
          {canEdit && (
            <EmployeeFormDialog
              employee={row.original}
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
              title="Eliminare il dipendente?"
              description={`${row.original.firstName} ${row.original.lastName} verrà rimosso definitivamente.`}
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteEmployee(row.original.id);
                if (result.ok) {
                  toast.success("Dipendente eliminato.");
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
        icon={Users}
        title="Nessun dipendente"
        description="Aggiungi il primo dipendente per gestire assenze, timbrature e schede lavoro."
        action={
          canCreate ? (
            <EmployeeFormDialog trigger={<Button>Nuovo dipendente</Button>} />
          ) : undefined
        }
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Cerca dipendente…"
      onRowClick={(row) => router.push(`/app/personale/${row.id}`)}
    />
  );
}
