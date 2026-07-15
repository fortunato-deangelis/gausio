/**
 * Health reporting for the ZITADEL Login App.
 *
 * The upstream Login UI talks to a ZITADEL instance via `ZITADEL_API_URL`
 * using a service-user token (`ZITADEL_SERVICE_USER_TOKEN`). Readiness here
 * means: config is present and the API base is reachable. We never include
 * token values in the response.
 */

export interface LoginHealthReport {
  status: "ok" | "degraded" | "error";
  service: "zitadel-login";
  uptimeSeconds: number;
  timestamp: string;
  config: {
    zitadelApiUrlConfigured: boolean;
    serviceUserTokenConfigured: boolean;
  };
  checks: {
    zitadelApiReachable: boolean | "skipped";
  };
}

function normalizeUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, "");
}

export async function checkLoginHealth(
  env: Record<string, string | undefined> = process.env
): Promise<LoginHealthReport> {
  const apiUrl = normalizeUrl(env.ZITADEL_API_URL);
  const hasToken = Boolean(env.ZITADEL_SERVICE_USER_TOKEN?.trim());

  let reachable: boolean | "skipped" = "skipped";
  if (apiUrl) {
    reachable = await pingZitadel(apiUrl);
  }

  const configOk = Boolean(apiUrl) && hasToken;
  const status: LoginHealthReport["status"] = !configOk
    ? "degraded"
    : reachable === false
      ? "error"
      : "ok";

  return {
    status,
    service: "zitadel-login",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    config: {
      zitadelApiUrlConfigured: Boolean(apiUrl),
      serviceUserTokenConfigured: hasToken,
    },
    checks: { zitadelApiReachable: reachable },
  };
}

async function pingZitadel(apiUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    // Discovery document is unauthenticated and cheap.
    const res = await fetch(`${apiUrl}/.well-known/openid-configuration`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
