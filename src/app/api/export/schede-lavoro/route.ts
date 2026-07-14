import { requirePermission } from "@/server/workspace";
import { buildListPdf } from "@/server/export/pdf";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { fileResponse } from "@/server/export/response";
import { formatDate, formatNumber } from "@/lib/format";
import { listWorkLogs, type WorkLogListRow } from "@/features/hr/queries";

const columns: ExportColumn<WorkLogListRow>[] = [
  { header: "Data", value: (r) => formatDate(r.date) },
  { header: "Dipendente", value: (r) => r.employeeName },
  { header: "Commessa", value: (r) => r.jobLabel, width: 32 },
  { header: "Ore", value: (r) => formatNumber(r.hours) },
  { header: "Descrizione", value: (r) => r.description, width: 40 },
];

export async function GET(request: Request) {
  try {
    await requirePermission("hr", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const format = new URL(request.url).searchParams.get("format") ?? "pdf";
  const rows = await listWorkLogs();

  if (format === "xlsx") {
    const buffer = await buildXlsx("Schede lavoro", columns, rows);
    return fileResponse(buffer, "schede-lavoro", "xlsx");
  }
  const buffer = await buildListPdf({
    title: "Schede lavoro",
    subtitle: `Generato il ${formatDate(new Date())}`,
    columns,
    rows,
    landscape: true,
  });
  return fileResponse(buffer, "schede-lavoro", "pdf");
}
