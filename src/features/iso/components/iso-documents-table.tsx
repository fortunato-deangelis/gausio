"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCheck, Eye, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  EmptyState,
  StatusBadge,
  buttonVariants,
  type StatusTone,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import {
  isoStandardLabel,
  isoStatusLabel,
  isoTypeLabel,
} from "../schema";
import { approveIsoDocument, deleteIsoDocument } from "../actions";

export type IsoTableRow = Readonly<{
  id: string;
  code: string;
  title: string;
  standard: string;
  type: string;
  status: "draft" | "in_review" | "approved" | "obsolete";
  revision: number;
  issueDate: string | null;
  reviewDate: string | null;
}>;

const statusTone: Record<IsoTableRow["status"], StatusTone> = {
  draft: "muted",
  in_review: "warning",
  approved: "success",
  obsolete: "destructive",
};

type IsoDocumentsTableProps = Readonly<{
  rows: IsoTableRow[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}>;

export function IsoDocumentsTable({
  rows,
  canEdit,
  canDelete,
  canCreate,
}: IsoDocumentsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<IsoTableRow, unknown>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Codice" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/app/iso/${row.original.id}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.code}
        </Link>
      ),
    },
    { accessorKey: "title", header: "Titolo" },
    {
      accessorKey: "standard",
      header: "Norma",
      cell: ({ row }) => (
        <StatusBadge label={isoStandardLabel(row.original.standard)} tone="info" />
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => isoTypeLabel(row.original.type),
    },
    {
      accessorKey: "revision",
      header: "Rev.",
      cell: ({ row }) => `Rev. ${row.original.revision}`,
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <StatusBadge
          label={isoStatusLabel(row.original.status)}
          tone={statusTone[row.original.status]}
        />
      ),
    },
    {
      accessorKey: "issueDate",
      header: "Emissione",
      cell: ({ row }) => formatDate(row.original.issueDate),
    },
    {
      accessorKey: "reviewDate",
      header: "Riesame",
      cell: ({ row }) => formatDate(row.original.reviewDate),
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
            <Link href={`/app/iso/${row.original.id}`}>
              <Eye />
            </Link>
          </Button>
          {canEdit && row.original.status !== "approved" && (
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Approva"
                  className="text-success hover:text-success"
                >
                  <BadgeCheck />
                </Button>
              }
              title="Approvare il documento?"
              description={`${row.original.code} — ${row.original.title} passerà allo stato Approvato.`}
              confirmLabel="Approva"
              destructive={false}
              onConfirm={async () => {
                const result = await approveIsoDocument(row.original.id);
                if (result.ok) {
                  toast.success("Documento approvato.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              }}
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
              title="Eliminare il documento?"
              description={`${row.original.code} e tutte le sue revisioni verranno rimossi.`}
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteIsoDocument(row.original.id);
                if (result.ok) {
                  toast.success("Documento eliminato.");
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
        icon={ShieldCheck}
        title="Nessun documento"
        description="Crea procedure, manuali e moduli per le tue certificazioni ISO."
        action={
          canCreate ? (
            <Link href="/app/iso/nuovo" className={buttonVariants()}>
              Nuovo documento
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Cerca per codice o titolo…"
      onRowClick={(row) => router.push(`/app/iso/${row.id}`)}
    />
  );
}
