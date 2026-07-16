import "server-only";
import { getZitadelConfig } from "./config";
import { ZitadelApiError } from "./errors";

/**
 * Client HTTP minimale per le API v2 di ZITADEL (gRPC-gateway REST).
 * Tutte le chiamate partono dal backend Next.js con il PAT del service
 * user (mai dal browser).
 */

type ZitadelRequest = Readonly<{
  method: "GET" | "POST" | "PATCH" | "DELETE";
  /** Path assoluto, es. "/v2/sessions". */
  path: string;
  body?: unknown;
  /** Query string già costruita (usare URLSearchParams). */
  query?: URLSearchParams;
}>;

const ZITADEL_REQUEST_TIMEOUT_MS = 15_000;

export async function zitadelFetch<T>(request: ZitadelRequest): Promise<T> {
  const { issuer, serviceUserToken } = getZitadelConfig();
  const url = `${issuer}${request.path}${
    request.query && request.query.size > 0 ? `?${request.query.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${serviceUserToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: request.body !== undefined ? JSON.stringify(request.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(ZITADEL_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    let grpcCode: number | undefined;
    let apiMessage = response.statusText;
    try {
      const payload = (await response.json()) as { code?: number; message?: string };
      grpcCode = payload.code;
      apiMessage = payload.message ?? apiMessage;
    } catch {
      // body non JSON: si tiene lo statusText
    }
    throw new ZitadelApiError(response.status, grpcCode, apiMessage);
  }

  return (await response.json()) as T;
}
