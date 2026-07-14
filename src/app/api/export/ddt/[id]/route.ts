import { can, getWorkspaceContext } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { getDdt } from "@/features/ddt/queries";
import { ddtStatusLabel } from "@/features/ddt/schema";
import { formatDate, formatNumber } from "@/lib/format";

/** Export PDF dettaglio DDT. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx || !can(ctx, "ddt", "view")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const data = await getDdt(ctx, id);
  if (!data) return new Response("Non trovato", { status: 404 });
  const { ddt, lines, contact, job } = data;

  const buffer = await buildDetailPdf({
    title: `DDT ${ddt.code}`,
    subtitle: ctx.workspace.name,
    sections: [
      {
        title: "Dati documento",
        fields: [
          {
            label: ddt.direction === "issued" ? "Destinatario" : "Mittente",
            value: contact?.businessName,
          },
          { label: "Partita IVA", value: contact?.vatNumber },
          { label: "Data", value: formatDate(ddt.date) },
          { label: "Stato", value: ddtStatusLabel(ddt.status) },
          { label: "Causale trasporto", value: ddt.transportReason },
          { label: "Trasporto a cura di", value: ddt.transportedBy },
          { label: "Vettore", value: ddt.carrier },
          { label: "Colli", value: ddt.packagesCount?.toString() },
          { label: "Peso", value: ddt.weight },
          { label: "Luogo di destinazione", value: ddt.destinationAddress },
          {
            label: "Commessa",
            value: job ? `${job.code} — ${job.title}` : null,
          },
          { label: "Note", value: ddt.notes },
        ],
      },
      {
        title: "Righe merce",
        table: {
          headers: ["Descrizione", "Quantità", "Unità"],
          rows: lines.map((line) => [
            line.description,
            formatNumber(line.quantity),
            line.unit,
          ]),
        },
      },
    ],
  });

  return fileResponse(buffer, `ddt-${ddt.code}`, "pdf");
}
