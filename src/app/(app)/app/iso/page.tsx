import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import {
  ExportMenu,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  buttonVariants,
} from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listIsoDocuments } from "@/features/iso/queries";
import { ISO_STANDARDS } from "@/features/iso/schema";
import {
  IsoDocumentsTable,
  type IsoTableRow,
} from "@/features/iso/components/iso-documents-table";

export const metadata: Metadata = { title: "Documenti ISO" };

export default async function IsoPage({
  searchParams,
}: {
  searchParams: Promise<{ standard?: string; status?: string }>;
}) {
  const ctx = await requireWorkspace();
  if (!can(ctx, "iso", "view")) redirect("/app");

  const { standard, status } = await searchParams;
  const documents = await listIsoDocuments({ standard, status });
  const rows: IsoTableRow[] = documents.map((d) => ({
    id: d.id,
    code: d.code,
    title: d.title,
    standard: d.standard,
    type: d.type,
    status: d.status,
    revision: d.revision,
    issueDate: d.issueDate,
    reviewDate: d.reviewDate,
  }));

  const exportQuery = new URLSearchParams();
  if (standard) exportQuery.set("standard", standard);
  if (status) exportQuery.set("status", status);
  const qs = exportQuery.toString() ? `&${exportQuery.toString()}` : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documenti ISO"
        description="Procedure, manuali e registrazioni del sistema di gestione (ISO 9001, 27001…)."
        actions={
          <>
            <ExportMenu
              pdfUrl={`/api/export/iso?format=pdf${qs}`}
              xlsxUrl={`/api/export/iso?format=xlsx${qs}`}
            />
            {can(ctx, "iso", "create") && (
              <Link href="/app/iso/nuovo" className={buttonVariants()}>
                <Plus className="size-4" />
                Nuovo documento
              </Link>
            )}
          </>
        }
      />

      <Tabs value={standard ?? ""}>
        <TabsList>
          <TabsTrigger value="" asChild>
            <Link href="/app/iso">Tutte le norme</Link>
          </TabsTrigger>
          {ISO_STANDARDS.map((s) => (
            <TabsTrigger key={s.value} value={s.value} asChild>
              <Link href={`/app/iso?standard=${s.value}`}>{s.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <IsoDocumentsTable
        rows={rows}
        canCreate={can(ctx, "iso", "create")}
        canEdit={can(ctx, "iso", "edit")}
        canDelete={can(ctx, "iso", "delete")}
      />
    </div>
  );
}
