import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { Button, ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listInvoices, type InvoiceDirection } from "../queries";
import { InvoicesTable } from "./invoices-table";

/** Pagina elenco fatture (server), condivisa tra vendite e acquisti. */
export async function InvoicesListPage({
  direction,
}: Readonly<{ direction: InvoiceDirection }>) {
  const ctx = await requireWorkspace();
  const moduleName =
    direction === "issued"
      ? ("invoices_issued" as const)
      : ("invoices_received" as const);
  if (!can(ctx, moduleName, "view")) redirect("/app");

  const rows = await listInvoices(ctx, direction);
  const basePath =
    direction === "issued" ? "/app/vendite/fatture" : "/app/acquisti/fatture";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={direction === "issued" ? "Fatture emesse" : "Fatture ricevute"}
        description={
          direction === "issued"
            ? "Fatture di vendita verso i clienti."
            : "Fatture di acquisto dai fornitori."
        }
        actions={
          <>
            <ExportMenu
              pdfUrl={`/api/export/fatture?direction=${direction}&format=pdf`}
              xlsxUrl={`/api/export/fatture?direction=${direction}&format=xlsx`}
            />
            {can(ctx, moduleName, "create") && (
              <Button asChild>
                <Link href={`${basePath}/nuovo`}>
                  <Plus className="size-4" />
                  Nuova fattura
                </Link>
              </Button>
            )}
          </>
        }
      />
      <InvoicesTable
        rows={rows}
        direction={direction}
        canEdit={can(ctx, moduleName, "edit")}
        canDelete={can(ctx, moduleName, "delete")}
      />
    </div>
  );
}
