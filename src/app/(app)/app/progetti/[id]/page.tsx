import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AppCard,
  DetailList,
  ExportMenu,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { formatDate, formatNumber } from "@/lib/format";
import { searchContactOptions } from "@/features/contacts/queries";
import { listMemberOptions, searchJobOptions } from "@/features/jobs/queries";
import { getProjectWithTasks } from "@/features/projects/queries";
import { ProjectBoard } from "@/features/projects/components/project-board";
import { ProjectEditDialog } from "@/features/projects/components/project-edit-dialog";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
} from "@/features/projects/schema";
import { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";

export const metadata = { title: "Dettaglio progetto" };

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireWorkspace();
  if (!can(ctx, "projects", "view")) redirect("/app");

  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectWithTasks(ctx, id);
  if (!project) notFound();

  const [clientOptions, jobOptions, memberOptions] = await Promise.all([
    searchContactOptions(ctx, "client"),
    searchJobOptions(ctx),
    listMemberOptions(ctx),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={project.name}
        description={project.clientName ?? undefined}
        backHref="/app/progetti"
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/progetti/${project.id}`} />
            {can(ctx, "projects", "edit") && (
              <ProjectEditDialog
                projectId={project.id}
                initialOpen={query.edit === "1"}
                clientOptions={clientOptions}
                jobOptions={jobOptions}
                memberOptions={memberOptions}
                defaultValues={{
                  name: project.name,
                  description: project.description ?? "",
                  status: project.status,
                  clientId: project.clientId ?? "",
                  jobId: project.jobId ?? "",
                  startDate: project.startDate ?? "",
                  endDate: project.endDate ?? "",
                  budgetHours: project.budgetHours ?? "",
                  managerId: project.managerId ?? "",
                }}
              />
            )}
          </>
        }
      />

      <AppCard>
        <DetailList
          columns={3}
          items={[
            {
              label: "Stato",
              value: (
                <StatusBadge
                  label={PROJECT_STATUS_LABELS[project.status]}
                  tone={PROJECT_STATUS_TONES[project.status]}
                />
              ),
            },
            {
              label: "Cliente",
              value: project.clientId ? (
                <Link
                  href={`/app/contatti/${project.clientId}`}
                  className="underline underline-offset-2"
                >
                  {project.clientName}
                </Link>
              ) : (
                "—"
              ),
            },
            {
              label: "Commessa",
              value: project.jobId ? (
                <Link
                  href={`/app/commesse/${project.jobId}`}
                  className="underline underline-offset-2"
                >
                  {project.jobCode}
                </Link>
              ) : (
                "—"
              ),
            },
            { label: "Inizio", value: formatDate(project.startDate) },
            { label: "Fine", value: formatDate(project.endDate) },
            {
              label: "Budget ore",
              value: formatNumber(project.budgetHours),
            },
          ]}
        />
      </AppCard>

      <ProjectBoard
        projectId={project.id}
        tasks={project.tasks}
        memberOptions={memberOptions}
        canCreate={can(ctx, "projects", "create")}
        canEdit={can(ctx, "projects", "edit")}
        canDelete={can(ctx, "projects", "delete")}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <AttachmentsPanel entityType="project" entityId={project.id} />
      </div>
    </div>
  );
}
