import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSession,
  deleteSession,
  getSession,
  updateSession,
} from "@/server/zitadel/session";
import {
  failAuthRequest,
  finalizeAuthRequest,
  getAuthRequest,
} from "@/server/zitadel/auth-request";
import {
  findUserIdByEmail,
  listAuthenticationMethods,
  registerHumanUser,
  requestPasswordReset,
  resendEmailCode,
  setPasswordWithCode,
  verifyEmail,
} from "@/server/zitadel/users";
import { ZitadelApiError } from "@/server/zitadel/errors";

/**
 * Verifica la forma esatta (metodo, path, header, body) delle richieste
 * verso le API v2 di ZITADEL, con fetch mockato: gli endpoint sono quelli
 * della documentazione ufficiale citata nei singoli moduli.
 */

const API = "https://idp.example.com";
let fetchMock: ReturnType<typeof vi.fn>;

function lastCall(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init };
}

function lastBody(): Record<string, unknown> {
  return JSON.parse(String(lastCall().init.body)) as Record<string, unknown>;
}

beforeEach(() => {
  process.env.AUTH_ZITADEL_ISSUER = API;
  process.env.ZITADEL_SERVICE_USER_TOKEN = "pat-token";
  process.env.AUTH_URL = "https://app.gausio.com";
  fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), { status: 200 })
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("autenticazione della chiamata", () => {
  it("ogni richiesta porta il Bearer PAT e Content-Type JSON", async () => {
    await createSession({ loginName: "a@b.it" });
    const { init } = lastCall();
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer pat-token");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.Accept).toBe("application/json");
  });

  it("un errore API produce ZitadelApiError con messaggio e status", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ code: 3, message: "Errors.User.Password.Invalid (COMMAND-3M0fs)" }),
        { status: 400 }
      )
    );
    await expect(updateSession("s1", { checks: { password: { password: "x" } } }))
      .rejects.toMatchObject({
        httpStatus: 400,
        grpcCode: 3,
        apiMessage: expect.stringContaining("Errors.User.Password.Invalid"),
      });
    fetchMock.mockResolvedValueOnce(new Response("oops", { status: 503 }));
    await expect(createSession({ loginName: "a@b.it" })).rejects.toBeInstanceOf(
      ZitadelApiError
    );
  });
});

describe("Session API v2", () => {
  it("createSession: POST /v2/sessions con check utente e lifetime", async () => {
    await createSession({ loginName: "mario@azienda.it" });
    const { url, init } = lastCall();
    expect(url).toBe(`${API}/v2/sessions`);
    expect(init.method).toBe("POST");
    expect(lastBody()).toEqual({
      checks: { user: { loginName: "mario@azienda.it" } },
      lifetime: "18000s",
    });
  });

  it("updateSession: PATCH /v2/sessions/{id} con check password", async () => {
    await updateSession("sess-1", { checks: { password: { password: "pw" } } });
    const { url, init } = lastCall();
    expect(url).toBe(`${API}/v2/sessions/sess-1`);
    expect(init.method).toBe("PATCH");
    expect(lastBody()).toEqual({ checks: { password: { password: "pw" } } });
  });

  it("updateSession: challenge OTP email (sendCode) e SMS (returnCode false)", async () => {
    await updateSession("sess-1", { challenges: { otpEmail: { sendCode: {} } } });
    expect(lastBody()).toEqual({ challenges: { otpEmail: { sendCode: {} } } });
    await updateSession("sess-1", { challenges: { otpSms: { returnCode: false } } });
    expect(lastBody()).toEqual({ challenges: { otpSms: { returnCode: false } } });
  });

  it("updateSession: check TOTP / OTP / WebAuthn", async () => {
    await updateSession("sess-1", { checks: { totp: { code: "123456" } } });
    expect(lastBody()).toEqual({ checks: { totp: { code: "123456" } } });
    await updateSession("sess-1", { checks: { otpEmail: { code: "654321" } } });
    expect(lastBody()).toEqual({ checks: { otpEmail: { code: "654321" } } });
    await updateSession("sess-1", {
      checks: { webAuthN: { credentialAssertionData: { id: "cred" } } },
    });
    expect(lastBody()).toEqual({
      checks: { webAuthN: { credentialAssertionData: { id: "cred" } } },
    });
  });

  it("getSession: GET /v2/sessions/{id}?sessionToken=…", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ session: { factors: { user: { id: "u1" } } } }),
        { status: 200 }
      )
    );
    const factors = await getSession("sess-1", "tok");
    const { url, init } = lastCall();
    expect(url).toBe(`${API}/v2/sessions/sess-1?sessionToken=tok`);
    expect(init.method).toBe("GET");
    expect(factors.user?.id).toBe("u1");
  });

  it("deleteSession: DELETE /v2/sessions/{id} con sessionToken nel body", async () => {
    await deleteSession("sess-1", "tok");
    const { url, init } = lastCall();
    expect(url).toBe(`${API}/v2/sessions/sess-1`);
    expect(init.method).toBe("DELETE");
    expect(lastBody()).toEqual({ sessionToken: "tok" });
  });
});

