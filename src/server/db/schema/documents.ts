import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";
import { contacts } from "./contacts";
import { jobs } from "./jobs";

/**
 * Documenti commerciali: ordini (emessi/ricevuti), fatture (emesse/ricevute),
 * DDT, magazzino (articoli + movimenti di carico/scarico).
 *
 * `direction`: "issued" = documento emesso verso un cliente,
 * "received" = documento ricevuto da un fornitore.
 */

export const documentDirectionEnum = pgEnum("document_direction", [
  "issued",
  "received",
]);

/* ------------------------------- Ordini -------------------------------- */

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "confirmed",
  "partially_fulfilled",
  "fulfilled",
  "cancelled",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    direction: documentDirectionEnum("direction").notNull(),
    /** Numero progressivo per direzione/anno, es. ORD-2026-0001. */
    code: text("code").notNull(),
    year: integer("year").notNull(),
    number: integer("number").notNull(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    jobId: uuid("job_id").references(() => jobs.id),
    date: date("date").notNull(),
    expectedDate: date("expected_date"),
    status: orderStatusEnum("status").notNull().default("draft"),
    currency: text("currency").notNull().default("EUR"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    vatAmount: numeric("vat_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_workspace_idx").on(t.workspaceId, t.direction),
    uniqueIndex("orders_code_idx").on(t.workspaceId, t.direction, t.code),
  ]
);

export const orderLines = pgTable(
  "order_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 })
      .notNull()
      .default("1"),
    unit: text("unit").default("pz"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 4 })
      .notNull()
      .default("0"),
    vatRate: numeric("vat_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("22"),
    discount: numeric("discount", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  },
  (t) => [index("order_lines_order_idx").on(t.orderId)]
);

/* ------------------------------- Fatture ------------------------------- */

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    direction: documentDirectionEnum("direction").notNull(),
    code: text("code").notNull(),
    year: integer("year").notNull(),
    number: integer("number").notNull(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    jobId: uuid("job_id").references(() => jobs.id),
    orderId: uuid("order_id").references(() => orders.id),
    date: date("date").notNull(),
    dueDate: date("due_date"),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    currency: text("currency").notNull().default("EUR"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    vatAmount: numeric("vat_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    paymentMethod: text("payment_method"),
    paymentTerms: text("payment_terms"),
    paidAt: date("paid_at"),
    notes: text("notes"),
    /** Riferimento del fornitore per le fatture ricevute. */
    externalReference: text("external_reference"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("invoices_workspace_idx").on(t.workspaceId, t.direction),
    uniqueIndex("invoices_code_idx").on(t.workspaceId, t.direction, t.code),
  ]
);

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 })
      .notNull()
      .default("1"),
    unit: text("unit").default("pz"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 4 })
      .notNull()
      .default("0"),
    vatRate: numeric("vat_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("22"),
    discount: numeric("discount", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  },
  (t) => [index("invoice_lines_invoice_idx").on(t.invoiceId)]
);

/* ------------------------------ Magazzino ------------------------------ */

export const warehouseItems = pgTable(
  "warehouse_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    unit: text("unit").notNull().default("pz"),
    location: text("location"),
    minStock: numeric("min_stock", { precision: 12, scale: 3 }),
    /** Quantità corrente, ridondata e aggiornata a ogni movimento. */
    quantity: numeric("quantity", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    unitCost: numeric("unit_cost", { precision: 14, scale: 4 }),
    unitPrice: numeric("unit_price", { precision: 14, scale: 4 }),
    supplierId: uuid("supplier_id").references(() => contacts.id),
    isArchived: boolean("is_archived").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("warehouse_items_workspace_idx").on(t.workspaceId),
    uniqueIndex("warehouse_items_sku_idx").on(t.workspaceId, t.sku),
  ]
);

/* --------------------------------- DDT ---------------------------------- */

export const ddtStatusEnum = pgEnum("ddt_status", [
  "draft",
  "shipped",
  "delivered",
  "cancelled",
]);

export const ddts = pgTable(
  "ddts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    direction: documentDirectionEnum("direction").notNull(),
    code: text("code").notNull(),
    year: integer("year").notNull(),
    number: integer("number").notNull(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    jobId: uuid("job_id").references(() => jobs.id),
    orderId: uuid("order_id").references(() => orders.id),
    date: date("date").notNull(),
    status: ddtStatusEnum("status").notNull().default("draft"),
    transportReason: text("transport_reason").default("Vendita"),
    transportedBy: text("transported_by").default("Mittente"),
    carrier: text("carrier"),
    packagesCount: integer("packages_count"),
    weight: text("weight"),
    destinationAddress: text("destination_address"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ddts_workspace_idx").on(t.workspaceId, t.direction),
    uniqueIndex("ddts_code_idx").on(t.workspaceId, t.direction, t.code),
  ]
);

export const ddtLines = pgTable(
  "ddt_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ddtId: uuid("ddt_id")
      .notNull()
      .references(() => ddts.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    itemId: uuid("item_id").references(() => warehouseItems.id),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 })
      .notNull()
      .default("1"),
    unit: text("unit").default("pz"),
  },
  (t) => [index("ddt_lines_ddt_idx").on(t.ddtId)]
);

/* --------------------------- Movimenti magazzino ------------------------ */

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "in", // carico
  "out", // scarico
  "adjustment", // rettifica inventariale
]);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => warehouseItems.id, { onDelete: "cascade" }),
    type: stockMovementTypeEnum("type").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    date: date("date").notNull(),
    reason: text("reason"),
    contactId: uuid("contact_id").references(() => contacts.id),
    jobId: uuid("job_id").references(() => jobs.id),
    ddtId: uuid("ddt_id").references(() => ddts.id),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("stock_movements_item_idx").on(t.itemId)]
);
