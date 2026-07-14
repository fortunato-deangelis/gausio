import { OrderNewPage } from "@/features/orders/components/order-new-page";

export const metadata = { title: "Nuovo ordine emesso" };

export default function Page() {
  return <OrderNewPage direction="issued" />;
}
