import { InvoiceNewPage } from "@/features/invoices/components/invoice-new-page";

export const metadata = { title: "Nuova fattura emessa" };

export default async function Page({
  searchParams,
}: Readonly<{ searchParams: Promise<{ daOrdine?: string }> }>) {
  const { daOrdine } = await searchParams;
  return <InvoiceNewPage direction="issued" fromOrderId={daOrdine} />;
}
