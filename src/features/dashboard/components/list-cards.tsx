import Link from "next/link";
import { FileText, KanbanSquare, PackageOpen } from "lucide-react";
import {
  AppCard,
  EmptyState,
  StatusBadge,
  type StatusTone,
} from "@/components/shared";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { RecentInvoice, RecentMovement, RecentTask } from "../queries";

const invoiceTones: Record<string, StatusTone> = {
  draft: "muted",
  issued: "info",
  sent: "default",
  paid: "success",
  overdue: "destructive",
  cancelled: "muted",
};

const invoiceLabels: Record<string, string> = {
  draft: "Bozza",
  issued: "Emessa",
  sent: "Inviata",
  paid: "Pagata",
  overdue: "Scaduta",
  cancelled: "Annullata",
};

export function RecentInvoicesCard({
  invoices,
  title = "Fatture recenti",
  href = "/app/vendite/fatture",
}: Readonly<{ invoices: RecentInvoice[]; title?: string; href?: string }>) {
  return (
    <AppCard
      title={title}
      actions={
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          Vedi tutte
        </Link>
      }
    >
      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nessuna fattura"
          description="Le fatture più recenti appariranno qui."
        />
      ) : (
        <ul className="flex flex-col divide-y">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {invoice.code} · {invoice.contactName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(invoice.date)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold">
                  {formatCurrency(invoice.total)}
                </span>
                <StatusBadge
                  label={invoiceLabels[invoice.status] ?? invoice.status}
                  tone={invoiceTones[invoice.status] ?? "muted"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}

const movementLabels: Record<string, { label: string; tone: StatusTone }> = {
  in: { label: "Carico", tone: "success" },
  out: { label: "Scarico", tone: "warning" },
  adjustment: { label: "Rettifica", tone: "info" },
};

export function RecentMovementsCard({
  movements,
}: Readonly<{ movements: RecentMovement[] }>) {
  return (
    <AppCard
      title="Movimenti di magazzino"
      actions={
        <Link
          href="/app/magazzino/movimenti"
          className="text-sm font-medium text-primary hover:underline"
        >
          Vedi tutti
        </Link>
      }
    >
      {movements.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Nessun movimento"
          description="Carichi e scarichi recenti appariranno qui."
        />
      ) : (
        <ul className="flex flex-col divide-y">
          {movements.map((movement) => {
            const meta = movementLabels[movement.type] ?? {
              label: movement.type,
              tone: "muted" as StatusTone,
            };
            return (
              <li
                key={movement.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{movement.itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(movement.date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatNumber(movement.quantity)}
                  </span>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppCard>
  );
}

const taskTones: Record<string, StatusTone> = {
  todo: "muted",
  in_progress: "info",
  review: "warning",
  done: "success",
};

const taskLabels: Record<string, string> = {
  todo: "Da fare",
  in_progress: "In corso",
  review: "In revisione",
  done: "Completato",
};

export function TasksCard({
  tasks,
  title = "Attività",
}: Readonly<{ tasks: RecentTask[]; title?: string }>) {
  return (
    <AppCard
      title={title}
      actions={
        <Link
          href="/app/progetti"
          className="text-sm font-medium text-primary hover:underline"
        >
          Vai ai progetti
        </Link>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Nessuna attività"
          description="Le attività dei progetti appariranno qui."
        />
      ) : (
        <ul className="flex flex-col divide-y">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {task.projectName}
                  {task.dueDate ? ` · scadenza ${formatDate(task.dueDate)}` : ""}
                </p>
              </div>
              <StatusBadge
                label={taskLabels[task.status] ?? task.status}
                tone={taskTones[task.status] ?? "muted"}
              />
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}
