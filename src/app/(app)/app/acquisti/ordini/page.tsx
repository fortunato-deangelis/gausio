import { OrdersListPage } from "@/features/orders/components/orders-list-page";

export const metadata = { title: "Ordini ricevuti" };

export default function Page() {
  return <OrdersListPage direction="received" />;
}
