/**
 * Placeholder landing route for the Login App scaffold.
 *
 * This intentionally does NOT implement authentication. The real login flows
 * (loginname, password, passkey, IdP, OTP, etc.) come from the upstream
 * ZITADEL Login UI v2 and must be vendored in following UPSTREAM.md. Until then
 * this page documents the scaffold state so the running app is not a blank
 * screen.
 */
export default function ScaffoldPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "34rem", lineHeight: 1.5 }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
          ZITADEL Login App — scaffold
        </h1>
        <p style={{ marginBottom: "0.75rem" }}>
          This is the sibling Login App scaffold. It tracks the upstream ZITADEL
          Login UI v2 but does not yet contain the vendored login flows.
        </p>
        <p style={{ marginBottom: "0.75rem" }}>
          Follow <code>UPSTREAM.md</code> to vendor the upstream app into{" "}
          <code>vendor/</code>, then wire the Main App&apos;s{" "}
          <code>ZITADEL_LOGIN_BASE_URL</code> to this deployment.
        </p>
        <p>
          Health probe: <code>/ui/v2/login/api/health</code>
        </p>
      </div>
    </main>
  );
}
