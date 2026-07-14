import { OrderNewPage } from "@/features/orders/components/order-new-page";

export const metadata = { title: "Nuovo ordine ricevuto" };

export default function Page() {
  return <OrderNewPage direction="received" />;
}
