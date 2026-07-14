"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { contactRequestSchema, type ContactRequestInput } from "./schema";

/**
 * Richiesta di contatto dal sito pubblico. Non essendo configurato un
 * provider email, la richiesta viene validata e registrata nei log del
 * server (punto di estensione per SMTP/CRM).
 */
export async function submitContactRequest(
  input: ContactRequestInput
): Promise<ActionResult<undefined>> {
  try {
    const parsed = contactRequestSchema.parse(input);
    console.info("[contatti] Nuova richiesta di contatto", {
      name: parsed.name,
      email: parsed.email,
      company: parsed.company ?? null,
      messageLength: parsed.message.length,
      receivedAt: new Date().toISOString(),
    });
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
