"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  AppDropdown,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  StatusBadge,
} from "@/components/shared";
import { deleteContact, toggleArchiveContact } from "../actions";
import {
  CONTACT_KIND_LABELS,
  CONTACT_KIND_TONES,
  QUALIFICATION_LABELS,
  QUALIFICATION_TONES,
} from "../schema";
import type { ContactListRow } from "../queries";

type ContactsTableProps = Readonly<{
  data: ContactListRow[];
  canEdit: boolean;
  canDelete: boolean;
}>;

export function ContactsTable({ data, canEdit, canDelete }: ContactsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<ContactListRow, unknown>[] = [
    {
      accessorKey: "businessName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ragione sociale" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.businessName}
          {row.original.isArchived && (
            <StatusBadge label="Archiviato" tone="muted" className="ml-2" />
          )}
        </span>
      ),
    },
    {
      accessorKey: "kind",
      header: "Tipo",
      cell: ({ row }) => (
        <StatusBadge
          label={CONTACT_KIND_LABELS[row.original.kind]}
          tone={CONTACT_KIND_TONES[row.original.kind]}
        />
      ),
    },
    { accessorKey: "vatNumber", header: "P.IVA", cell: ({ row }) => row.original.vatNumber ?? "—" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email ?? "—" },
    { accessorKey: "phone", header: "Telefono", cell: ({ row }) => row.original.phone ?? "—" },
    {
      id: "qualification",
      header: "Qualifica",
      cell: ({ row }) =>
        row.original.kind === "client" ? (
          "—"
        ) : (
          <StatusBadge
            label={QUALIFICATION_LABELS[row.original.qualification]}
            tone={QUALIFICATION_TONES[row.original.qualification]}
          />
        ),
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
                onSelect: () => router.push(`/app/contatti/${row.original.id}`),
              },
              ...(canEdit
                ? [
                    {
                      label: "Modifica",
                      icon: Pencil,
                      onSelect: () =>
                        router.push(`/app/contatti/${row.original.id}?edit=1`),
                    },
                    {
                      label: row.original.isArchived
                        ? "Ripristina"
                        : "Archivia",
                      icon: Archive,
                      onSelect: async () => {
                        const result = await toggleArchiveContact(
                          row.original.id
                        );
                        if (result.ok) {
                          toast.success(
                            result.data.isArchived
                              ? "Contatto archiviato."
                              : "Contatto ripristinato."
                          );
                          router.refresh();
                        } else {
                          toast.error(result.error);
                        }
                      },
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
                  aria-label={`Elimina ${row.original.businessName}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              }
              title="Eliminare il contatto?"
              description={`"${row.original.businessName}" verrà eliminato definitivamente.`}
              confirmLabel="Elimina"
              onConfirm={async () => {
                const result = await deleteContact(row.original.id);
                if (result.ok) {
                  toast.success("Contatto eliminato.");
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
      searchPlaceholder="Cerca contatto…"
      emptyMessage="Nessun contatto trovato."
      onRowClick={(row) => router.push(`/app/contatti/${row.id}`)}
    />
  );
}
