import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import {
  AppCard,
  DetailList,
  EmptyState,
  ExportMenu,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { formatDate } from "@/lib/format";
import {
  getContact,
  listContactJobs,
} from "@/features/contacts/queries";
import { ContactEditDialog } from "@/features/contacts/components/contact-edit-dialog";
import {
  CONTACT_KIND_LABELS,
  CONTACT_KIND_TONES,
  QUALIFICATION_LABELS,
  QUALIFICATION_TONES,
} from "@/features/contacts/schema";
import { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";

export const metadata = { title: "Dettaglio contatto" };

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireWorkspace();
  if (!can(ctx, "contacts", "view")) redirect("/app");

  const { id } = await params;
  const query = await searchParams;
  const contact = await getContact(ctx, id);
  if (!contact) notFound();

  const jobs = await listContactJobs(ctx, id);
  const isSupplier = contact.kind !== "client";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={contact.businessName}
        description={CONTACT_KIND_LABELS[contact.kind]}
        backHref="/app/contatti"
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/contatti/${contact.id}`} />
            {can(ctx, "contacts", "edit") && (
              <ContactEditDialog
                contactId={contact.id}
                initialOpen={query.edit === "1"}
                defaultValues={{
                  businessName: contact.businessName,
                  kind: contact.kind,
                  vatNumber: contact.vatNumber ?? "",
                  fiscalCode: contact.fiscalCode ?? "",
                  email: contact.email ?? "",
                  pec: contact.pec ?? "",
                  phone: contact.phone ?? "",
                  website: contact.website ?? "",
                  address: contact.address ?? "",
                  city: contact.city ?? "",
                  zipCode: contact.zipCode ?? "",
                  province: contact.province ?? "",
                  country: contact.country ?? "IT",
                  sdiCode: contact.sdiCode ?? "",
                  iban: contact.iban ?? "",
                  paymentTerms: contact.paymentTerms ?? "",
                  notes: contact.notes ?? "",
                  qualification: contact.qualification,
                  qualificationDate: contact.qualificationDate ?? "",
                  qualificationExpiry: contact.qualificationExpiry ?? "",
                  qualificationNotes: contact.qualificationNotes ?? "",
                }}
              />
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AppCard title="Anagrafica">
            <DetailList
              items={[
                {
                  label: "Tipo",
                  value: (
                    <StatusBadge
                      label={CONTACT_KIND_LABELS[contact.kind]}
                      tone={CONTACT_KIND_TONES[contact.kind]}
                    />
                  ),
                },
                { label: "Partita IVA", value: contact.vatNumber },
                { label: "Codice fiscale", value: contact.fiscalCode },
                { label: "Email", value: contact.email },
                { label: "PEC", value: contact.pec },
                { label: "Telefono", value: contact.phone },
                { label: "Sito web", value: contact.website },
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
                { label: "Codice SDI", value: contact.sdiCode },
                { label: "IBAN", value: contact.iban },
                { label: "Termini di pagamento", value: contact.paymentTerms },
                { label: "Note", value: contact.notes },
              ]}
            />
          </AppCard>

          {isSupplier && (
            <AppCard title="Qualifica fornitore">
              <DetailList
                items={[
                  {
                    label: "Stato",
                    value: (
                      <StatusBadge
                        label={QUALIFICATION_LABELS[contact.qualification]}
                        tone={QUALIFICATION_TONES[contact.qualification]}
                      />
                    ),
                  },
                  {
                    label: "Data qualifica",
                    value: formatDate(contact.qualificationDate),
                  },
                  {
                    label: "Scadenza qualifica",
                    value: formatDate(contact.qualificationExpiry),
                  },
                  { label: "Note", value: contact.qualificationNotes },
                ]}
              />
            </AppCard>
          )}

          <AppCard
            title="Commesse collegate"
            description="Le commesse più recenti di questo contatto."
          >
            {jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Nessuna commessa"
                description="Le commesse collegate a questo contatto compariranno qui."
              />
            ) : (
              <ul className="flex flex-col divide-y">
                {jobs.map((job) => (
                  <li key={job.id} className="py-2.5">
                    <Link
                      href={`/app/commesse/${job.id}`}
                      className="flex items-center justify-between gap-3 hover:underline"
                    >
                      <span className="text-sm font-medium">
                        {job.code} — {job.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AppCard>
        </div>

        <div className="flex flex-col gap-6">
          <AttachmentsPanel entityType="contact" entityId={contact.id} />
        </div>
      </div>
    </div>
  );
}
