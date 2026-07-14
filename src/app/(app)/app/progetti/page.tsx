import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listProjects } from "@/features/projects/queries";
import { ProjectsTable } from "@/features/projects/components/projects-table";

export const metadata = { title: "Progetti" };

export default async function ProjectsPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "projects", "view")) redirect("/app");

  const rows = await listProjects(ctx);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Progetti"
        description="Project management con board attività per stato."
        actions={
          <>
            <ExportMenu
              pdfUrl="/api/export/progetti?format=pdf"
              xlsxUrl="/api/export/progetti?format=xlsx"
            />
            {can(ctx, "projects", "create") && (
              <Button asChild>
                <Link href="/app/progetti/nuovo">
                  <Plus className="size-4" />
                  Nuovo progetto
                </Link>
              </Button>
            )}
          </>
        }
      />
      <ProjectsTable
        data={rows}
        canEdit={can(ctx, "projects", "edit")}
        canDelete={can(ctx, "projects", "delete")}
      />
    </div>
  );
}
