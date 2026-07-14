import { redirect } from "next/navigation";
import { AppCard, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { searchContactOptions } from "@/features/contacts/queries";
import { listMemberOptions, searchJobOptions } from "@/features/jobs/queries";
import { ProjectForm } from "@/features/projects/components/project-form";

export const metadata = { title: "Nuovo progetto" };

export default async function NewProjectPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "projects", "create")) redirect("/app/progetti");

  const [clientOptions, jobOptions, memberOptions] = await Promise.all([
    searchContactOptions(ctx, "client"),
    searchJobOptions(ctx),
    listMemberOptions(ctx),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuovo progetto"
        description="Collega il progetto a un cliente o a una commessa."
        backHref="/app/progetti"
      />
      <AppCard>
        <ProjectForm
          clientOptions={clientOptions}
          jobOptions={jobOptions}
          memberOptions={memberOptions}
        />
      </AppCard>
    </div>
  );
}
