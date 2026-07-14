import { OrderDetailPage } from "@/features/orders/components/order-detail-page";

export const metadata = { title: "Dettaglio ordine" };

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <OrderDetailPage direction="issued" id={id} />;
}
