import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listJobs } from "@/features/jobs/queries";
import { JobsTable } from "@/features/jobs/components/jobs-table";

export const metadata = { title: "Commesse" };

export default async function JobsPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "jobs", "view")) redirect("/app");

  const rows = await listJobs(ctx);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Commesse"
        description="Le commesse collegano clienti, documenti e ore lavorate."
        actions={
          <>
            <ExportMenu
              pdfUrl="/api/export/commesse?format=pdf"
              xlsxUrl="/api/export/commesse?format=xlsx"
            />
            {can(ctx, "jobs", "create") && (
              <Button asChild>
                <Link href="/app/commesse/nuova">
                  <Plus className="size-4" />
                  Nuova commessa
                </Link>
              </Button>
            )}
          </>
        }
      />
      <JobsTable
        data={rows}
        canEdit={can(ctx, "jobs", "edit")}
        canDelete={can(ctx, "jobs", "delete")}
      />
    </div>
  );
}
