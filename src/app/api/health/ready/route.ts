import { NextResponse } from "next/server";
import { getReadiness } from "@/server/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Readiness: l'app è pronta a ricevere traffico (config minima + database +
 * discovery ZITADEL raggiungibile). Ritorna 503 se una dipendenza necessaria
 * non è disponibile. Non espone valori di configurazione o segreti.
 */
export async function GET() {
  const readiness = await getReadiness();
  return NextResponse.json(
    { status: readiness.status, checks: readiness.checks },
    { status: readiness.status === "ok" ? 200 : 503 }
  );
}
