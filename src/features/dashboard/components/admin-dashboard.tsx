import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  Contact,
  Euro,
  FileWarning,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/shared";
import { formatCurrency } from "@/lib/format";
import { getAdminDashboardData } from "../queries";
import { RevenueChart } from "./revenue-chart";
import { RecentInvoicesCard, RecentMovementsCard } from "./list-cards";
import { getRecentMovements } from "../queries";

/** Dashboard amministratore: panoramica completa dell'azienda. */
export async function AdminDashboard({
  workspaceId,
}: Readonly<{ workspaceId: string }>) {
  const [data, movements] = await Promise.all([
    getAdminDashboardData(workspaceId),
    getRecentMovements(workspaceId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Fatturato anno corrente"
          value={formatCurrency(data.revenueThisYear)}
          icon={Euro}
          tone="primary"
        />
        <StatCard
          label="Fatture da incassare"
          value={formatCurrency(data.unpaidAmount)}
          hint={`${data.unpaidCount} fatture aperte`}
          icon={FileWarning}
          tone="warning"
        />
        <StatCard
          label="Fatture scadute"
          value={String(data.overdueCount)}
          icon={AlertTriangle}
          tone="destructive"
        />
        <StatCard
          label="Ordini aperti"
          value={String(data.openOrders)}
          icon={ShoppingCart}
          tone="info"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clienti attivi"
          value={String(data.clientsCount)}
          hint={`${data.suppliersCount} fornitori`}
          icon={Contact}
          tone="primary"
        />
        <StatCard
          label="Commesse attive"
          value={String(data.activeJobs)}
          icon={Briefcase}
          tone="info"
        />
        <StatCard
          label="Dipendenti attivi"
          value={String(data.activeEmployees)}
          hint={`${data.pendingLeave} richieste assenza in attesa`}
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Documenti ISO da revisionare"
          value={String(data.isoDue)}
          hint={
            data.lowStock > 0
              ? `${data.lowStock} articoli sotto scorta`
              : undefined
          }
          icon={ShieldCheck}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={data.monthly} />
        </div>
        <div className="flex flex-col gap-4">
          <RecentInvoicesCard invoices={data.recentInvoices} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentMovementsCard movements={movements} />
        <StatCard
          label="Richieste assenza in attesa"
          value={String(data.pendingLeave)}
          hint="Approvale dalla sezione Personale → Assenze"
          icon={CalendarClock}
          tone="info"
          className="h-fit"
        />
      </div>
    </div>
  );
}
