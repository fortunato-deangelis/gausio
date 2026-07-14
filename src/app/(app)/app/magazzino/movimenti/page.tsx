import { redirect } from "next/navigation";
import { ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { contactOptions, jobOptions } from "@/features/documents-shared/queries";
import { itemOptions, listMovements } from "@/features/warehouse/queries";
import { MovementsTable } from "@/features/warehouse/components/movements-table";

export const metadata = { title: "Movimenti di magazzino" };

export default async function Page() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "warehouse", "view")) redirect("/app");

  const [rows, itemOpts, contactOpts, jobOpts] = await Promise.all([
    listMovements(ctx),
    itemOptions(ctx),
    contactOptions(ctx, "all"),
    jobOptions(ctx),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movimenti di magazzino"
        description="Storico di carichi, scarichi e rettifiche."
        backHref="/app/magazzino"
        backLabel="Magazzino"
        actions={
          <ExportMenu
            pdfUrl="/api/export/magazzino/movimenti?format=pdf"
            xlsxUrl="/api/export/magazzino/movimenti?format=xlsx"
          />
        }
      />
      <MovementsTable
        rows={rows}
        itemOptions={itemOpts}
        contactOptions={contactOpts}
        jobOptions={jobOpts}
        canCreate={can(ctx, "warehouse", "create")}
        canDelete={can(ctx, "warehouse", "delete")}
      />
    </div>
  );
}
