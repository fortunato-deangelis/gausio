import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";

/**
 * Gestione documentale per le certificazioni ISO (9001, 27001, 14001, 45001…):
 * procedure e documenti con ciclo di vita a revisioni.
 */

export const isoStandardEnum = pgEnum("iso_standard", [
  "iso9001",
  "iso27001",
  "iso14001",
  "iso45001",
  "other",
]);

export const isoDocumentTypeEnum = pgEnum("iso_document_type", [
  "procedura",
  "manuale",
  "modulo",
  "istruzione",
  "politica",
  "registrazione",
]);

export const isoDocumentStatusEnum = pgEnum("iso_document_status", [
  "draft",
  "in_review",
  "approved",
  "obsolete",
]);

export const isoDocuments = pgTable(
  "iso_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Codice documento, es. PRO-01, MOD-05. */
    code: text("code").notNull(),
    title: text("title").notNull(),
    standard: isoStandardEnum("standard").notNull(),
    type: isoDocumentTypeEnum("type").notNull(),
    status: isoDocumentStatusEnum("status").notNull().default("draft"),
    /** Contenuto testuale del documento/procedura (markdown). */
    content: text("content"),
    revision: integer("revision").notNull().default(0),
    issueDate: date("issue_date"),
    reviewDate: date("review_date"),
    ownerId: uuid("owner_id").references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("iso_documents_workspace_idx").on(t.workspaceId)]
);

/** Storico revisioni: snapshot del contenuto a ogni cambio di revisione. */
export const isoDocumentRevisions = pgTable(
  "iso_document_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => isoDocuments.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull(),
    content: text("content"),
    changeDescription: text("change_description"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("iso_document_revisions_doc_idx").on(t.documentId)]
);
