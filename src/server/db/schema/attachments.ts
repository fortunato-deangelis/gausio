import {
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
 * Allegati polimorfici: qualunque entità applicativa può avere file allegati
 * (entityType + entityId). I file sono salvati su disco in `storage/uploads`.
 */

export const attachmentEntityEnum = pgEnum("attachment_entity", [
  "contact",
  "order",
  "invoice",
  "ddt",
  "warehouse_item",
  "stock_movement",
  "job",
  "project",
  "project_task",
  "employee",
  "leave_request",
  "work_log",
  "iso_document",
  "workspace",
]);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    entityType: attachmentEntityEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** Percorso relativo dentro storage/uploads. */
    storagePath: text("storage_path").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("attachments_entity_idx").on(t.workspaceId, t.entityType, t.entityId),
  ]
);
