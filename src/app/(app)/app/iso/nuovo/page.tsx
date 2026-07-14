import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppCard, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listMemberOptions } from "@/features/iso/queries";
import { IsoDocumentForm } from "@/features/iso/components/iso-document-form";

export const metadata: Metadata = { title: "Nuovo documento ISO" };

export default async function NuovoIsoPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "iso", "create")) redirect("/app/iso");

  const members = await listMemberOptions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuovo documento ISO"
        description="Crea una procedura, un manuale o un modulo del sistema di gestione."
        backHref="/app/iso"
        backLabel="Documenti ISO"
      />
      <AppCard>
        <IsoDocumentForm members={members} />
      </AppCard>
    </div>
  );
}
