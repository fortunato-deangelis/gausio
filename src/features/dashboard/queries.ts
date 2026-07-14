import "server-only";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lte,
  ne,
  sql,
} from "drizzle-orm";
import { db } from "@/server/db";
import {
  contacts,
  employees,
  invoices,
  isoDocuments,
  jobs,
  leaveRequests,
  orders,
  projects,
  projectTasks,
  stockMovements,
  warehouseItems,
  workLogs,
} from "@/server/db/schema";

/**
 * Aggregati per le dashboard per ruolo. Tutte le query filtrano per
 * workspace e sono resilienti al database vuoto.
 */

export type MonthlyRevenuePoint = Readonly<{
  month: string; // etichetta breve it-IT, es. "gen 26"
  emesso: number;
  ricevuto: number;
}>;

export type RecentInvoice = Readonly<{
  id: string;
  code: string;
  contactName: string;
  date: string;
  total: string;
  status: string;
}>;

export type RecentMovement = Readonly<{
  id: string;
  itemName: string;
  type: string;
  quantity: string;
  date: string;
}>;

export type RecentTask = Readonly<{
  id: string;
  title: string;
  projectName: string;
  status: string;
  priority: string;
  dueDate: string | null;
}>;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function countWhere(
  table:
    | typeof contacts
    | typeof employees
    | typeof projects,
  condition: ReturnType<typeof and>
): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table).where(condition);
  return row?.value ?? 0;
}

