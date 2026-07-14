import { redirect } from "next/navigation";
import { AppCard, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { SettingsNav } from "@/features/workspaces/components/settings-nav";
import { WorkspaceProfileForm } from "@/features/workspaces/components/workspace-profile-form";

export const metadata = { title: "Impostazioni" };

/** Impostazioni → Profilo azienda. */
export default async function ImpostazioniPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "settings", "view")) redirect("/app");

  const w = ctx.workspace;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Impostazioni"
        description="Gestisci il profilo aziendale, i membri e i permessi del workspace."
      />
      <SettingsNav />
      <AppCard
        title="Profilo azienda"
        description="I dati anagrafici e fiscali della tua azienda."
      >
        <WorkspaceProfileForm
          readOnly={!can(ctx, "settings", "edit")}
          initialValues={{
            name: w.name,
            vatNumber: w.vatNumber ?? "",
            fiscalCode: w.fiscalCode ?? "",
            address: w.address ?? "",
            city: w.city ?? "",
            zipCode: w.zipCode ?? "",
            province: w.province ?? "",
            email: w.email ?? "",
            phone: w.phone ?? "",
            pec: w.pec ?? "",
            sdiCode: w.sdiCode ?? "",
          }}
        />
      </AppCard>
    </div>
  );
}
