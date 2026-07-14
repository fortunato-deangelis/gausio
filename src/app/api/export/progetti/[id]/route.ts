import { requirePermission } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { formatDate, formatNumber } from "@/lib/format";
import { getProjectWithTasks } from "@/features/projects/queries";
import {
  PROJECT_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  taskStatuses,
} from "@/features/projects/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await requirePermission("projects", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const { id } = await params;
  const project = await getProjectWithTasks(ctx, id);
  if (!project) return new Response("Non trovato", { status: 404 });

  const buffer = await buildDetailPdf({
    title: project.name,
    subtitle: ctx.workspace.name,
    sections: [
      {
        title: "Dati progetto",
        fields: [
          { label: "Stato", value: PROJECT_STATUS_LABELS[project.status] },
          { label: "Cliente", value: project.clientName },
          { label: "Commessa", value: project.jobCode },
          { label: "Inizio", value: formatDate(project.startDate) },
          { label: "Fine", value: formatDate(project.endDate) },
          { label: "Budget ore", value: formatNumber(project.budgetHours) },
        ],
      },
      ...(project.description
        ? [{ title: "Descrizione", text: project.description }]
        : []),
      ...taskStatuses
        .map((status) => {
          const tasks = project.tasks.filter((t) => t.status === status);
          if (tasks.length === 0) return null;
          return {
            title: `Attività — ${TASK_STATUS_LABELS[status]}`,
            table: {
              headers: ["Titolo", "Priorità", "Assegnatario", "Scadenza"],
              rows: tasks.map((t) => [
                t.title,
                TASK_PRIORITY_LABELS[t.priority],
                t.assigneeName,
                formatDate(t.dueDate),
              ]),
            },
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
    ],
  });

  return fileResponse(buffer, `progetto-${project.name}`, "pdf");
}
