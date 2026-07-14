import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Button,
  ExportMenu,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { employeeOptions, listLeaveRequests } from "@/features/hr/queries";
import { LeavesTable } from "@/features/hr/components/leaves-table";
import { LeaveFormDialog } from "@/features/hr/components/leave-form-dialog";

export const metadata: Metadata = { title: "Assenze" };

const STATUS_TABS = [
  { value: "", label: "Tutte" },
  { value: "pending", label: "In attesa" },
  { value: "approved", label: "Approvate" },
  { value: "rejected", label: "Rifiutate" },
] as const;

export default async function AssenzePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireWorkspace();
  if (!can(ctx, "hr", "view")) redirect("/app");

  const { status } = await searchParams;
  const [rows, employees] = await Promise.all([
    listLeaveRequests(status),
    employeeOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assenze"
        description="Richieste di ferie, permessi e malattia."
        backHref="/app/personale"
        backLabel="Personale"
        actions={
          <>
            <ExportMenu
              pdfUrl="/api/export/assenze?format=pdf"
              xlsxUrl="/api/export/assenze?format=xlsx"
            />
            {can(ctx, "hr", "create") && (
              <LeaveFormDialog
                employees={employees}
                trigger={
                  <Button>
                    <Plus className="size-4" />
                    Nuova richiesta
                  </Button>
                }
              />
            )}
          </>
        }
      />

      <Tabs value={status ?? ""}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link
                href={
                  tab.value
                    ? `/app/personale/assenze?status=${tab.value}`
                    : "/app/personale/assenze"
                }
              >
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <LeavesTable
        rows={rows}
        employees={employees}
        canCreate={can(ctx, "hr", "create")}
        canEdit={can(ctx, "hr", "edit")}
        canDelete={can(ctx, "hr", "delete")}
      />
    </div>
  );
}
