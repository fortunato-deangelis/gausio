import { NextResponse } from "next/server";
import { getReadiness } from "@/server/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Health check aggregato: processo vivo + configurazione minima + dipendenze.
 * Non espone valori di configurazione o segreti. Ritorna 200 se pronto,
 * 503 se degradato, così i load balancer possono agire di conseguenza.
 */
export async function GET() {
  const readiness = await getReadiness();
  return NextResponse.json(
    {
      status: readiness.status,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: readiness.checks,
    },
    { status: readiness.status === "ok" ? 200 : 503 }
  );
}
