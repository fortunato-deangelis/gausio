import { redirect } from "next/navigation";
import { AppCard, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { ContactForm } from "@/features/contacts/components/contact-form";

export const metadata = { title: "Nuovo contatto" };

export default async function NewContactPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "contacts", "create")) redirect("/app/contatti");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuovo contatto"
        description="Crea un cliente o un fornitore."
        backHref="/app/contatti"
      />
      <AppCard>
        <ContactForm />
      </AppCard>
    </div>
  );
}
