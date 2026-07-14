import { z } from "zod";

export const contactRequestSchema = z.object({
  name: z.string().min(2, "Inserisci il tuo nome."),
  email: z.string().email("Email non valida."),
  company: z.string().optional(),
  message: z
    .string()
    .min(10, "Il messaggio deve contenere almeno 10 caratteri.")
    .max(2000, "Il messaggio non può superare i 2000 caratteri."),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
