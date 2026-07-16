export function safeCallbackUrl(callbackUrl: string | undefined): string {
  return callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/app";
}

export function authRouteUrl(path: string, callbackUrl?: string): string {
  if (!callbackUrl) return path;
  return `${path}?${new URLSearchParams({ callbackUrl }).toString()}`;
}

export function authErrorUrl(path: string, error: string, callbackUrl?: string): string {
  const params = new URLSearchParams({ error });
  if (callbackUrl) params.set("callbackUrl", callbackUrl);
  return `${path}?${params.toString()}`;
}
