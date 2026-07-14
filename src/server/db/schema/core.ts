import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Nucleo multi-tenant: utenti (sincronizzati da Zitadel), workspace
 * (aziende), membership con ruolo e permessi per modulo.
 */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** `sub` del token Zitadel: chiave di collegamento con l'IdP. */
  zitadelId: text("zitadel_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  vatNumber: text("vat_number"),
  fiscalCode: text("fiscal_code"),
  address: text("address"),
  city: text("city"),
  zipCode: text("zip_code"),
  province: text("province"),
  country: text("country").default("IT"),
  email: text("email"),
  phone: text("phone"),
  pec: text("pec"),
  sdiCode: text("sdi_code"),
  logoUrl: text("logo_url"),
  /** Risposte del questionario di onboarding (settore, dimensione, obiettivi…). */
  onboarding: jsonb("onboarding").$type<Record<string, string>>(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Ruoli predefiniti seminati alla creazione del workspace. La chiave guida
 * anche la scelta della dashboard; i permessi restano personalizzabili.
 */
export const roleKeyEnum = pgEnum("role_key", [
  "admin",
  "commerciale",
  "dipendente",
  "marketing",
  "custom",
]);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: roleKeyEnum("key").notNull().default("custom"),
    name: text("name").notNull(),
    description: text("description"),
    /** Il ruolo admin non è eliminabile e ha sempre tutti i permessi. */
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("roles_workspace_name_idx").on(t.workspaceId, t.name)]
);

/** Moduli applicativi soggetti a permessi (view/create/edit/delete). */
export const moduleEnum = pgEnum("app_module", [
  "contacts",
  "orders_issued",
  "orders_received",
  "invoices_issued",
  "invoices_received",
  "ddt",
  "warehouse",
  "jobs",
  "projects",
  "hr",
  "iso",
  "settings",
]);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    module: moduleEnum("module").notNull(),
    canView: boolean("can_view").notNull().default(false),
    canCreate: boolean("can_create").notNull().default(false),
    canEdit: boolean("can_edit").notNull().default(false),
    canDelete: boolean("can_delete").notNull().default(false),
  },
  (t) => [uniqueIndex("role_permissions_role_module_idx").on(t.roleId, t.module)]
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("workspace_members_ws_user_idx").on(t.workspaceId, t.userId),
  ]
);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
]);

export const workspaceInvitations = pgTable("workspace_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id),
  token: text("token").notNull().unique(),
  status: invitationStatusEnum("status").notNull().default("pending"),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Contatori progressivi per numerazioni documentali (fatture, ordini, DDT,
 * commesse) per workspace/anno.
 */
export const documentCounters = pgTable(
  "document_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    year: integer("year").notNull(),
    lastNumber: integer("last_number").notNull().default(0),
  },
  (t) => [
    uniqueIndex("document_counters_scope_idx").on(t.workspaceId, t.scope, t.year),
  ]
);
