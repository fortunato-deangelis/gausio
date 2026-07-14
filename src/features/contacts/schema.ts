import { z } from "zod";
import type { StatusTone } from "@/components/shared/status-badge";

export const contactKinds = ["client", "supplier", "both"] as const;
export type ContactKind = (typeof contactKinds)[number];

export const supplierQualifications = [
  "not_qualified",
  "in_evaluation",
  "qualified",
  "suspended",
] as const;
export type SupplierQualification = (typeof supplierQualifications)[number];

export const contactSchema = z.object({
  businessName: z.string().min(2, "Inserisci la ragione sociale."),
  kind: z.enum(contactKinds),
  vatNumber: z.string().optional(),
  fiscalCode: z.string().optional(),
  email: z.string().email("Email non valida.").optional().or(z.literal("")),
  pec: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  sdiCode: z.string().optional(),
  iban: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  qualification: z.enum(supplierQualifications).optional(),
  qualificationDate: z.string().optional(),
  qualificationExpiry: z.string().optional(),
  qualificationNotes: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const quickCreateContactSchema = z.object({
  businessName: z.string().min(2, "Inserisci la ragione sociale."),
  kind: z.enum(contactKinds),
});

export type QuickCreateContactInput = z.infer<typeof quickCreateContactSchema>;

export const CONTACT_KIND_LABELS: Record<ContactKind, string> = {
  client: "Cliente",
  supplier: "Fornitore",
  both: "Cliente e fornitore",
};

export const CONTACT_KIND_TONES: Record<ContactKind, StatusTone> = {
  client: "info",
  supplier: "warning",
  both: "default",
};

export const QUALIFICATION_LABELS: Record<SupplierQualification, string> = {
  not_qualified: "Non qualificato",
  in_evaluation: "In valutazione",
  qualified: "Qualificato",
  suspended: "Sospeso",
};

export const QUALIFICATION_TONES: Record<SupplierQualification, StatusTone> = {
  not_qualified: "muted",
  in_evaluation: "warning",
  qualified: "success",
  suspended: "destructive",
};
