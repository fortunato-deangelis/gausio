import { requirePermission } from "@/server/workspace";
import { buildDetailPdf } from "@/server/export/pdf";
import { fileResponse } from "@/server/export/response";
import { formatDate, formatNumber } from "@/lib/format";
import { getEmployee } from "@/features/hr/queries";
import {
  EMPLOYEE_STATUSES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
} from "@/features/hr/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("hr", "view");
  } catch {
    return new Response("Non autorizzato", { status: 403 });
  }

  const { id } = await params;
  const detail = await getEmployee(id);
  if (!detail) return new Response("Non trovato", { status: 404 });
  const { employee } = detail;

  const buffer = await buildDetailPdf({
    title: `${employee.lastName} ${employee.firstName}`,
    subtitle: employee.jobTitle ?? undefined,
    sections: [
      {
        title: "Anagrafica",
        fields: [
          { label: "Codice fiscale", value: employee.fiscalCode },
          { label: "Email", value: employee.email },
          { label: "Telefono", value: employee.phone },
          { label: "Data di nascita", value: formatDate(employee.birthDate) },
          { label: "Luogo di nascita", value: employee.birthPlace },
          {
            label: "Residenza",
            value:
              [employee.address, employee.zipCode, employee.city, employee.province]
                .filter(Boolean)
                .join(", ") || null,
          },
        ],
      },
      {
        title: "Rapporto di lavoro",
        fields: [
          { label: "Mansione", value: employee.jobTitle },
          { label: "Reparto", value: employee.department },
          { label: "Contratto", value: employee.contractType },
          { label: "Assunzione", value: formatDate(employee.hiredAt) },
          {
            label: "Cessazione",
            value: employee.terminatedAt ? formatDate(employee.terminatedAt) : null,
          },
          {
            label: "Stato",
            value:
              EMPLOYEE_STATUSES.find((s) => s.value === employee.status)?.label ??
              employee.status,
          },
          {
            label: "Ferie fruite (anno)",
            value: `${detail.approvedLeaveDaysThisYear} giorni`,
          },
          {
            label: "Ore timbrate (mese)",
            value: `${formatNumber(detail.workedHoursThisMonth)} h`,
          },
        ],
      },
      {
        title: "Assenze",
        table: {
          headers: ["Tipo", "Dal", "Al", "Stato"],
          rows: detail.leaves.map((l) => [
            LEAVE_TYPES.find((t) => t.value === l.type)?.label ?? l.type,
            formatDate(l.startDate),
            formatDate(l.endDate),
            LEAVE_STATUSES.find((s) => s.value === l.status)?.label ?? l.status,
          ]),
        },
      },
      {
        title: "Schede lavoro",
        table: {
          headers: ["Data", "Commessa", "Ore", "Descrizione"],
          rows: detail.logs.map((log) => [
            formatDate(log.date),
            `${log.jobCode} — ${log.jobTitle}`,
            formatNumber(log.hours),
            log.description ?? "",
          ]),
        },
      },
    ],
  });

  return fileResponse(
    buffer,
    `dipendente-${employee.lastName.toLowerCase()}-${employee.firstName.toLowerCase()}`,
    "pdf"
  );
}
