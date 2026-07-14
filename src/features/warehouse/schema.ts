import { z } from "zod";
import type { StatusTone } from "@/components/shared";

const optionalNumeric = (message: string) =>
  z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Number(v)), message)
    .optional();

export const itemSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, "Inserisci il nome dell'articolo."),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1, "Inserisci l'unità di misura."),
  location: z.string().optional(),
  minStock: optionalNumeric("Scorta minima non valida."),
  unitCost: optionalNumeric("Costo non valido."),
  unitPrice: optionalNumeric("Prezzo non valido."),
  supplierId: z.string().uuid().nullable().optional(),
});

export type ItemInput = z.infer<typeof itemSchema>;

export const MOVEMENT_TYPE_OPTIONS = [
  { value: "in", label: "Carico" },
  { value: "out", label: "Scarico" },
  { value: "adjustment", label: "Rettifica" },
] as const;

export type MovementType = (typeof MOVEMENT_TYPE_OPTIONS)[number]["value"];

export function movementTypeLabel(type: string): string {
  return MOVEMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function movementTypeTone(type: string): StatusTone {
  switch (type) {
    case "in":
      return "success";
    case "out":
      return "destructive";
    default:
      return "info";
  }
}

export const movementSchema = z.object({
  itemId: z.string().uuid("Seleziona un articolo."),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z
    .string()
    .min(1, "Inserisci la quantità.")
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
      "La quantità deve essere maggiore di zero."
    ),
  date: z.string().min(1, "Inserisci la data."),
  reason: z.string().optional(),
  contactId: z.string().uuid().nullable().optional(),
  jobId: z.string().uuid().nullable().optional(),
});

export type MovementInput = z.infer<typeof movementSchema>;
