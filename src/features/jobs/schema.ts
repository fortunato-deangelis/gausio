import { z } from "zod";
import type { StatusTone } from "@/components/shared/status-badge";

export const jobStatuses = [
  "draft",
  "open",
  "in_progress",
  "suspended",
  "completed",
  "cancelled",
] as const;
export type JobStatus = (typeof jobStatuses)[number];

const optionalNumericString = z
  .string()
  .optional()
  .refine((v) => !v || Number.isFinite(Number(v)), "Valore numerico non valido.");

export const jobSchema = z.object({
  title: z.string().min(2, "Inserisci il titolo della commessa."),
  description: z.string().optional(),
  clientId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  status: z.enum(jobStatuses),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetAmount: optionalNumericString,
  estimatedHours: optionalNumericString,
  managerId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  notes: z.string().optional(),
});

export type JobInput = z.infer<typeof jobSchema>;

export const quickCreateJobSchema = z.object({
  title: z.string().min(2, "Inserisci il titolo della commessa."),
});

export type QuickCreateJobInput = z.infer<typeof quickCreateJobSchema>;

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Bozza",
  open: "Aperta",
  in_progress: "In corso",
  suspended: "Sospesa",
  completed: "Completata",
  cancelled: "Annullata",
};

export const JOB_STATUS_TONES: Record<JobStatus, StatusTone> = {
  draft: "muted",
  open: "info",
  in_progress: "default",
  suspended: "warning",
  completed: "success",
  cancelled: "destructive",
};
