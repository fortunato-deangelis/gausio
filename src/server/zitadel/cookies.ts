import "server-only";
import { cookies } from "next/headers";
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

/**
 * Stato intermedio del flusso di login (tra il check password e la
 * finalizzazione OIDC, MFA inclusa). Vive in un cookie HttpOnly + Secure +
 * SameSite=Lax cifrato con AES-256-GCM; il sessionToken ZITADEL non deve
 * mai essere leggibile dal browser né finire in localStorage.
 */

export type LoginFlowState = Readonly<{
  sessionId: string;
  /** Ultimo sessionToken restituito da ZITADEL (ogni update lo rinnova). */
  sessionToken: string;
  userId: string;
  loginName: string;
  /** Destinazione interna post-login (path relativo validato). */
  redirectTo: string;
  /**
   * Auth request OIDC già aperta prima del login (flusso arrivato da
   * ZITADEL Login V2 con ?authRequest=...); se assente, la authorize
   * request viene creata da Auth.js a fattori completati.
   */
  pendingRequestId?: string;
  /** true solo quando TUTTI i fattori richiesti sono stati verificati. */
  completed?: boolean;
  /** epoch ms di creazione, per la scadenza del flusso. */
  issuedAt: number;
}>;

const COOKIE_NAME = "gausio.login-flow";
/** Un flusso di login deve concludersi entro 15 minuti. */
const FLOW_TTL_SECONDS = 15 * 60;

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET mancante: impossibile cifrare il cookie di login.");
  return Buffer.from(
    hkdfSync("sha256", secret, "", "gausio-login-flow-cookie", 32)
  );
}

export function sealLoginFlowState(state: LoginFlowState): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(state), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function openLoginFlowState(sealed: string): LoginFlowState | null {
  try {
    const raw = Buffer.from(sealed, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const state = JSON.parse(decrypted.toString("utf8")) as LoginFlowState;
    if (
      typeof state.sessionId !== "string" ||
      typeof state.sessionToken !== "string" ||
      typeof state.userId !== "string" ||
      typeof state.redirectTo !== "string" ||
      typeof state.issuedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - state.issuedAt > FLOW_TTL_SECONDS * 1000) return null;
    return state;
  } catch {
    // cookie manomesso, chiave cambiata o formato non valido
    return null;
  }
}

export async function setLoginFlowCookie(state: LoginFlowState): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sealLoginFlowState(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: FLOW_TTL_SECONDS,
  });
}

export async function readLoginFlowCookie(): Promise<LoginFlowState | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return openLoginFlowState(value);
}

export async function clearLoginFlowCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