/** Serie mensile fatturato emesso vs ricevuto, ultimi 12 mesi. */
export async function getMonthlyRevenue(
  workspaceId: string
): Promise<MonthlyRevenuePoint[]> {
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${invoices.date}::date), 'YYYY-MM')`,
      direction: invoices.direction,
      total: sql<string>`coalesce(sum(${invoices.total}), '0')`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        ne(invoices.status, "cancelled"),
        gte(invoices.date, isoDate(start))
      )
    )
    .groupBy(sql`1`, invoices.direction);

  const byMonth = new Map<string, { emesso: number; ricevuto: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    byMonth.set(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      { emesso: 0, ricevuto: 0 }
    );
  }
  for (const row of rows) {
    const bucket = byMonth.get(row.month);
    if (!bucket) continue;
    if (row.direction === "issued") bucket.emesso = Number(row.total);
    else bucket.ricevuto = Number(row.total);
  }

  return [...byMonth.entries()].map(([key, value]) => {
    const [year, month] = key.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString("it-IT", {
      month: "short",
      year: "2-digit",
    });
    return { month: label, ...value };
  });
}

export async function getRecentInvoices(
  workspaceId: string,
  direction: "issued" | "received" = "issued",
  limit = 5
): Promise<RecentInvoice[]> {
  const rows = await db
    .select({
      id: invoices.id,
      code: invoices.code,
      contactName: contacts.businessName,
      date: invoices.date,
      total: invoices.total,
      status: invoices.status,
    })
    .from(invoices)
    .innerJoin(contacts, eq(contacts.id, invoices.contactId))
    .where(
      and(eq(invoices.workspaceId, workspaceId), eq(invoices.direction, direction))
    )
    .orderBy(desc(invoices.date))
    .limit(limit);
  return rows;
}

export async function getRecentMovements(
  workspaceId: string,
  limit = 5
): Promise<RecentMovement[]> {
  const rows = await db
    .select({
      id: stockMovements.id,
      itemName: warehouseItems.name,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      date: stockMovements.date,
    })
    .from(stockMovements)
    .innerJoin(warehouseItems, eq(warehouseItems.id, stockMovements.itemId))
    .where(eq(stockMovements.workspaceId, workspaceId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
  return rows;
}

/** KPI comuni all'area amministrativa/commerciale. */
async function getFinancialKpis(workspaceId: string) {
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const today = isoDate(new Date());

  const [revenue] = await db
    .select({ value: sql<string>`coalesce(sum(${invoices.total}), '0')` })
    .from(invoices)
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.direction, "issued"),
        ne(invoices.status, "cancelled"),
        gte(invoices.date, yearStart)
      )
    );

  const [unpaid] = await db
    .select({
      value: count(),
      amount: sql<string>`coalesce(sum(${invoices.total}), '0')`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.direction, "issued"),
        inArray(invoices.status, ["issued", "sent", "overdue"])
      )
    );

  const [overdue] = await db
    .select({ value: count() })
    .from(invoices)
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.direction, "issued"),
        inArray(invoices.status, ["issued", "sent", "overdue"]),
        isNotNull(invoices.dueDate),
        lte(invoices.dueDate, today)
      )
    );

  const [openOrders] = await db
    .select({ value: count() })
    .from(orders)
    .where(
      and(
        eq(orders.workspaceId, workspaceId),
        inArray(orders.status, ["draft", "confirmed", "partially_fulfilled"])
      )
    );

  return {
    revenueThisYear: revenue?.value ?? "0",
    unpaidCount: unpaid?.value ?? 0,
    unpaidAmount: unpaid?.amount ?? "0",
    overdueCount: overdue?.value ?? 0,
    openOrders: openOrders?.value ?? 0,
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

export async function getAdminDashboardData(workspaceId: string) {
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    financial,
    monthly,
    recentInvoices,
    clientsCount,
    suppliersCount,
    activeJobs,
    activeEmployees,
    pendingLeave,
    lowStock,
    isoDue,
  ] = await Promise.all([
    getFinancialKpis(workspaceId),
    getMonthlyRevenue(workspaceId),
    getRecentInvoices(workspaceId),
    countWhere(
      contacts,
      and(
        eq(contacts.workspaceId, workspaceId),
        inArray(contacts.kind, ["client", "both"]),
        eq(contacts.isArchived, false)
      )
    ),
    countWhere(
      contacts,
      and(
        eq(contacts.workspaceId, workspaceId),
        inArray(contacts.kind, ["supplier", "both"]),
        eq(contacts.isArchived, false)
      )
    ),
    db
      .select({ value: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.workspaceId, workspaceId),
          inArray(jobs.status, ["open", "in_progress"])
        )
      )
      .then((r) => r[0]?.value ?? 0),
    countWhere(
      employees,
      and(eq(employees.workspaceId, workspaceId), eq(employees.status, "active"))
    ),
    db
      .select({ value: count() })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.workspaceId, workspaceId),
          eq(leaveRequests.status, "pending")
        )
      )
      .then((r) => r[0]?.value ?? 0),
    db
      .select({ value: count() })
      .from(warehouseItems)
      .where(
        and(
          eq(warehouseItems.workspaceId, workspaceId),
          eq(warehouseItems.isArchived, false),
          isNotNull(warehouseItems.minStock),
          sql`${warehouseItems.quantity} < ${warehouseItems.minStock}`
        )
      )
      .then((r) => r[0]?.value ?? 0),
    db
      .select({ value: count() })
      .from(isoDocuments)
      .where(
        and(
          eq(isoDocuments.workspaceId, workspaceId),
          ne(isoDocuments.status, "obsolete"),
          isNotNull(isoDocuments.reviewDate),
          lte(isoDocuments.reviewDate, isoDate(in30Days))
        )
      )
      .then((r) => r[0]?.value ?? 0),
  ]);

  return {
    ...financial,
    monthly,
    recentInvoices,
    clientsCount,
    suppliersCount,
    activeJobs,
    activeEmployees,
    pendingLeave,
    lowStock,
    isoDue,
  };
}

export type CommercialeDashboardData = Awaited<
  ReturnType<typeof getCommercialeDashboardData>
>;

export async function getCommercialeDashboardData(workspaceId: string) {
  const monthStart = isoDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [financial, monthly, recentInvoices, clientsCount, newClientsMonth, recentOrders] =
    await Promise.all([
      getFinancialKpis(workspaceId),
      getMonthlyRevenue(workspaceId),
      getRecentInvoices(workspaceId),
      countWhere(
        contacts,
        and(
          eq(contacts.workspaceId, workspaceId),
          inArray(contacts.kind, ["client", "both"]),
          eq(contacts.isArchived, false)
        )
      ),
      db
        .select({ value: count() })
        .from(contacts)
        .where(
          and(
            eq(contacts.workspaceId, workspaceId),
            inArray(contacts.kind, ["client", "both"]),
            gte(contacts.createdAt, new Date(monthStart))
          )
        )
        .then((r) => r[0]?.value ?? 0),
      db
        .select({
          id: orders.id,
          code: orders.code,
          contactName: contacts.businessName,
          date: orders.date,
          total: orders.total,
          status: orders.status,
        })
        .from(orders)
        .innerJoin(contacts, eq(contacts.id, orders.contactId))
        .where(
          and(
            eq(orders.workspaceId, workspaceId),
            eq(orders.direction, "issued")
          )
        )
        .orderBy(desc(orders.date))
        .limit(5),
    ]);

  return {
    ...financial,
    monthly,
    recentInvoices,
    clientsCount,
    newClientsMonth,
    recentOrders,
  };
}

export type DipendenteDashboardData = Awaited<
  ReturnType<typeof getDipendenteDashboardData>
>;

export async function getDipendenteDashboardData(
  workspaceId: string,
  userId: string
) {
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const myTasks: RecentTask[] = await db
    .select({
      id: projectTasks.id,
      title: projectTasks.title,
      projectName: projects.name,
      status: projectTasks.status,
      priority: projectTasks.priority,
      dueDate: projectTasks.dueDate,
    })
    .from(projectTasks)
    .innerJoin(projects, eq(projects.id, projectTasks.projectId))
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projectTasks.assigneeId, userId),
        ne(projectTasks.status, "done")
      )
    )
    .orderBy(desc(projectTasks.updatedAt))
    .limit(8);

  // Dipendente collegato all'utente (per ore e assenze).
  const employee = await db.query.employees.findFirst({
    where: and(
      eq(employees.workspaceId, workspaceId),
      eq(employees.userId, userId)
    ),
  });

  let hoursByJob: { jobTitle: string; jobCode: string; hours: number }[] = [];
  let approvedLeaveDays = 0;
  let pendingLeaveCount = 0;

  if (employee) {
    const hourRows = await db
      .select({
        jobTitle: jobs.title,
        jobCode: jobs.code,
        hours: sql<string>`coalesce(sum(${workLogs.hours}), '0')`,
      })
      .from(workLogs)
      .innerJoin(jobs, eq(jobs.id, workLogs.jobId))
      .where(
        and(
          eq(workLogs.workspaceId, workspaceId),
          eq(workLogs.employeeId, employee.id),
          gte(workLogs.date, yearStart)
        )
      )
      .groupBy(jobs.title, jobs.code)
      .orderBy(desc(sql`sum(${workLogs.hours})`))
      .limit(6);
    hoursByJob = hourRows.map((r) => ({ ...r, hours: Number(r.hours) }));

    const leaveRows = await db
      .select({
        status: leaveRequests.status,
        days: sql<string>`coalesce(sum((${leaveRequests.endDate}::date - ${leaveRequests.startDate}::date) + 1), '0')`,
        rows: count(),
      })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.workspaceId, workspaceId),
          eq(leaveRequests.employeeId, employee.id),
          eq(leaveRequests.type, "ferie"),
          gte(leaveRequests.startDate, yearStart)
        )
      )
      .groupBy(leaveRequests.status);
    approvedLeaveDays = Number(
      leaveRows.find((r) => r.status === "approved")?.days ?? 0
    );
    pendingLeaveCount = leaveRows.find((r) => r.status === "pending")?.rows ?? 0;
  }

  return {
    myTasks,
    hoursByJob,
    approvedLeaveDays,
    pendingLeaveCount,
    annualLeaveDays: employee?.annualLeaveDays
      ? Number(employee.annualLeaveDays)
      : null,
    hasEmployeeProfile: Boolean(employee),
  };
}

export type MarketingDashboardData = Awaited<
  ReturnType<typeof getMarketingDashboardData>
>;

export async function getMarketingDashboardData(workspaceId: string) {
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const [contactsTotal, contactsNewMonth, activeProjects, tasksInProgress, recentTasks] =
    await Promise.all([
      countWhere(
        contacts,
        and(eq(contacts.workspaceId, workspaceId), eq(contacts.isArchived, false))
      ),
      db
        .select({ value: count() })
        .from(contacts)
        .where(
          and(
            eq(contacts.workspaceId, workspaceId),
            gte(contacts.createdAt, monthStart)
          )
        )
        .then((r) => r[0]?.value ?? 0),
      countWhere(
        projects,
        and(eq(projects.workspaceId, workspaceId), eq(projects.status, "active"))
      ),
      db
        .select({ value: count() })
        .from(projectTasks)
        .innerJoin(projects, eq(projects.id, projectTasks.projectId))
        .where(
          and(
            eq(projects.workspaceId, workspaceId),
            eq(projectTasks.status, "in_progress")
          )
        )
        .then((r) => r[0]?.value ?? 0),
      db
        .select({
          id: projectTasks.id,
          title: projectTasks.title,
          projectName: projects.name,
          status: projectTasks.status,
          priority: projectTasks.priority,
          dueDate: projectTasks.dueDate,
        })
        .from(projectTasks)
        .innerJoin(projects, eq(projects.id, projectTasks.projectId))
        .where(eq(projects.workspaceId, workspaceId))
        .orderBy(desc(projectTasks.updatedAt))
        .limit(8),
    ]);

  return {
    contactsTotal,
    contactsNewMonth,
    activeProjects,
    tasksInProgress,
    recentTasks,
  };
}
