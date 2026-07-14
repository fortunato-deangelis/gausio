import { redirect } from "next/navigation";
import { AppCard, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { contactOptions, jobOptions } from "@/features/documents-shared/queries";
import type { OrderDirection } from "../queries";
import { OrderForm } from "./order-form";

/** Pagina nuovo ordine (server), condivisa tra vendite e acquisti. */
export async function OrderNewPage({
  direction,
}: Readonly<{ direction: OrderDirection }>) {
  const ctx = await requireWorkspace();
  const moduleName =
    direction === "issued" ? ("orders_issued" as const) : ("orders_received" as const);
  if (!can(ctx, moduleName, "create")) redirect("/app");

  const [contactOpts, jobOpts] = await Promise.all([
    contactOptions(ctx, direction === "issued" ? "client" : "supplier"),
    jobOptions(ctx),
  ]);
  const basePath =
    direction === "issued" ? "/app/vendite/ordini" : "/app/acquisti/ordini";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={direction === "issued" ? "Nuovo ordine emesso" : "Nuovo ordine ricevuto"}
        backHref={basePath}
        backLabel={direction === "issued" ? "Ordini emessi" : "Ordini ricevuti"}
      />
      <AppCard>
        <OrderForm
          direction={direction}
          contactOptions={contactOpts}
          jobOptions={jobOpts}
        />
      </AppCard>
    </div>
  );
}
