import { redirect } from "next/navigation";
import { ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { contactOptions, jobOptions } from "@/features/documents-shared/queries";
import { itemOptions, listItems } from "@/features/warehouse/queries";
import { ItemsTable } from "@/features/warehouse/components/items-table";

export const metadata = { title: "Magazzino" };

export default async function Page() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "warehouse", "view")) redirect("/app");

  const [rows, itemOpts, supplierOpts, contactOpts, jobOpts] =
    await Promise.all([
      listItems(ctx),
      itemOptions(ctx),
      contactOptions(ctx, "supplier"),
      contactOptions(ctx, "all"),
      jobOptions(ctx),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Magazzino"
        description="Articoli, giacenze e movimenti di carico/scarico."
        actions={
          <ExportMenu
            pdfUrl="/api/export/magazzino?format=pdf"
            xlsxUrl="/api/export/magazzino?format=xlsx"
          />
        }
      />
      <ItemsTable
        rows={rows}
        itemOptions={itemOpts}
        supplierOptions={supplierOpts}
        contactOptions={contactOpts}
        jobOptions={jobOpts}
        canCreate={can(ctx, "warehouse", "create")}
        canDelete={can(ctx, "warehouse", "delete")}
      />
    </div>
  );
}
