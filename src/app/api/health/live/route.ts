import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness: il processo applicativo è vivo e risponde. Non verifica dipendenze
 * esterne (usare /api/health/ready per quello). Sempre 200 se il server gira.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
