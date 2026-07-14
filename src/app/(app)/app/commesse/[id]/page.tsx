import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, FileText, ShoppingCart } from "lucide-react";
import {
  AppCard,
  DetailList,
  ExportMenu,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { searchContactOptions } from "@/features/contacts/queries";
import {
  getJob,
  getJobSummary,
  listMemberOptions,
} from "@/features/jobs/queries";
import { JobEditDialog } from "@/features/jobs/components/job-edit-dialog";
import { JOB_STATUS_LABELS, JOB_STATUS_TONES } from "@/features/jobs/schema";
import { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";

export const metadata = { title: "Dettaglio commessa" };

function LinkedDocsList({
  docs,
  hrefPrefix,
  emptyLabel,
}: {
  docs: readonly {
    id: string;
    code: string;
    status: string;
    total: string | null;
    date: string | null;
  }[];
  hrefPrefix: string;
  emptyLabel: string;
}) {
  if (docs.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="flex flex-col divide-y">
      {docs.map((doc) => (
        <li key={doc.id} className="py-2">
          <Link
            href={`${hrefPrefix}/${doc.id}`}
            className="flex items-center justify-between gap-3 text-sm hover:underline"
          >
            <span className="font-medium">{doc.code}</span>
            <span className="text-muted-foreground">
              {formatDate(doc.date)}
              {doc.total !== null && ` · ${formatCurrency(doc.total)}`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireWorkspace();
  if (!can(ctx, "jobs", "view")) redirect("/app");

  const { id } = await params;
  const query = await searchParams;
  const job = await getJob(ctx, id);
  if (!job) notFound();

  const [summary, clientOptions, memberOptions] = await Promise.all([
    getJobSummary(ctx, id),
    searchContactOptions(ctx, "client"),
    listMemberOptions(ctx),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${job.code} — ${job.title}`}
        description={job.clientName ?? undefined}
        backHref="/app/commesse"
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/commesse/${job.id}`} />
            {can(ctx, "jobs", "edit") && (
              <JobEditDialog
                jobId={job.id}
                initialOpen={query.edit === "1"}
                clientOptions={clientOptions}
                memberOptions={memberOptions}
                defaultValues={{
                  title: job.title,
                  description: job.description ?? "",
                  clientId: job.clientId ?? "",
                  status: job.status,
                  startDate: job.startDate ?? "",
                  endDate: job.endDate ?? "",
                  budgetAmount: job.budgetAmount ?? "",
                  estimatedHours: job.estimatedHours ?? "",
                  managerId: job.managerId ?? "",
                  notes: job.notes ?? "",
                }}
              />
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Ore registrate"
          value={formatNumber(summary.totalHours)}
          icon={Clock}
          tone="primary"
          hint={
            job.estimatedHours
              ? `su ${formatNumber(job.estimatedHours)} stimate`
              : undefined
          }
        />
        <StatCard
          label="Ordini collegati"
          value={String(summary.orders.length)}
          icon={ShoppingCart}
          tone="info"
        />
        <StatCard
          label="Fatture collegate"
          value={String(summary.invoices.length)}
          icon={FileText}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AppCard title="Dati commessa">
            <DetailList
              items={[
                { label: "Codice", value: job.code },
                {
                  label: "Stato",
                  value: (
                    <StatusBadge
                      label={JOB_STATUS_LABELS[job.status]}
                      tone={JOB_STATUS_TONES[job.status]}
                    />
                  ),
                },
                {
                  label: "Cliente",
                  value: job.clientId ? (
                    <Link
                      href={`/app/contatti/${job.clientId}`}
                      className="underline underline-offset-2"
                    >
                      {job.clientName}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                { label: "Data inizio", value: formatDate(job.startDate) },
                { label: "Data fine", value: formatDate(job.endDate) },
                { label: "Budget", value: formatCurrency(job.budgetAmount) },
                {
                  label: "Ore stimate",
                  value: formatNumber(job.estimatedHours),
                },
                { label: "Descrizione", value: job.description },
                { label: "Note", value: job.notes },
              ]}
            />
          </AppCard>

          <div className="grid gap-6 md:grid-cols-3">
            <AppCard title="Ordini">
              <LinkedDocsList
                docs={summary.orders}
                hrefPrefix="/app/vendite/ordini"
                emptyLabel="Nessun ordine collegato."
              />
            </AppCard>
            <AppCard title="Fatture">
              <LinkedDocsList
                docs={summary.invoices}
                hrefPrefix="/app/vendite/fatture"
                emptyLabel="Nessuna fattura collegata."
              />
            </AppCard>
            <AppCard title="DDT">
              <LinkedDocsList
                docs={summary.ddts}
                hrefPrefix="/app/logistica/ddt"
                emptyLabel="Nessun DDT collegato."
              />
            </AppCard>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <AttachmentsPanel entityType="job" entityId={job.id} />
        </div>
      </div>
    </div>
  );
}
