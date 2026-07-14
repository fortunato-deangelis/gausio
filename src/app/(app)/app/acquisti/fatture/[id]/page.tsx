import { InvoiceDetailPage } from "@/features/invoices/components/invoice-detail-page";

export const metadata = { title: "Dettaglio fattura" };

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <InvoiceDetailPage direction="received" id={id} />;
}
