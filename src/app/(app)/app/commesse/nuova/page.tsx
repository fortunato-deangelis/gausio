import { redirect } from "next/navigation";
import { AppCard, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { searchContactOptions } from "@/features/contacts/queries";
import { listMemberOptions } from "@/features/jobs/queries";
import { JobForm } from "@/features/jobs/components/job-form";

export const metadata = { title: "Nuova commessa" };

export default async function NewJobPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "jobs", "create")) redirect("/app/commesse");

  const [clientOptions, memberOptions] = await Promise.all([
    searchContactOptions(ctx, "client"),
    listMemberOptions(ctx),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuova commessa"
        description="Il codice progressivo viene assegnato automaticamente."
        backHref="/app/commesse"
      />
      <AppCard>
        <JobForm clientOptions={clientOptions} memberOptions={memberOptions} />
      </AppCard>
    </div>
  );
}
