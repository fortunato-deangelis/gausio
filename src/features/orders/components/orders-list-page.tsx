import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { Button, ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listOrders, type OrderDirection } from "../queries";
import { OrdersTable } from "./orders-table";

/** Pagina elenco ordini (server), condivisa tra vendite e acquisti. */
export async function OrdersListPage({
  direction,
}: Readonly<{ direction: OrderDirection }>) {
  const ctx = await requireWorkspace();
  const moduleName =
    direction === "issued" ? ("orders_issued" as const) : ("orders_received" as const);
  if (!can(ctx, moduleName, "view")) redirect("/app");

  const rows = await listOrders(ctx, direction);
  const basePath =
    direction === "issued" ? "/app/vendite/ordini" : "/app/acquisti/ordini";
  const title = direction === "issued" ? "Ordini emessi" : "Ordini ricevuti";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={
          direction === "issued"
            ? "Ordini di vendita verso i clienti."
            : "Ordini di acquisto dai fornitori."
        }
        actions={
          <>
            <ExportMenu
              pdfUrl={`/api/export/ordini?direction=${direction}&format=pdf`}
              xlsxUrl={`/api/export/ordini?direction=${direction}&format=xlsx`}
            />
            {can(ctx, moduleName, "create") && (
              <Button asChild>
                <Link href={`${basePath}/nuovo`}>
                  <Plus className="size-4" />
                  Nuovo ordine
                </Link>
              </Button>
            )}
          </>
        }
      />
      <OrdersTable
        rows={rows}
        direction={direction}
        canEdit={can(ctx, moduleName, "edit")}
        canDelete={can(ctx, moduleName, "delete")}
      />
    </div>
  );
}
