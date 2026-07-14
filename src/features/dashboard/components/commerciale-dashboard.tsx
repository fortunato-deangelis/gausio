import Link from "next/link";
import {
  Contact,
  Euro,
  FileWarning,
  ShoppingCart,
} from "lucide-react";
import {
  AppCard,
  EmptyState,
  StatCard,
  StatusBadge,
  type StatusTone,
} from "@/components/shared";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCommercialeDashboardData } from "../queries";
import { RevenueChart } from "./revenue-chart";
import { RecentInvoicesCard } from "./list-cards";

const orderTones: Record<string, StatusTone> = {
  draft: "muted",
  confirmed: "info",
  partially_fulfilled: "warning",
  fulfilled: "success",
  cancelled: "muted",
};

const orderLabels: Record<string, string> = {
  draft: "Bozza",
  confirmed: "Confermato",
  partially_fulfilled: "Parziale",
  fulfilled: "Evaso",
  cancelled: "Annullato",
};

/** Dashboard commerciale: vendite, clienti e documenti recenti. */
export async function CommercialeDashboard({
  workspaceId,
}: Readonly<{ workspaceId: string }>) {
  const data = await getCommercialeDashboardData(workspaceId);

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
          label="Ordini aperti"
          value={String(data.openOrders)}
          icon={ShoppingCart}
          tone="info"
        />
        <StatCard
          label="Da incassare"
          value={formatCurrency(data.unpaidAmount)}
          hint={`${data.overdueCount} fatture scadute`}
          icon={FileWarning}
          tone="warning"
        />
        <StatCard
          label="Clienti"
          value={String(data.clientsCount)}
          hint={`${data.newClientsMonth} nuovi questo mese`}
          icon={Contact}
          tone="success"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={data.monthly} />
        </div>
        <RecentInvoicesCard invoices={data.recentInvoices} />
      </div>

      <AppCard
        title="Ultimi ordini emessi"
        actions={
          <Link
            href="/app/vendite/ordini"
            className="text-sm font-medium text-primary hover:underline"
          >
            Vedi tutti
          </Link>
        }
      >
        {data.recentOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nessun ordine"
            description="Gli ordini emessi più recenti appariranno qui."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {data.recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {order.code} · {order.contactName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatCurrency(order.total)}
                  </span>
                  <StatusBadge
                    label={orderLabels[order.status] ?? order.status}
                    tone={orderTones[order.status] ?? "muted"}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppCard>
    </div>
  );
}
