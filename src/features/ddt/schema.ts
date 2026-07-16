import { z } from "zod";
import type { StatusTone } from "@/components/shared";

export const DDT_STATUS_OPTIONS = [
  { value: "draft", label: "Bozza" },
  { value: "shipped", label: "Spedito" },
  { value: "delivered", label: "Consegnato" },
  { value: "cancelled", label: "Annullato" },
] as const;

export type DdtStatus = (typeof DDT_STATUS_OPTIONS)[number]["value"];

export function ddtStatusLabel(status: string): string {
  return DDT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function ddtStatusTone(status: string): StatusTone {
  switch (status) {
    case "shipped":
      return "info";
    case "delivered":
      return "success";
    case "cancelled":
      return "destructive";
    default:
      return "muted";
  }
}

export const TRANSPORT_REASON_OPTIONS = [
  { value: "Vendita", label: "Vendita" },
  { value: "Conto lavorazione", label: "Conto lavorazione" },
  { value: "Reso", label: "Reso" },
  { value: "Trasferimento", label: "Trasferimento" },
] as const;

export const TRANSPORTED_BY_OPTIONS = [
  { value: "Mittente", label: "Mittente" },
  { value: "Destinatario", label: "Destinatario" },
  { value: "Vettore", label: "Vettore" },
] as const;

export const ddtLineSchema = z.object({
  itemId: z.string().uuid().nullable().optional(),
  description: z.string().min(1, "Inserisci la descrizione."),
  quantity: z
    .string()
    .min(1, "Inserisci la quantità.")
    .refine(
      (v) => Number.isFinite(Number(v)) && Number(v) > 0,
      "La quantità deve essere maggiore di zero."
    ),
  unit: z.string().optional(),
});

export type DdtLineInput = z.infer<typeof ddtLineSchema>;

export const EMPTY_DDT_LINE: DdtLineInput = {
  itemId: null,
  description: "",
  quantity: "1",
  unit: "pz",
};

export const ddtSchema = z.object({
  contactId: z.string().uuid("Seleziona un contatto."),
  jobId: z.string().uuid().nullable().optional(),
  date: z.string().min(1, "Inserisci la data."),
  status: z.enum(["draft", "shipped", "delivered", "cancelled"]),
  transportReason: z.string().min(1, "Seleziona la causale."),
  transportedBy: z.string().min(1, "Seleziona il trasporto a cura di."),
  carrier: z.string().optional(),
  packagesCount: z
    .string()
    .refine(
      (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0),
      "Numero colli non valido."
    )
    .optional(),
  weight: z.string().optional(),
  destinationAddress: z.string().optional(),
  notes: z.string().optional(),
  lines: z
    .array(ddtLineSchema)
    .min(1, "Aggiungi almeno una riga.")
    .max(200, "Un DDT può contenere al massimo 200 righe."),
});

export type DdtInput = z.infer<typeof ddtSchema>;
