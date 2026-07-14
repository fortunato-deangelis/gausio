import { InvoicesListPage } from "@/features/invoices/components/invoices-list-page";

export const metadata = { title: "Fatture ricevute" };

export default function Page() {
  return <InvoicesListPage direction="received" />;
}
