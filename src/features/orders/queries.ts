import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { contacts, jobs, orderLines, orders } from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/workspace";

export type OrderDirection = "issued" | "received";

export async function listOrders(ctx: WorkspaceContext, direction: OrderDirection) {
  return db
    .select({
      id: orders.id,
      code: orders.code,
      date: orders.date,
      expectedDate: orders.expectedDate,
      status: orders.status,
      total: orders.total,
      currency: orders.currency,
      contactName: contacts.businessName,
      jobCode: jobs.code,
    })
    .from(orders)
    .leftJoin(contacts, eq(contacts.id, orders.contactId))
    .leftJoin(jobs, eq(jobs.id, orders.jobId))
    .where(
      and(
        eq(orders.workspaceId, ctx.workspace.id),
        eq(orders.direction, direction)
      )
    )
    .orderBy(desc(orders.year), desc(orders.number));
}

export type OrderListRow = Awaited<ReturnType<typeof listOrders>>[number];

export async function getOrder(ctx: WorkspaceContext, id: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.workspaceId, ctx.workspace.id)),
  });
  if (!order) return null;

  const [lines, contact, job] = await Promise.all([
    db.query.orderLines.findMany({
      where: eq(orderLines.orderId, order.id),
      orderBy: asc(orderLines.position),
    }),
    db.query.contacts.findFirst({ where: eq(contacts.id, order.contactId) }),
    order.jobId
      ? db.query.jobs.findFirst({ where: eq(jobs.id, order.jobId) })
      : Promise.resolve(null),
  ]);

  return { order, lines, contact: contact ?? null, job: job ?? null };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
