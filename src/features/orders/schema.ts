import { z } from "zod";
import { documentLineSchema } from "@/features/documents-shared/line-schema";
import type { StatusTone } from "@/components/shared";

export const ORDER_STATUS_OPTIONS = [
  { value: "draft", label: "Bozza" },
  { value: "confirmed", label: "Confermato" },
  { value: "partially_fulfilled", label: "Parz. evaso" },
  { value: "fulfilled", label: "Evaso" },
  { value: "cancelled", label: "Annullato" },
] as const;

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number]["value"];

export function orderStatusLabel(status: string): string {
  return (
    ORDER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export function orderStatusTone(status: string): StatusTone {
  switch (status) {
    case "confirmed":
      return "info";
    case "partially_fulfilled":
      return "warning";
    case "fulfilled":
      return "success";
    case "cancelled":
      return "destructive";
    default:
      return "muted";
  }
}

export const orderSchema = z.object({
  contactId: z.string().uuid("Seleziona un contatto."),
  jobId: z.string().uuid().nullable().optional(),
  date: z.string().min(1, "Inserisci la data."),
  expectedDate: z.string().optional(),
  status: z.enum([
    "draft",
    "confirmed",
    "partially_fulfilled",
    "fulfilled",
    "cancelled",
  ]),
  currency: z.string().min(1),
  notes: z.string().optional(),
  lines: z
    .array(documentLineSchema)
    .min(1, "Aggiungi almeno una riga.")
    .max(200, "Un documento può contenere al massimo 200 righe."),
});

export type OrderInput = z.infer<typeof orderSchema>;
