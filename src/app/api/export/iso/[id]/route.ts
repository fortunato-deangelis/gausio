import { requirePermission } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { formatDate, formatDateTime } from "@/lib/format";
import { getIsoDocument } from "@/features/iso/queries";
import {
  isoStandardLabel,
  isoStatusLabel,
  isoTypeLabel,
} from "@/features/iso/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("iso", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const { id } = await params;
  const detail = await getIsoDocument(id);
  if (!detail) return new Response("Non trovato", { status: 404 });
  const { document } = detail;

  const buffer = await buildDetailPdf({
    title: `${document.code} — ${document.title}`,
    subtitle: `${isoStandardLabel(document.standard)} · ${isoTypeLabel(
      document.type
    )} · Rev. ${document.revision}`,
    sections: [
      {
        title: "Informazioni",
        fields: [
          { label: "Stato", value: isoStatusLabel(document.status) },
          { label: "Norma", value: isoStandardLabel(document.standard) },
          { label: "Tipo", value: isoTypeLabel(document.type) },
          { label: "Revisione", value: `Rev. ${document.revision}` },
          { label: "Emissione", value: formatDate(document.issueDate) },
          { label: "Prossimo riesame", value: formatDate(document.reviewDate) },
          { label: "Responsabile", value: detail.ownerName },
          {
            label: "Approvazione",
            value: document.approvedAt
              ? `${formatDateTime(document.approvedAt)}${
                  detail.approverName ? ` · ${detail.approverName}` : ""
                }`
              : null,
          },
          { label: "Note", value: document.notes },
        ],
      },
      {
        title: "Contenuto",
        text: document.content ?? "Nessun contenuto inserito.",
      },
      {
        title: "Storico revisioni",
        table: {
          headers: ["Revisione", "Data", "Autore", "Descrizione modifica"],
          rows: detail.revisions.map((r) => [
            `Rev. ${r.revision} → Rev. ${r.revision + 1}`,
            formatDateTime(r.createdAt),
            r.authorName ?? "",
            r.changeDescription ?? "",
          ]),
        },
      },
    ],
  });

  return fileResponse(buffer, `iso-${document.code.toLowerCase()}`, "pdf");
}
