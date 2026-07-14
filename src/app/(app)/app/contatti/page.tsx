import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listContacts } from "@/features/contacts/queries";
import { ContactsTable } from "@/features/contacts/components/contacts-table";
import type { ContactKind } from "@/features/contacts/schema";

export const metadata = { title: "Clienti e fornitori" };

const KIND_TABS: { value: ContactKind | ""; label: string }[] = [
  { value: "", label: "Tutti" },
  { value: "client", label: "Clienti" },
  { value: "supplier", label: "Fornitori" },
];

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireWorkspace();
  if (!can(ctx, "contacts", "view")) redirect("/app");

  const params = await searchParams;
  const kindParam = typeof params.kind === "string" ? params.kind : "";
  const kind =
    kindParam === "client" || kindParam === "supplier"
      ? (kindParam as ContactKind)
      : null;

  const rows = await listContacts(ctx, { kind });
  const exportQuery = kind ? `&kind=${kind}` : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clienti e fornitori"
        description="Anagrafica unica di clienti e fornitori, con qualifica fornitori."
        actions={
          <>
            <ExportMenu
              pdfUrl={`/api/export/contatti?format=pdf${exportQuery}`}
              xlsxUrl={`/api/export/contatti?format=xlsx${exportQuery}`}
            />
            {can(ctx, "contacts", "create") && (
              <Button asChild>
                <Link href="/app/contatti/nuovo">
                  <Plus className="size-4" />
                  Nuovo contatto
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="flex gap-1">
        {KIND_TABS.map((tab) => (
          <Button
            key={tab.value}
            asChild
            variant={kindParam === tab.value ? "default" : "ghost"}
            size="sm"
          >
            <Link
              href={
                tab.value ? `/app/contatti?kind=${tab.value}` : "/app/contatti"
              }
            >
              {tab.label}
            </Link>
          </Button>
        ))}
      </div>

      <ContactsTable
        data={rows}
        canEdit={can(ctx, "contacts", "edit")}
        canDelete={can(ctx, "contacts", "delete")}
      />
    </div>
  );
}
