import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, ExportMenu, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listEmployees } from "@/features/hr/queries";
import { EmployeesTable } from "@/features/hr/components/employees-table";
import { EmployeeFormDialog } from "@/features/hr/components/employee-form-dialog";
import type { EmployeeTableRow } from "@/features/hr/components/employees-table";

export const metadata: Metadata = { title: "Personale" };

export default async function PersonalePage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "hr", "view")) redirect("/app");

  const employees = await listEmployees();
  const rows: EmployeeTableRow[] = employees.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    fiscalCode: e.fiscalCode ?? "",
    email: e.email ?? "",
    phone: e.phone ?? "",
    birthDate: e.birthDate ?? "",
    birthPlace: e.birthPlace ?? "",
    address: e.address ?? "",
    city: e.city ?? "",
    zipCode: e.zipCode ?? "",
    province: e.province ?? "",
    jobTitle: e.jobTitle ?? "",
    department: e.department ?? "",
    contractType: e.contractType ?? "",
    hiredAt: e.hiredAt ?? "",
    terminatedAt: e.terminatedAt ?? "",
    status: e.status,
    hourlyCost: e.hourlyCost ?? "",
    annualLeaveDays: e.annualLeaveDays ?? "",
    notes: e.notes ?? "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Personale"
        description="Anagrafica dei dipendenti, assenze, timbrature e schede lavoro."
        actions={
          <>
            <ExportMenu
              pdfUrl="/api/export/personale?format=pdf"
              xlsxUrl="/api/export/personale?format=xlsx"
            />
            {can(ctx, "hr", "create") && (
              <EmployeeFormDialog
                trigger={
                  <Button>
                    <Plus className="size-4" />
                    Nuovo dipendente
                  </Button>
                }
              />
            )}
          </>
        }
      />
      <EmployeesTable
        rows={rows}
        canCreate={can(ctx, "hr", "create")}
        canEdit={can(ctx, "hr", "edit")}
        canDelete={can(ctx, "hr", "delete")}
      />
    </div>
  );
}
