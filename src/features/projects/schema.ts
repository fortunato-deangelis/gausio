import { z } from "zod";
import type { StatusTone } from "@/components/shared/status-badge";

export const projectStatuses = [
  "planned",
  "active",
  "on_hold",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const taskStatuses = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

const optionalNumericString = z
  .string()
  .optional()
  .refine((v) => !v || Number.isFinite(Number(v)), "Valore numerico non valido.");

export const projectSchema = z.object({
  name: z.string().min(2, "Inserisci il nome del progetto."),
  description: z.string().optional(),
  status: z.enum(projectStatuses),
  clientId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  jobId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetHours: optionalNumericString,
  managerId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const taskSchema = z.object({
  title: z.string().min(2, "Inserisci il titolo dell'attività."),
  description: z.string().optional(),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  assigneeId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  dueDate: z.string().optional(),
  estimatedHours: optionalNumericString,
});

export type TaskInput = z.infer<typeof taskSchema>;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "Pianificato",
  active: "Attivo",
  on_hold: "In pausa",
  completed: "Completato",
  cancelled: "Annullato",
};

export const PROJECT_STATUS_TONES: Record<ProjectStatus, StatusTone> = {
  planned: "info",
  active: "default",
  on_hold: "warning",
  completed: "success",
  cancelled: "destructive",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Da fare",
  in_progress: "In corso",
  review: "In revisione",
  done: "Completata",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export const TASK_PRIORITY_TONES: Record<TaskPriority, StatusTone> = {
  low: "muted",
  medium: "info",
  high: "warning",
  urgent: "destructive",
};
