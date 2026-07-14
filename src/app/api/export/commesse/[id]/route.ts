import { requirePermission } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getJob, getJobSummary } from "@/features/jobs/queries";
import { JOB_STATUS_LABELS } from "@/features/jobs/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await requirePermission("jobs", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const { id } = await params;
  const job = await getJob(ctx, id);
  if (!job) return new Response("Non trovata", { status: 404 });

  const summary = await getJobSummary(ctx, id);

  const buffer = await buildDetailPdf({
    title: `${job.code} — ${job.title}`,
    subtitle: ctx.workspace.name,
    sections: [
      {
        title: "Dati commessa",
        fields: [
          { label: "Codice", value: job.code },
          { label: "Stato", value: JOB_STATUS_LABELS[job.status] },
          { label: "Cliente", value: job.clientName },
          { label: "Data inizio", value: formatDate(job.startDate) },
          { label: "Data fine", value: formatDate(job.endDate) },
          { label: "Budget", value: formatCurrency(job.budgetAmount) },
          { label: "Ore stimate", value: formatNumber(job.estimatedHours) },
          { label: "Ore registrate", value: formatNumber(summary.totalHours) },
        ],
      },
      ...(job.description
        ? [{ title: "Descrizione", text: job.description }]
        : []),
      ...(summary.orders.length
        ? [
            {
              title: "Ordini collegati",
              table: {
                headers: ["Codice", "Data", "Stato", "Totale"],
                rows: summary.orders.map((o) => [
                  o.code,
                  formatDate(o.date),
                  o.status,
                  formatCurrency(o.total),
                ]),
              },
            },
          ]
        : []),
      ...(summary.invoices.length
        ? [
            {
              title: "Fatture collegate",
              table: {
                headers: ["Codice", "Data", "Stato", "Totale"],
                rows: summary.invoices.map((i) => [
                  i.code,
                  formatDate(i.date),
                  i.status,
                  formatCurrency(i.total),
                ]),
              },
            },
          ]
        : []),
      ...(summary.ddts.length
        ? [
            {
              title: "DDT collegati",
              table: {
                headers: ["Codice", "Data", "Stato"],
                rows: summary.ddts.map((d) => [
                  d.code,
                  formatDate(d.date),
                  d.status,
                ]),
              },
            },
          ]
        : []),
      ...(job.notes ? [{ title: "Note", text: job.notes }] : []),
    ],
  });

  return fileResponse(buffer, `commessa-${job.code}`, "pdf");
}
