import { requirePermission } from "@/server/workspace";
import { buildListPdf } from "@/server/export/pdf";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { fileResponse } from "@/server/export/response";
import { formatDate } from "@/lib/format";
import { listEmployees, type EmployeeRow } from "@/features/hr/queries";
import { EMPLOYEE_STATUSES } from "@/features/hr/schema";

const columns: ExportColumn<EmployeeRow>[] = [
  { header: "Cognome", value: (r) => r.lastName },
  { header: "Nome", value: (r) => r.firstName },
  { header: "Codice fiscale", value: (r) => r.fiscalCode },
  { header: "Email", value: (r) => r.email },
  { header: "Telefono", value: (r) => r.phone },
  { header: "Mansione", value: (r) => r.jobTitle },
  { header: "Reparto", value: (r) => r.department },
  { header: "Contratto", value: (r) => r.contractType },
  { header: "Assunzione", value: (r) => formatDate(r.hiredAt) },
  {
    header: "Stato",
    value: (r) =>
      EMPLOYEE_STATUSES.find((s) => s.value === r.status)?.label ?? r.status,
  },
];

export async function GET(request: Request) {
  try {
    await requirePermission("hr", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const format = new URL(request.url).searchParams.get("format") ?? "pdf";
  const rows = await listEmployees();

  if (format === "xlsx") {
    const buffer = await buildXlsx("Dipendenti", columns, rows);
    return fileResponse(buffer, "dipendenti", "xlsx");
  }
  const buffer = await buildListPdf({
    title: "Elenco dipendenti",
    subtitle: `Generato il ${formatDate(new Date())}`,
    columns,
    rows,
    landscape: true,
  });
  return fileResponse(buffer, "dipendenti", "pdf");
}
