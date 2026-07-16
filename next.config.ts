import type { NextConfig } from "next";

/**
 * Header di sicurezza applicati a tutte le route.
 *
 * La CSP è volutamente conservativa per non rompere l'app esistente:
 * - `frame-ancestors 'none'` impedisce l'embedding in iframe (clickjacking);
 * - `object-src 'none'` e `base-uri 'self'` chiudono vettori comuni;
 * - le direttive script/style restano permissive verso 'self' + inline perché
 *   Next.js inietta script/stili inline in fase di hydration. Per una CSP
 *   strict basata su nonce vedi docs/SECURITY.md.
 */
const isDev = process.env.NODE_ENV === "development";

const CONNECT_SRC = ["'self'", "https:"].join(" ");

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // 'unsafe-eval' serve solo al runtime di sviluppo (React Refresh/Turbopack).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src ${CONNECT_SRC}`,
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HSTS solo in produzione: in locale (http) l'header verrebbe comunque
  // ignorato dai browser, ma evitiamo di inviarlo per chiarezza.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Librerie server con require dinamici/asset interni: non vanno bundlate
  // (pdfmake in particolare rompe il resolver dei font se impacchettato).
  serverExternalPackages: ["pdfmake", "exceljs", "pg"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
