import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, Clock, Pencil } from "lucide-react";
import {
  AppCard,
  Button,
  DetailList,
  ExportMenu,
  PageHeader,
  StatCard,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shared";
import { formatDate, formatNumber } from "@/lib/format";
import { can, requireWorkspace } from "@/server/workspace";
import { getEmployee } from "@/features/hr/queries";
import { EmployeeFormDialog } from "@/features/hr/components/employee-form-dialog";
import { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";
import { EMPLOYEE_STATUSES, LEAVE_STATUSES, LEAVE_TYPES } from "@/features/hr/schema";

export const metadata: Metadata = { title: "Dettaglio dipendente" };

const statusTone = {
  active: "success",
  suspended: "warning",
  terminated: "muted",
} as const;

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireWorkspace();
  if (!can(ctx, "hr", "view")) redirect("/app");

  const { id } = await params;
  const detail = await getEmployee(id);
  if (!detail) notFound();
  const { employee } = detail;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={employee.jobTitle ?? undefined}
        backHref="/app/personale"
        backLabel="Personale"
        actions={
          <>
            <ExportMenu pdfUrl={`/api/export/personale/${employee.id}?format=pdf`} />
            {can(ctx, "hr", "edit") && (
              <EmployeeFormDialog
                employee={{
                  id: employee.id,
                  firstName: employee.firstName,
                  lastName: employee.lastName,
                  fiscalCode: employee.fiscalCode ?? "",
                  email: employee.email ?? "",
                  phone: employee.phone ?? "",
                  birthDate: employee.birthDate ?? "",
                  birthPlace: employee.birthPlace ?? "",
                  address: employee.address ?? "",
                  city: employee.city ?? "",
                  zipCode: employee.zipCode ?? "",
                  province: employee.province ?? "",
                  jobTitle: employee.jobTitle ?? "",
                  department: employee.department ?? "",
                  contractType: employee.contractType ?? "",
                  hiredAt: employee.hiredAt ?? "",
                  terminatedAt: employee.terminatedAt ?? "",
                  status: employee.status,
                  hourlyCost: employee.hourlyCost ?? "",
                  annualLeaveDays: employee.annualLeaveDays ?? "",
                  notes: employee.notes ?? "",
                }}
                trigger={
                  <Button>
                    <Pencil className="size-4" />
                    Modifica
                  </Button>
                }
              />
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Ferie fruite (anno)"
          value={`${detail.approvedLeaveDaysThisYear} gg`}
          icon={CalendarDays}
          tone="info"
          hint={
            employee.annualLeaveDays
              ? `su ${formatNumber(employee.annualLeaveDays)} giorni annui`
              : undefined
          }
        />
        <StatCard
          label="Ore timbrate (mese)"
          value={`${formatNumber(detail.workedHoursThisMonth)} h`}
          icon={Clock}
          tone="primary"
        />
        <AppCard title="Stato" contentClassName="flex items-center gap-3">
          <StatusBadge
            label={
              EMPLOYEE_STATUSES.find((s) => s.value === employee.status)?.label ??
              employee.status
            }
            tone={statusTone[employee.status]}
          />
          <span className="text-sm text-muted-foreground">
            {employee.contractType ?? "Contratto non specificato"}
          </span>
        </AppCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AppCard title="Anagrafica">
            <DetailList
              items={[
                { label: "Codice fiscale", value: employee.fiscalCode },
                { label: "Email", value: employee.email },
                { label: "Telefono", value: employee.phone },
                {
                  label: "Nascita",
                  value: employee.birthDate
                    ? `${formatDate(employee.birthDate)}${
                        employee.birthPlace ? ` — ${employee.birthPlace}` : ""
                      }`
                    : null,
                },
                {
                  label: "Residenza",
                  value: [employee.address, employee.zipCode, employee.city, employee.province]
                    .filter(Boolean)
                    .join(", "),
                },
                { label: "Reparto", value: employee.department },
                { label: "Assunzione", value: formatDate(employee.hiredAt) },
                {
                  label: "Cessazione",
                  value: employee.terminatedAt ? formatDate(employee.terminatedAt) : null,
                },
                { label: "Note", value: employee.notes },
              ]}
            />
          </AppCard>

          <Tabs defaultValue="assenze">
            <TabsList>
              <TabsTrigger value="assenze">
                Assenze ({detail.leaves.length})
              </TabsTrigger>
              <TabsTrigger value="timbrature">Ultime timbrature</TabsTrigger>
              <TabsTrigger value="schede">
                Schede lavoro ({detail.logs.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="assenze">
              <AppCard title="Assenze">
                {detail.leaves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nessuna assenza registrata.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {detail.leaves.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                        <StatusBadge
                          label={LEAVE_TYPES.find((t) => t.value === l.type)?.label ?? l.type}
                          tone={l.type === "ferie" ? "info" : l.type === "permesso" ? "warning" : "destructive"}
                        />
                        <span>
                          {formatDate(l.startDate)} → {formatDate(l.endDate)}
                        </span>
                        <span className="ml-auto text-muted-foreground">
                          {LEAVE_STATUSES.find((s) => s.value === l.status)?.label ?? l.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </AppCard>
            </TabsContent>
            <TabsContent value="timbrature">
              <AppCard title="Ultime timbrature">
                {detail.recentTimeEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nessuna timbratura registrata.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {detail.recentTimeEntries.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                        <span className="font-medium">{formatDate(t.date)}</span>
                        <span className="text-muted-foreground">
                          {t.clockIn.slice(0, 5)} → {t.clockOut?.slice(0, 5) ?? "in corso"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </AppCard>
            </TabsContent>
            <TabsContent value="schede">
              <AppCard title="Schede lavoro">
                {detail.logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nessuna scheda lavoro registrata.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {detail.logs.map((log) => (
                      <li key={log.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                        <span className="font-medium">{formatDate(log.date)}</span>
                        <span>
                          {log.jobCode} — {log.jobTitle}
                        </span>
                        <span className="ml-auto">{formatNumber(log.hours)} h</span>
                      </li>
                    ))}
                  </ul>
                )}
              </AppCard>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-6">
          <AttachmentsPanel entityType="employee" entityId={employee.id} />
        </div>
      </div>
    </div>
  );
}
