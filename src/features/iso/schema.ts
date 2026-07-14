import { z } from "zod";

/** Validazione zod del modulo documentale ISO. */

export const ISO_STANDARDS = [
  { value: "iso9001", label: "ISO 9001" },
  { value: "iso27001", label: "ISO 27001" },
  { value: "iso14001", label: "ISO 14001" },
  { value: "iso45001", label: "ISO 45001" },
  { value: "other", label: "Altra norma" },
] as const;

export const ISO_TYPES = [
  { value: "procedura", label: "Procedura" },
  { value: "manuale", label: "Manuale" },
  { value: "modulo", label: "Modulo" },
  { value: "istruzione", label: "Istruzione operativa" },
  { value: "politica", label: "Politica" },
  { value: "registrazione", label: "Registrazione" },
] as const;

export const ISO_STATUSES = [
  { value: "draft", label: "Bozza" },
  { value: "in_review", label: "In revisione" },
  { value: "approved", label: "Approvato" },
  { value: "obsolete", label: "Obsoleto" },
] as const;

export const isoDocumentSchema = z.object({
  code: z.string().min(1, "Il codice documento è obbligatorio (es. PRO-01)."),
  title: z.string().min(1, "Il titolo è obbligatorio."),
  standard: z.enum(["iso9001", "iso27001", "iso14001", "iso45001", "other"]),
  type: z.enum([
    "procedura",
    "manuale",
    "modulo",
    "istruzione",
    "politica",
    "registrazione",
  ]),
  status: z.enum(["draft", "in_review", "approved", "obsolete"]),
  content: z.string().optional(),
  issueDate: z.string().optional(),
  reviewDate: z.string().optional(),
  ownerId: z.string().optional(),
  notes: z.string().optional(),
  /** Obbligatoria quando si modifica il contenuto di un documento esistente. */
  changeDescription: z.string().optional(),
});

export type IsoDocumentInput = z.infer<typeof isoDocumentSchema>;

export function isoStandardLabel(value: string): string {
  return ISO_STANDARDS.find((s) => s.value === value)?.label ?? value;
}

export function isoTypeLabel(value: string): string {
  return ISO_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function isoStatusLabel(value: string): string {
  return ISO_STATUSES.find((s) => s.value === value)?.label ?? value;
}
