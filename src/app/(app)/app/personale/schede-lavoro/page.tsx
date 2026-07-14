import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import {
  employeeOptions,
  jobOptions,
  listWorkLogs,
} from "@/features/hr/queries";
import { WorkLogsTable } from "@/features/hr/components/work-logs-table";
import { WorkLogFormDialog } from "@/features/hr/components/work-log-form-dialog";

export const metadata: Metadata = { title: "Schede lavoro" };

export default async function SchedeLavoroPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "hr", "view")) redirect("/app");

  const [rows, employees, jobs] = await Promise.all([
    listWorkLogs(),
    employeeOptions(),
    jobOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schede lavoro"
        description="Ore dei dipendenti imputate alle commesse."
        backHref="/app/personale"
        backLabel="Personale"
        actions={
          <>
            <ExportMenu
              pdfUrl="/api/export/schede-lavoro?format=pdf"
              xlsxUrl="/api/export/schede-lavoro?format=xlsx"
            />
            {can(ctx, "hr", "create") && (
              <WorkLogFormDialog
                employees={employees}
                jobs={jobs}
                trigger={
                  <Button>
                    <Plus className="size-4" />
                    Nuova scheda
                  </Button>
                }
              />
            )}
          </>
        }
      />
      <WorkLogsTable
        rows={rows}
        employees={employees}
        jobs={jobs}
        canCreate={can(ctx, "hr", "create")}
        canEdit={can(ctx, "hr", "edit")}
        canDelete={can(ctx, "hr", "delete")}
      />
    </div>
  );
}
