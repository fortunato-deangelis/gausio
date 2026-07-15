"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  AppDropdown,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  Progress,
  StatusBadge,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import { deleteProject } from "../actions";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "../schema";
import type { ProjectListRow } from "../queries";

type ProjectsTableProps = Readonly<{
  data: ProjectListRow[];
  canEdit: boolean;
  canDelete: boolean;
}>;

export function ProjectsTable({ data, canEdit, canDelete }: ProjectsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<ProjectListRow, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "clientName",
      header: "Cliente",
      cell: ({ row }) => row.original.clientName ?? "—",
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
          label={PROJECT_STATUS_LABELS[row.original.status]}
          tone={PROJECT_STATUS_TONES[row.original.status]}
        />
      ),
    },
    {
      id: "progress",
      header: "Avanzamento",
      cell: ({ row }) => {
        const { tasksDone, tasksTotal } = row.original;
        const percent =
          tasksTotal === 0 ? 0 : Math.round((tasksDone / tasksTotal) * 100);
        return (
          <div className="flex min-w-32 items-center gap-2">
            <Progress value={percent} className="h-2" />
            <span className="text-xs text-muted-foreground">
              {tasksDone}/{tasksTotal}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "endDate",
      header: "Scadenza",
      cell: ({ row }) => formatDate(row.original.endDate),
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
                label: "Apri board",
                icon: Eye,
                onSelect: () => router.push(`/app/progetti/${row.original.id}`),
              },
              ...(canEdit
                ? [
                    {
                      label: "Modifica",
                      icon: Pencil,
                      onSelect: () =>
                        router.push(`/app/progetti/${row.original.id}?edit=1`),
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
                  aria-label={`Elimina ${row.original.name}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              }
              title="Eliminare il progetto?"
              description={`"${row.original.name}" e tutte le sue attività verranno eliminati.`}
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteProject(row.original.id);
                if (result.ok) {
                  toast.success("Progetto eliminato.");
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
      searchPlaceholder="Cerca progetto…"
      emptyMessage="Nessun progetto trovato."
      onRowClick={(row) => router.push(`/app/progetti/${row.id}`)}
    />
  );
}
