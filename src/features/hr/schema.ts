import { z } from "zod";

/** Validazione zod del modulo Personale (dipendenti, assenze, timbrature, schede lavoro). */

const optionalEmail = z
  .string()
  .email("Email non valida.")
  .optional()
  .or(z.literal(""));

/** Stringa decimale opzionale (le colonne numeric di Drizzle sono stringhe). */
const optionalDecimal = z
  .string()
  .optional()
  .refine(
    (v) => !v || !Number.isNaN(Number(v.replace(",", "."))),
    "Inserisci un numero valido."
  );

export const EMPLOYEE_STATUSES = [
  { value: "active", label: "Attivo" },
  { value: "suspended", label: "Sospeso" },
  { value: "terminated", label: "Cessato" },
] as const;

export const CONTRACT_TYPES = [
  "Indeterminato",
  "Determinato",
  "Apprendistato",
  "Partita IVA",
  "Stage",
] as const;

export const employeeSchema = z.object({
  firstName: z.string().min(1, "Il nome è obbligatorio."),
  lastName: z.string().min(1, "Il cognome è obbligatorio."),
  fiscalCode: z.string().optional(),
  email: optionalEmail,
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  province: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  contractType: z.string().optional(),
  hiredAt: z.string().optional(),
  terminatedAt: z.string().optional(),
  status: z.enum(["active", "suspended", "terminated"]),
  hourlyCost: optionalDecimal,
  annualLeaveDays: optionalDecimal,
  notes: z.string().optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const LEAVE_TYPES = [
  { value: "ferie", label: "Ferie" },
  { value: "permesso", label: "Permesso" },
  { value: "malattia", label: "Malattia" },
] as const;

export const LEAVE_STATUSES = [
  { value: "pending", label: "In attesa" },
  { value: "approved", label: "Approvata" },
  { value: "rejected", label: "Rifiutata" },
  { value: "cancelled", label: "Annullata" },
] as const;

export const leaveSchema = z
  .object({
    employeeId: z.string().uuid("Seleziona il dipendente."),
    type: z.enum(["ferie", "permesso", "malattia"]),
    startDate: z.string().min(1, "La data di inizio è obbligatoria."),
    endDate: z.string().min(1, "La data di fine è obbligatoria."),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    reason: z.string().optional(),
    protocolNumber: z.string().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "La data di fine deve essere successiva o uguale all'inizio.",
    path: ["endDate"],
  })
  .refine(
    (v) => !v.startTime || !v.endTime || v.endTime > v.startTime,
    {
      message: "L'ora di fine deve essere successiva all'inizio.",
      path: ["endTime"],
    }
  );

export type LeaveInput = z.infer<typeof leaveSchema>;

export const timeEntrySchema = z
  .object({
    employeeId: z.string().uuid("Seleziona il dipendente."),
    date: z.string().min(1, "La data è obbligatoria."),
    clockIn: z.string().min(1, "L'ora di entrata è obbligatoria."),
    clockOut: z.string().optional(),
    breakMinutes: z
      .string()
      .optional()
      .refine(
        (v) => !v || (/^\d+$/.test(v) && Number(v) >= 0),
        "Minuti di pausa non validi."
      ),
    notes: z.string().optional(),
  })
  .refine((v) => !v.clockOut || v.clockOut > v.clockIn, {
    message: "L'uscita deve essere successiva all'entrata.",
    path: ["clockOut"],
  });

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;

export const workLogSchema = z.object({
  employeeId: z.string().uuid("Seleziona il dipendente."),
  jobId: z.string().uuid("Seleziona la commessa."),
  date: z.string().min(1, "La data è obbligatoria."),
  hours: z
    .string()
    .min(1, "Le ore sono obbligatorie.")
    .refine(
      (v) => Number(v.replace(",", ".")) > 0,
      "Le ore devono essere maggiori di zero."
    ),
  description: z.string().optional(),
});

export type WorkLogInput = z.infer<typeof workLogSchema>;

/** Normalizza una stringa decimale italiana ("1,5") per le colonne numeric. */
export function normalizeDecimal(value: string | undefined): string | null {
  if (!value) return null;
  const n = Number(value.replace(",", "."));
  return Number.isNaN(n) ? null : String(n);
}
