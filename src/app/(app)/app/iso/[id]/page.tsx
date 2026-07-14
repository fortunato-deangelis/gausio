import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  AppCard,
  DetailList,
  ExportMenu,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { formatDate, formatDateTime } from "@/lib/format";
import { can, requireWorkspace } from "@/server/workspace";
import { getIsoDocument, listMemberOptions } from "@/features/iso/queries";
import {
  isoStandardLabel,
  isoStatusLabel,
  isoTypeLabel,
} from "@/features/iso/schema";
import { IsoDetailActions } from "@/features/iso/components/iso-detail-actions";
import { RevisionsList } from "@/features/iso/components/revisions-list";
import { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";

export const metadata: Metadata = { title: "Documento ISO" };

const statusTone = {
  draft: "muted",
  in_review: "warning",
  approved: "success",
  obsolete: "destructive",
} as const;

export default async function IsoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireWorkspace();
  if (!can(ctx, "iso", "view")) redirect("/app");

  const { id } = await params;
  const [detail, members] = await Promise.all([
    getIsoDocument(id),
    listMemberOptions(),
  ]);
  if (!detail) notFound();
  const { document } = detail;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${document.code} — ${document.title}`}
        description={`${isoStandardLabel(document.standard)} · ${isoTypeLabel(
          document.type
        )} · Rev. ${document.revision}`}
        backHref="/app/iso"
        backLabel="Documenti ISO"
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/iso/${document.id}?format=pdf`} />
            <IsoDetailActions
              document={{
                id: document.id,
                code: document.code,
                title: document.title,
                standard: document.standard,
                type: document.type,
                status: document.status,
                content: document.content ?? "",
                issueDate: document.issueDate ?? "",
                reviewDate: document.reviewDate ?? "",
                ownerId: document.ownerId ?? "",
                notes: document.notes ?? "",
                changeDescription: "",
              }}
              status={document.status}
              members={members}
              canEdit={can(ctx, "iso", "edit")}
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AppCard title="Informazioni">
            <DetailList
              items={[
                {
                  label: "Stato",
                  value: (
                    <StatusBadge
                      label={isoStatusLabel(document.status)}
                      tone={statusTone[document.status]}
                    />
                  ),
                },
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
              ]}
            />
          </AppCard>

          <AppCard
            title="Contenuto"
            description="Testo della procedura/documento (Markdown)."
          >
            {document.content ? (
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                {document.content}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessun contenuto inserito.
              </p>
            )}
          </AppCard>
        </div>

        <div className="flex flex-col gap-6">
          <RevisionsList
            revisions={detail.revisions}
            currentRevision={document.revision}
          />
          <AttachmentsPanel entityType="iso_document" entityId={document.id} />
        </div>
      </div>
    </div>
  );
}
