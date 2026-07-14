import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";

/**
 * Anagrafica unica clienti/fornitori. Un contatto può essere entrambi
 * (`kind = both`); i fornitori possono essere qualificati ai fini ISO.
 */

export const contactKindEnum = pgEnum("contact_kind", [
  "client",
  "supplier",
  "both",
]);

export const supplierQualificationEnum = pgEnum("supplier_qualification", [
  "not_qualified",
  "in_evaluation",
  "qualified",
  "suspended",
]);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: contactKindEnum("kind").notNull().default("client"),
    businessName: text("business_name").notNull(),
    vatNumber: text("vat_number"),
    fiscalCode: text("fiscal_code"),
    email: text("email"),
    pec: text("pec"),
    phone: text("phone"),
    website: text("website"),
    address: text("address"),
    city: text("city"),
    zipCode: text("zip_code"),
    province: text("province"),
    country: text("country").default("IT"),
    sdiCode: text("sdi_code"),
    iban: text("iban"),
    paymentTerms: text("payment_terms"),
    notes: text("notes"),
    /** Qualifica fornitore (solo per kind supplier/both). */
    qualification: supplierQualificationEnum("qualification")
      .notNull()
      .default("not_qualified"),
    qualificationDate: date("qualification_date"),
    qualificationExpiry: date("qualification_expiry"),
    qualificationNotes: text("qualification_notes"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("contacts_workspace_idx").on(t.workspaceId)]
);
