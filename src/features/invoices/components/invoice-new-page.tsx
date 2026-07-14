import { redirect } from "next/navigation";
import { AppCard, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { contactOptions, jobOptions } from "@/features/documents-shared/queries";
import { getOrder } from "@/features/orders/queries";
import type { InvoiceDirection } from "../queries";
import type { InvoiceInput } from "../schema";
import { InvoiceForm } from "./invoice-form";

/**
 * Pagina nuova fattura. Con `fromOrderId` precompila contatto, commessa e
 * righe a partire da un ordine ("Crea fattura da ordine").
 */
export async function InvoiceNewPage({
  direction,
  fromOrderId,
}: Readonly<{ direction: InvoiceDirection; fromOrderId?: string }>) {
  const ctx = await requireWorkspace();
  const moduleName =
    direction === "issued"
      ? ("invoices_issued" as const)
      : ("invoices_received" as const);
  if (!can(ctx, moduleName, "create")) redirect("/app");

  const [contactOpts, jobOpts] = await Promise.all([
    contactOptions(ctx, direction === "issued" ? "client" : "supplier"),
    jobOptions(ctx),
  ]);
  const basePath =
    direction === "issued" ? "/app/vendite/fatture" : "/app/acquisti/fatture";

  let initialValues: InvoiceInput | undefined;
  if (fromOrderId) {
    const data = await getOrder(ctx, fromOrderId);
    if (data && data.order.direction === direction) {
      initialValues = {
        contactId: data.order.contactId,
        jobId: data.order.jobId,
        orderId: data.order.id,
        date: new Date().toISOString().slice(0, 10),
        dueDate: "",
        status: "draft",
        currency: data.order.currency,
        paymentMethod: "",
        paymentTerms: "",
        externalReference: "",
        notes: `Rif. ordine ${data.order.code}`,
        lines: data.lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unit: line.unit ?? "pz",
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
          discount: line.discount,
        })),
      };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          direction === "issued" ? "Nuova fattura emessa" : "Nuova fattura ricevuta"
        }
        description={
          initialValues?.orderId
            ? "Precompilata dall'ordine collegato."
            : undefined
        }
        backHref={basePath}
        backLabel={direction === "issued" ? "Fatture emesse" : "Fatture ricevute"}
      />
      <AppCard>
        <InvoiceForm
          direction={direction}
          contactOptions={contactOpts}
          jobOptions={jobOpts}
          initialValues={initialValues}
        />
      </AppCard>
    </div>
  );
}
