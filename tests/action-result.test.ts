import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fail } from "@/lib/action-result";

describe("ActionResult error hygiene", () => {
  it("mantiene i messaggi applicativi e di validazione", () => {
    expect(fail(new Error("Operazione non consentita."))).toEqual({
      ok: false,
      error: "Operazione non consentita.",
    });
    const parsed = z.string().email("Email non valida.").safeParse("x");
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(fail(parsed.error)).toEqual({
        ok: false,
        error: "Email non valida.",
      });
    }
  });

  it("non espone dettagli di errori infrastrutturali", () => {
    class DatabaseError extends Error {}
    const result = fail(
      new DatabaseError(
        'duplicate key violates constraint "users_email_key" on db-host'
      )
    );
    expect(result).toEqual({
      ok: false,
      error: "Si è verificato un errore imprevisto.",
    });
  });
});
