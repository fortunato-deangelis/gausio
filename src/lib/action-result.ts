/**
 * Contratto uniforme per le server action: mai lanciare verso il client,
 * sempre restituire un risultato discriminato.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = undefined>(error: unknown): ActionResult<T> {
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Si è verificato un errore imprevisto." };
}
