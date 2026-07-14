import { z } from "zod";

/**
 * Riga documento condivisa tra ordini e fatture. I campi numerici restano
 * stringhe nel form (input HTML) e vengono convertiti lato server.
 */

const numericString = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((v) => !Number.isNaN(Number(v)), message);

const optionalNumericString = (message: string) =>
  z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Number(v)), message)
    .optional();

export const documentLineSchema = z.object({
  description: z.string().min(1, "Inserisci la descrizione."),
  quantity: numericString("Quantità non valida.").refine(
    (v) => Number(v) > 0,
    "La quantità deve essere maggiore di zero."
  ),
  unit: z.string().optional(),
  unitPrice: numericString("Prezzo non valido.").refine(
    (v) => Number(v) >= 0,
    "Il prezzo non può essere negativo."
  ),
  vatRate: z.string().min(1, "Seleziona l'aliquota IVA."),
  discount: optionalNumericString("Sconto non valido.").refine(
    (v) => v === undefined || v === "" || (Number(v) >= 0 && Number(v) <= 100),
    "Lo sconto deve essere tra 0 e 100."
  ),
});

export type DocumentLineInput = z.infer<typeof documentLineSchema>;

export const EMPTY_DOCUMENT_LINE: DocumentLineInput = {
  description: "",
  quantity: "1",
  unit: "pz",
  unitPrice: "0",
  vatRate: "22",
  discount: "0",
};
