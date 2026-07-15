import { NextResponse } from "next/server";
import { checkLoginHealth } from "@/lib/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness + minimal readiness probe for the Login App.
 *
 * Reports process info, whether the mandatory ZITADEL API config is present,
 * and (best-effort) reachability of the ZITADEL API — never leaking secrets.
 */
export async function GET() {
  const report = await checkLoginHealth();
  return NextResponse.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
