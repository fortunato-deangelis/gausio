import { z } from "zod";
import { documentLineSchema } from "@/features/documents-shared/line-schema";
import type { StatusTone } from "@/components/shared";

export const INVOICE_STATUS_OPTIONS = [
  { value: "draft", label: "Bozza" },
  { value: "issued", label: "Emessa" },
  { value: "sent", label: "Inviata" },
  { value: "paid", label: "Pagata" },
  { value: "overdue", label: "Scaduta" },
  { value: "cancelled", label: "Annullata" },
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUS_OPTIONS)[number]["value"];

export function invoiceStatusLabel(status: string): string {
  return (
    INVOICE_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export function invoiceStatusTone(status: string): StatusTone {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
      return "destructive";
    case "sent":
      return "info";
    case "issued":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "muted";
  }
}

export const PAYMENT_METHOD_OPTIONS = [
  { value: "Bonifico", label: "Bonifico" },
  { value: "RiBa", label: "RiBa" },
  { value: "Contanti", label: "Contanti" },
  { value: "Carta", label: "Carta" },
] as const;

export const invoiceSchema = z.object({
  contactId: z.string().uuid("Seleziona un contatto."),
  jobId: z.string().uuid().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  date: z.string().min(1, "Inserisci la data."),
  dueDate: z.string().optional(),
  status: z.enum(["draft", "issued", "sent", "paid", "overdue", "cancelled"]),
  currency: z.string().min(1),
  paymentMethod: z.string().optional(),
  paymentTerms: z.string().optional(),
  externalReference: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(documentLineSchema).min(1, "Aggiungi almeno una riga."),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
