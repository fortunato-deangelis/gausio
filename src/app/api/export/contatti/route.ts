import { requirePermission } from "@/server/workspace";
import { buildXlsx, type ExportColumn } from "@/server/export/xlsx";
import { buildListPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { listContacts, type ContactListRow } from "@/features/contacts/queries";
import {
  CONTACT_KIND_LABELS,
  QUALIFICATION_LABELS,
  type ContactKind,
} from "@/features/contacts/schema";

const columns: ExportColumn<ContactListRow>[] = [
  { header: "Ragione sociale", value: (r) => r.businessName, width: 32 },
  { header: "Tipo", value: (r) => CONTACT_KIND_LABELS[r.kind] },
  { header: "P.IVA", value: (r) => r.vatNumber },
  { header: "Email", value: (r) => r.email, width: 28 },
  { header: "Telefono", value: (r) => r.phone },
  { header: "Città", value: (r) => r.city },
  {
    header: "Qualifica",
    value: (r) =>
      r.kind === "client" ? "" : QUALIFICATION_LABELS[r.qualification],
  },
];

export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requirePermission("contacts", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";
  const kindParam = url.searchParams.get("kind");
  const kind =
    kindParam === "client" || kindParam === "supplier"
      ? (kindParam as ContactKind)
      : null;

  const rows = await listContacts(ctx, { kind });

  if (format === "pdf") {
    const buffer = await buildListPdf({
      title: "Clienti e fornitori",
      subtitle: ctx.workspace.name,
      columns,
      rows,
      landscape: true,
    });
    return fileResponse(buffer, "contatti", "pdf");
  }

  const buffer = await buildXlsx("Contatti", columns, rows);
  return fileResponse(buffer, "contatti", "xlsx");
}
