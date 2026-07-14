import { requirePermission } from "@/server/workspace";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { buildListPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { formatCurrency, formatDate } from "@/lib/format";
import { listJobs, type JobListRow } from "@/features/jobs/queries";
import { JOB_STATUS_LABELS } from "@/features/jobs/schema";

const columns: ExportColumn<JobListRow>[] = [
  { header: "Codice", value: (r) => r.code },
  { header: "Titolo", value: (r) => r.title, width: 36 },
  { header: "Cliente", value: (r) => r.clientName, width: 28 },
  { header: "Stato", value: (r) => JOB_STATUS_LABELS[r.status] },
  { header: "Inizio", value: (r) => formatDate(r.startDate) },
  { header: "Fine", value: (r) => formatDate(r.endDate) },
  { header: "Budget", value: (r) => formatCurrency(r.budgetAmount) },
];

export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requirePermission("jobs", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const format =
    new URL(request.url).searchParams.get("format") === "pdf" ? "pdf" : "xlsx";
  const rows = await listJobs(ctx);

  if (format === "pdf") {
    const buffer = await buildListPdf({
      title: "Commesse",
      subtitle: ctx.workspace.name,
      columns,
      rows,
      landscape: true,
    });
    return fileResponse(buffer, "commesse", "pdf");
  }

  const buffer = await buildXlsx("Commesse", columns, rows);
  return fileResponse(buffer, "commesse", "xlsx");
}
