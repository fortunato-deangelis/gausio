import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  Clock,
  KanbanSquare,
} from "lucide-react";
import {
  AppCard,
  Button,
  EmptyState,
  StatCard,
} from "@/components/shared";
import { formatNumber } from "@/lib/format";
import { getDipendenteDashboardData } from "../queries";
import { TasksCard } from "./list-cards";

/** Dashboard dipendente: le mie attività, ore e assenze. */
export async function DipendenteDashboard({
  workspaceId,
  userId,
}: Readonly<{ workspaceId: string; userId: string }>) {
  const data = await getDipendenteDashboardData(workspaceId, userId);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attività aperte"
          value={String(data.myTasks.length)}
          icon={KanbanSquare}
          tone="primary"
        />
        <StatCard
          label="Commesse con mie ore"
          value={String(data.hoursByJob.length)}
          icon={Briefcase}
          tone="info"
        />
        <StatCard
          label="Ferie godute (anno)"
          value={
            data.annualLeaveDays
              ? `${formatNumber(data.approvedLeaveDays)} / ${formatNumber(data.annualLeaveDays)} gg`
              : `${formatNumber(data.approvedLeaveDays)} gg`
          }
          hint={
            data.pendingLeaveCount > 0
              ? `${data.pendingLeaveCount} richieste in attesa`
              : undefined
          }
          icon={CalendarDays}
          tone="success"
        />
        <StatCard
          label="Timbrature"
          value="Registra"
          hint="Vai a Personale → Timbrature"
          icon={Clock}
          tone="warning"
        />
      </div>

      {!data.hasEmployeeProfile && (
        <AppCard title="Profilo dipendente non collegato">
          <p className="text-sm text-muted-foreground">
            Il tuo utente non è ancora collegato a una scheda dipendente:
            chiedi a un amministratore di associarti dalla sezione Personale
            per vedere ore lavorate, ferie e timbrature.
          </p>
        </AppCard>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <TasksCard tasks={data.myTasks} title="Le mie attività" />

        <AppCard
          title="Ore per commessa (anno corrente)"
          actions={
            <Link
              href="/app/personale/schede-lavoro"
              className="text-sm font-medium text-primary hover:underline"
            >
              Schede lavoro
            </Link>
          }
        >
          {data.hoursByJob.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Nessuna ora registrata"
              description="Le ore imputate alle commesse appariranno qui."
            />
          ) : (
            <ul className="flex flex-col divide-y">
              {data.hoursByJob.map((row) => (
                <li
                  key={row.jobCode}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">{row.jobCode}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatNumber(row.hours)} h
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </div>

      <AppCard title="Azioni rapide">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/personale/timbrature">Nuova timbratura</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/personale/assenze">Richiedi ferie/permesso</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/personale/schede-lavoro">Registra ore commessa</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/progetti">I miei progetti</Link>
          </Button>
        </div>
      </AppCard>
    </div>
  );
}
