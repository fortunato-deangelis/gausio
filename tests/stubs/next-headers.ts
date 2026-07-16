/**
 * Stub di next/headers per i test: cookie store e headers in-memory,
 * ispezionabili tramite gli helper __reset/__getSetCalls.
 */

export type SetCookieCall = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

const cookieJar = new Map<string, string>();
const setCalls: SetCookieCall[] = [];
let requestHeaders = new Map<string, string>();

export function __resetHeadersStub(): void {
  cookieJar.clear();
  setCalls.length = 0;
  requestHeaders = new Map();
}

export function __getSetCookieCalls(): readonly SetCookieCall[] {
  return setCalls;
}

export function __setRequestHeader(name: string, value: string): void {
  requestHeaders.set(name.toLowerCase(), value);
}

export async function cookies() {
  return {
    get(name: string) {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    has(name: string) {
      return cookieJar.has(name);
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      cookieJar.set(name, value);
      setCalls.push({ name, value, options });
    },
    delete(name: string) {
      cookieJar.delete(name);
    },
  };
}

export async function headers() {
  return {
    get(name: string) {
      return requestHeaders.get(name.toLowerCase()) ?? null;
    },
  };
}
