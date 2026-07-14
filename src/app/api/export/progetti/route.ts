import { requirePermission } from "@/server/workspace";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { buildListPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { formatDate } from "@/lib/format";
import { listProjects, type ProjectListRow } from "@/features/projects/queries";
import { PROJECT_STATUS_LABELS } from "@/features/projects/schema";

const columns: ExportColumn<ProjectListRow>[] = [
  { header: "Nome", value: (r) => r.name, width: 34 },
  { header: "Cliente", value: (r) => r.clientName, width: 28 },
  { header: "Commessa", value: (r) => r.jobCode },
  { header: "Stato", value: (r) => PROJECT_STATUS_LABELS[r.status] },
  {
    header: "Avanzamento",
    value: (r) => `${r.tasksDone}/${r.tasksTotal}`,
  },
  { header: "Scadenza", value: (r) => formatDate(r.endDate) },
];

export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requirePermission("projects", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const format =
    new URL(request.url).searchParams.get("format") === "pdf" ? "pdf" : "xlsx";
  const rows = await listProjects(ctx);

  if (format === "pdf") {
    const buffer = await buildListPdf({
      title: "Progetti",
      subtitle: ctx.workspace.name,
      columns,
      rows,
    });
    return fileResponse(buffer, "progetti", "pdf");
  }

  const buffer = await buildXlsx("Progetti", columns, rows);
  return fileResponse(buffer, "progetti", "xlsx");
}
