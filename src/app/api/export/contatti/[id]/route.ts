import { requirePermission } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { formatDate } from "@/lib/format";
import { getContact } from "@/features/contacts/queries";
import {
  CONTACT_KIND_LABELS,
  QUALIFICATION_LABELS,
} from "@/features/contacts/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await requirePermission("contacts", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const { id } = await params;
  const contact = await getContact(ctx, id);
  if (!contact) return new Response("Non trovato", { status: 404 });

  const buffer = await buildDetailPdf({
    title: contact.businessName,
    subtitle: `${CONTACT_KIND_LABELS[contact.kind]} · ${ctx.workspace.name}`,
    sections: [
      {
        title: "Anagrafica",
        fields: [
          { label: "Ragione sociale", value: contact.businessName },
          { label: "Tipo", value: CONTACT_KIND_LABELS[contact.kind] },
          { label: "Partita IVA", value: contact.vatNumber },
          { label: "Codice fiscale", value: contact.fiscalCode },
          {
            label: "Indirizzo",
            value: [
              contact.address,
              contact.zipCode,
              contact.city,
              contact.province,
            ]
              .filter(Boolean)
              .join(", "),
          },
        ],
      },
      {
        title: "Contatti",
        fields: [
          { label: "Email", value: contact.email },
          { label: "PEC", value: contact.pec },
          { label: "Telefono", value: contact.phone },
          { label: "Sito web", value: contact.website },
          { label: "Codice SDI", value: contact.sdiCode },
          { label: "IBAN", value: contact.iban },
          { label: "Termini di pagamento", value: contact.paymentTerms },
        ],
      },
      ...(contact.kind !== "client"
        ? [
            {
              title: "Qualifica fornitore",
              fields: [
                {
                  label: "Stato",
                  value: QUALIFICATION_LABELS[contact.qualification],
                },
                {
                  label: "Data qualifica",
                  value: formatDate(contact.qualificationDate),
                },
                {
                  label: "Scadenza",
                  value: formatDate(contact.qualificationExpiry),
                },
                { label: "Note", value: contact.qualificationNotes },
              ],
            },
          ]
        : []),
      ...(contact.notes ? [{ title: "Note", text: contact.notes }] : []),
    ],
  });

  return fileResponse(buffer, `contatto-${contact.businessName}`, "pdf");
}
