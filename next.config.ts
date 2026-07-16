import type { NextConfig } from "next";

/**
 * Content-Security-Policy dell'app. Note:
 * - script-src/style-src con 'unsafe-inline' per compatibilità con gli
 *   script inline di Next (percorso di hardening con nonce documentato in
 *   docs/SECURITY.md);
 * - connect-src 'self': il browser non parla mai direttamente con ZITADEL,
 *   tutte le chiamate alle API partono dal backend.
 */
export function buildContentSecurityPolicy(
  nodeEnv = process.env.NODE_ENV
): string {
  const isDevelopment = nodeEnv === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${
      isDevelopment ? " 'unsafe-eval'" : ""
    }`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const contentSecurityPolicy = buildContentSecurityPolicy();

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Ignorato dai browser su http:// (sviluppo locale), attivo in produzione.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Librerie server con require dinamici/asset interni: non vanno bundlate
  // (pdfmake in particolare rompe il resolver dei font se impacchettato).
  serverExternalPackages: ["pdfmake", "exceljs", "pg"],
  experimental: {
    serverActions: {
      // 20 MB file + overhead multipart; uploadAttachment applica poi il
      // limite esatto e le verifiche di permesso/entità.
      bodySizeLimit: "21mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...["/reset-password", "/verify-email", "/invito/:path*"].map(
        (source) => ({
          source,
          headers: [
            { key: "Referrer-Policy", value: "no-referrer" },
            { key: "Cache-Control", value: "private, no-store" },
          ],
        })
      ),
    ];
  },
};

export default nextConfig;
