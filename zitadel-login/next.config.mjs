/**
 * ZITADEL Login App — Next.js config.
 *
 * The upstream ZITADEL Login UI v2 serves its routes under the base path
 * `/ui/v2/login`. We keep the same base path so that, once the upstream app is
 * vendored in (see UPSTREAM.md), reverse-proxy rules and ZITADEL's
 * `ZITADEL_LOGIN_BASE_URL` / custom login base URL continue to line up without
 * per-route rewrites.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  basePath: "/ui/v2/login",
  // The login app must never be embeddable in a frame (clickjacking / login
  // phishing protection). Mirrors the Main App headers.
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
