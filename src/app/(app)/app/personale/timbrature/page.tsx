import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { employeeOptions, listTimeEntries } from "@/features/hr/queries";
import { TimeEntriesTable } from "@/features/hr/components/time-entries-table";
import { TimeEntryFormDialog } from "@/features/hr/components/time-entry-form-dialog";

export const metadata: Metadata = { title: "Timbrature" };

export default async function TimbraturePage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "hr", "view")) redirect("/app");

  const [rows, employees] = await Promise.all([
    listTimeEntries(),
    employeeOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Timbrature"
        description="Entrate, uscite e pause dei dipendenti."
        backHref="/app/personale"
        backLabel="Personale"
        actions={
          <>
            <ExportMenu
              pdfUrl="/api/export/timbrature?format=pdf"
              xlsxUrl="/api/export/timbrature?format=xlsx"
            />
            {can(ctx, "hr", "create") && (
              <TimeEntryFormDialog
                employees={employees}
                trigger={
                  <Button>
                    <Plus className="size-4" />
                    Nuova timbratura
                  </Button>
                }
              />
            )}
          </>
        }
      />
      <TimeEntriesTable
        rows={rows}
        employees={employees}
        canCreate={can(ctx, "hr", "create")}
        canEdit={can(ctx, "hr", "edit")}
        canDelete={can(ctx, "hr", "delete")}
      />
    </div>
  );
}
