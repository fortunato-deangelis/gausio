import { requirePermission } from "@/server/workspace";
import { buildListPdf } from "@/server/export/pdf";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { fileResponse } from "@/server/export/response";
import { formatDate } from "@/lib/format";
import { listTimeEntries, type TimeEntryListRow } from "@/features/hr/queries";

const columns: ExportColumn<TimeEntryListRow>[] = [
  { header: "Dipendente", value: (r) => r.employeeName },
  { header: "Data", value: (r) => formatDate(r.date) },
  { header: "Entrata", value: (r) => r.clockIn.slice(0, 5) },
  { header: "Uscita", value: (r) => r.clockOut?.slice(0, 5) ?? "" },
  { header: "Pausa (min)", value: (r) => r.breakMinutes ?? "0" },
  { header: "Ore", value: (r) => r.hoursLabel },
  { header: "Note", value: (r) => r.notes, width: 36 },
];

export async function GET(request: Request) {
  try {
    await requirePermission("hr", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const format = new URL(request.url).searchParams.get("format") ?? "pdf";
  const rows = await listTimeEntries();

  if (format === "xlsx") {
    const buffer = await buildXlsx("Timbrature", columns, rows);
    return fileResponse(buffer, "timbrature", "xlsx");
  }
  const buffer = await buildListPdf({
    title: "Registro timbrature",
    subtitle: `Generato il ${formatDate(new Date())}`,
    columns,
    rows,
  });
  return fileResponse(buffer, "timbrature", "pdf");
}
