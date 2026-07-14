import { requirePermission } from "@/server/workspace";
import { buildListPdf } from "@/server/export/pdf";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { fileResponse } from "@/server/export/response";
import { formatDate } from "@/lib/format";
import { listIsoDocuments, type IsoDocumentRow } from "@/features/iso/queries";
import {
  isoStandardLabel,
  isoStatusLabel,
  isoTypeLabel,
} from "@/features/iso/schema";

const columns: ExportColumn<IsoDocumentRow>[] = [
  { header: "Codice", value: (r) => r.code },
  { header: "Titolo", value: (r) => r.title, width: 40 },
  { header: "Norma", value: (r) => isoStandardLabel(r.standard) },
  { header: "Tipo", value: (r) => isoTypeLabel(r.type) },
  { header: "Revisione", value: (r) => `Rev. ${r.revision}` },
  { header: "Stato", value: (r) => isoStatusLabel(r.status) },
  { header: "Emissione", value: (r) => formatDate(r.issueDate) },
  { header: "Riesame", value: (r) => formatDate(r.reviewDate) },
];

export async function GET(request: Request) {
  try {
    await requirePermission("iso", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "pdf";
  const rows = await listIsoDocuments({
    standard: url.searchParams.get("standard") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  if (format === "xlsx") {
    const buffer = await buildXlsx("Documenti ISO", columns, rows);
    return fileResponse(buffer, "documenti-iso", "xlsx");
  }
  const buffer = await buildListPdf({
    title: "Elenco documenti ISO",
    subtitle: `Generato il ${formatDate(new Date())}`,
    columns,
    rows,
    landscape: true,
  });
  return fileResponse(buffer, "documenti-iso", "pdf");
}
