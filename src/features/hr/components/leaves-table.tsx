"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarOff, Check, Pencil, Trash2, X } from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  StatusBadge,
  type EntityOption,
  type StatusTone,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import type { LeaveListRow } from "../queries";
import { deleteLeaveRequest, reviewLeaveRequest } from "../actions";
import { LEAVE_STATUSES, LEAVE_TYPES, type LeaveInput } from "../schema";
import { LeaveFormDialog } from "./leave-form-dialog";

const typeTone: Record<LeaveListRow["type"], StatusTone> = {
  ferie: "info",
  permesso: "warning",
  malattia: "destructive",
};

const statusTone: Record<LeaveListRow["status"], StatusTone> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  cancelled: "muted",
};

function toInput(row: LeaveListRow): { id: string } & LeaveInput {
  return {
    id: row.id,
    employeeId: row.employeeId,
    type: row.type,
    startDate: row.startDate,
    endDate: row.endDate,
    startTime: row.startTime?.slice(0, 5) ?? "",
    endTime: row.endTime?.slice(0, 5) ?? "",
    reason: row.reason ?? "",
    protocolNumber: row.protocolNumber ?? "",
  };
}

type LeavesTableProps = Readonly<{
  rows: LeaveListRow[];
  employees: EntityOption[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}>;

export function LeavesTable({
  rows,
  employees,
  canEdit,
  canDelete,
  canCreate,
}: LeavesTableProps) {
  const router = useRouter();

  const review = async (id: string, decision: "approved" | "rejected") => {
    const result = await reviewLeaveRequest(id, decision);
    if (result.ok) {
      toast.success(
        decision === "approved" ? "Richiesta approvata." : "Richiesta rifiutata."
      );
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const columns: ColumnDef<LeaveListRow, unknown>[] = [
    {
      accessorKey: "employeeName",
      header: "Dipendente",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.employeeName}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <StatusBadge
          label={
            LEAVE_TYPES.find((t) => t.value === row.original.type)?.label ??
            row.original.type
          }
          tone={typeTone[row.original.type]}
        />
      ),
    },
    {
      accessorKey: "startDate",
      header: "Dal",
      cell: ({ row }) => (
        <span>
          {formatDate(row.original.startDate)}
          {row.original.startTime && (
            <span className="text-muted-foreground">
              {" "}
              {row.original.startTime.slice(0, 5)}
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "endDate",
      header: "Al",
      cell: ({ row }) => (
        <span>
          {formatDate(row.original.endDate)}
          {row.original.endTime && (
            <span className="text-muted-foreground">
              {" "}
              {row.original.endTime.slice(0, 5)}
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <StatusBadge
          label={
            LEAVE_STATUSES.find((s) => s.value === row.original.status)?.label ??
            row.original.status
          }
          tone={statusTone[row.original.status]}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canEdit && row.original.status === "pending" && (
            <>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Approva"
                    className="text-success hover:text-success"
                  >
                    <Check />
                  </Button>
                }
                title="Approvare la richiesta?"
                description={`${row.original.employeeName}: dal ${formatDate(
                  row.original.startDate
                )} al ${formatDate(row.original.endDate)}.`}
                confirmLabel="Approva"
                destructive={false}
                onConfirm={() => review(row.original.id, "approved")}
              />
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Rifiuta"
                    className="text-destructive hover:text-destructive"
                  >
                    <X />
                  </Button>
                }
                title="Rifiutare la richiesta?"
                confirmLabel="Rifiuta"
                onConfirm={() => review(row.original.id, "rejected")}
              />
            </>
          )}
          {canEdit && (
            <LeaveFormDialog
              employees={employees}
              leave={toInput(row.original)}
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
              title="Eliminare la richiesta?"
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteLeaveRequest(row.original.id);
                if (result.ok) {
                  toast.success("Richiesta eliminata.");
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
        icon={CalendarOff}
        title="Nessuna richiesta di assenza"
        description="Registra ferie, permessi e malattie dei dipendenti."
        action={
          canCreate ? (
            <LeaveFormDialog
              employees={employees}
              trigger={<Button>Nuova richiesta</Button>}
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
    />
  );
}
