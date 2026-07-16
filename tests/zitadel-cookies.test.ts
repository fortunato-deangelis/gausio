import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  openLoginFlowState,
  readLoginFlowCookie,
  sealLoginFlowState,
  setLoginFlowCookie,
  clearLoginFlowCookie,
  type LoginFlowState,
} from "@/server/zitadel/cookies";
import {
  __getSetCookieCalls,
  __resetHeadersStub,
} from "./stubs/next-headers";

const FLOW: LoginFlowState = {
  sessionId: "sess-1",
  sessionToken: "token-abc",
  userId: "user-1",
  loginName: "mario@azienda.it",
  redirectTo: "/app",
  pendingRequestId: "V2_123456",
  issuedAt: Date.now(),
};

describe("cookie di flusso login (AES-256-GCM)", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-value";
    __resetHeadersStub();
    vi.useRealTimers();
  });

  it("cifra e decifra lo stato (roundtrip)", () => {
    const sealed = sealLoginFlowState(FLOW);
    expect(sealed).not.toContain("token-abc");
    expect(openLoginFlowState(sealed)).toEqual(FLOW);
  });

  it("il payload cifrato non espone dati in chiaro", () => {
    const sealed = sealLoginFlowState(FLOW);
    const decoded = Buffer.from(sealed, "base64url").toString("utf8");
    expect(decoded).not.toContain("mario@azienda.it");
    expect(decoded).not.toContain("sessionToken");
  });

  it("rifiuta un cookie manomesso", () => {
    const sealed = sealLoginFlowState(FLOW);
    const tampered = sealed.slice(0, -4) + (sealed.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(openLoginFlowState(tampered)).toBeNull();
  });

  it("rifiuta un cookie cifrato con un altro segreto", () => {
    const sealed = sealLoginFlowState(FLOW);
    process.env.AUTH_SECRET = "another-secret";
    expect(openLoginFlowState(sealed)).toBeNull();
  });

  it("rifiuta un flusso scaduto (TTL 15 minuti)", () => {
    const sealed = sealLoginFlowState({
      ...FLOW,
      issuedAt: Date.now() - 16 * 60 * 1000,
    });
    expect(openLoginFlowState(sealed)).toBeNull();
  });

  it("imposta il cookie HttpOnly + SameSite=Lax (+ Secure in produzione)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      await setLoginFlowCookie(FLOW);
    } finally {
      vi.unstubAllEnvs();
      process.env.AUTH_SECRET = "test-secret-value";
    }
    const calls = __getSetCookieCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0].options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });

  it("legge e cancella il cookie", async () => {
    await setLoginFlowCookie(FLOW);
    expect(await readLoginFlowCookie()).toEqual(FLOW);
    await clearLoginFlowCookie();
    expect(await readLoginFlowCookie()).toBeNull();
  });
});