describe("OIDC Service v2 (auth request)", () => {
  it("getAuthRequest: GET /v2/oidc/auth_requests/{id}", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ authRequest: { id: "V2_1", prompt: ["PROMPT_CREATE"] } }),
        { status: 200 }
      )
    );
    const request = await getAuthRequest("V2_1");
    expect(lastCall().url).toBe(`${API}/v2/oidc/auth_requests/V2_1`);
    expect(request.prompt).toContain("PROMPT_CREATE");
  });

  it("finalizeAuthRequest: POST con session {id, token} → callbackUrl", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ callbackUrl: "https://app.gausio.com/api/auth/callback/zitadel?code=c" }),
        { status: 200 }
      )
    );
    const callbackUrl = await finalizeAuthRequest("V2_1", {
      sessionId: "s1",
      sessionToken: "tok",
    });
    const { url, init } = lastCall();
    expect(url).toBe(`${API}/v2/oidc/auth_requests/V2_1`);
    expect(init.method).toBe("POST");
    expect(lastBody()).toEqual({ session: { sessionId: "s1", sessionToken: "tok" } });
    expect(callbackUrl).toContain("code=c");
  });

  it("failAuthRequest: POST con error OIDC", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ callbackUrl: "https://client/cb?error=login_required" }), {
        status: 200,
      })
    );
    await failAuthRequest("V2_1", { error: "ERROR_REASON_LOGIN_REQUIRED" });
    expect(lastBody()).toEqual({ error: { error: "ERROR_REASON_LOGIN_REQUIRED" } });
  });
});

describe("User API v2", () => {
  it("registerHumanUser: POST /v2/users/human con sendCode e urlTemplate", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ userId: "u1" }), { status: 200 })
    );
    const { userId } = await registerHumanUser({
      givenName: "Mario",
      familyName: "Rossi",
      email: "mario@azienda.it",
      password: "Secret123!",
    });
    const { url } = lastCall();
    expect(url).toBe(`${API}/v2/users/human`);
    const body = lastBody() as {
      profile: Record<string, string>;
      email: { email: string; sendCode: { urlTemplate: string } };
      password: { password: string; changeRequired: boolean };
    };
    expect(body.profile).toEqual({ givenName: "Mario", familyName: "Rossi" });
    expect(body.email.email).toBe("mario@azienda.it");
    expect(body.email.sendCode.urlTemplate).toBe(
      "https://app.gausio.com/verify-email?userId={{.UserID}}&code={{.Code}}"
    );
    expect(body.password).toEqual({ password: "Secret123!", changeRequired: false });
    expect(userId).toBe("u1");
  });

  it("verifyEmail / resendEmailCode", async () => {
    await verifyEmail("u1", "CODE1");
    expect(lastCall().url).toBe(`${API}/v2/users/u1/email/verify`);
    expect(lastBody()).toEqual({ verificationCode: "CODE1" });

    await resendEmailCode("u1");
    expect(lastCall().url).toBe(`${API}/v2/users/u1/email/resend`);
    expect(lastBody()).toEqual({
      sendCode: {
        urlTemplate: "https://app.gausio.com/verify-email?userId={{.UserID}}&code={{.Code}}",
      },
    });
  });

  it("findUserIdByEmail: POST /v2/users con emailQuery EQUALS e limit 1", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: [{ userId: "u9" }] }), { status: 200 })
    );
    const userId = await findUserIdByEmail("mario@azienda.it");
    expect(lastCall().url).toBe(`${API}/v2/users`);
    expect(lastBody()).toEqual({
      query: { limit: 1 },
      queries: [
        {
          emailQuery: {
            emailAddress: "mario@azienda.it",
            method: "TEXT_QUERY_METHOD_EQUALS",
          },
        },
      ],
    });
    expect(userId).toBe("u9");
  });

  it("findUserIdByEmail: nessun risultato → null", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: [] }), { status: 200 })
    );
    expect(await findUserIdByEmail("nessuno@azienda.it")).toBeNull();
  });

  it("requestPasswordReset: sendLink con urlTemplate verso /reset-password", async () => {
    await requestPasswordReset("u1");
    expect(lastCall().url).toBe(`${API}/v2/users/u1/password_reset`);
    expect(lastBody()).toEqual({
      sendLink: {
        notificationType: "NOTIFICATION_TYPE_Email",
        urlTemplate:
          "https://app.gausio.com/reset-password?userId={{.UserID}}&code={{.Code}}",
      },
    });
  });

  it("setPasswordWithCode: POST /v2/users/{id}/password con verificationCode", async () => {
    await setPasswordWithCode("u1", "NewSecret123!", "RESET1");
    expect(lastCall().url).toBe(`${API}/v2/users/u1/password`);
    expect(lastBody()).toEqual({
      newPassword: { password: "NewSecret123!", changeRequired: false },
      verificationCode: "RESET1",
    });
  });

  it("listAuthenticationMethods: GET con includeWithoutDomain e domain", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ authMethodTypes: ["AUTHENTICATION_METHOD_TYPE_TOTP"] }),
        { status: 200 }
      )
    );
    const methods = await listAuthenticationMethods("u1", "app.gausio.com");
    expect(lastCall().url).toBe(
      `${API}/v2/users/u1/authentication_methods?includeWithoutDomain=true&domain=app.gausio.com`
    );
    expect(methods).toEqual(["AUTHENTICATION_METHOD_TYPE_TOTP"]);
  });
});
