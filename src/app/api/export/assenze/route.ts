import { requirePermission } from "@/server/workspace";
import { buildListPdf } from "@/server/export/pdf";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { fileResponse } from "@/server/export/response";
import { formatDate } from "@/lib/format";
import { listLeaveRequests, type LeaveListRow } from "@/features/hr/queries";
import { LEAVE_STATUSES, LEAVE_TYPES } from "@/features/hr/schema";

const columns: ExportColumn<LeaveListRow>[] = [
  { header: "Dipendente", value: (r) => r.employeeName },
  {
    header: "Tipo",
    value: (r) => LEAVE_TYPES.find((t) => t.value === r.type)?.label ?? r.type,
  },
  { header: "Dal", value: (r) => formatDate(r.startDate) },
  { header: "Al", value: (r) => formatDate(r.endDate) },
  { header: "Dalle", value: (r) => r.startTime?.slice(0, 5) ?? "" },
  { header: "Alle", value: (r) => r.endTime?.slice(0, 5) ?? "" },
  {
    header: "Stato",
    value: (r) =>
      LEAVE_STATUSES.find((s) => s.value === r.status)?.label ?? r.status,
  },
  { header: "Motivazione", value: (r) => r.reason, width: 36 },
];

export async function GET(request: Request) {
  try {
    await requirePermission("hr", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "pdf";
  const rows = await listLeaveRequests(url.searchParams.get("status") ?? undefined);

  if (format === "xlsx") {
    const buffer = await buildXlsx("Assenze", columns, rows);
    return fileResponse(buffer, "assenze", "xlsx");
  }
  const buffer = await buildListPdf({
    title: "Registro assenze",
    subtitle: `Generato il ${formatDate(new Date())}`,
    columns,
    rows,
    landscape: true,
  });
  return fileResponse(buffer, "assenze", "pdf");
}
