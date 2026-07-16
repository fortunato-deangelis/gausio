/**
 * Contratto uniforme per le server action: mai lanciare verso il client,
 * sempre restituire un risultato discriminato.
 */

import { ZodError } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = undefined>(error: unknown): ActionResult<T> {
  if (error instanceof ZodError) {
    return {
      ok: false,
      error: error.issues[0]?.message ?? "Dati non validi.",
    };
  }
  // Gli errori applicativi attesi sono Error standard creati nelle action.
  // Errori DB, filesystem e librerie hanno sottoclassi/costruttori propri e
  // non devono esporre query, path, vincoli o dettagli infrastrutturali.
  if (error instanceof Error && error.constructor === Error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Si è verificato un errore imprevisto." };
}
