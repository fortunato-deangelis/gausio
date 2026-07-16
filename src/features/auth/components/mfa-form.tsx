"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowRight, Fingerprint, MessageSquareText, Smartphone } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
  Separator,
  Spinner,
} from "@/components/shared";
import type { MfaMethod } from "@/server/zitadel/mfa";
import {
  sendOtpChallenge,
  startWebAuthnChallenge,
  submitMfaCode,
  submitWebAuthnAssertion,
  type MfaVerifyState,
} from "../actions";

type MfaFormProps = Readonly<{
  methods: readonly MfaMethod[];
  loginName: string;
}>;

const METHOD_LABELS: Record<MfaMethod, string> = {
  totp: "App di autenticazione",
  otpEmail: "Codice via email",
  otpSms: "Codice via SMS",
  webAuthN: "Chiave di sicurezza / passkey",
};

/** Serializza la credenziale WebAuthn del browser per la Session API. */
async function getWebAuthnAssertion(
  options: Record<string, unknown>
): Promise<string | null> {
  type PkcStatic = typeof PublicKeyCredential & {
    parseRequestOptionsFromJSON?: (json: unknown) => PublicKeyCredentialRequestOptions;
  };
  const pkc = window.PublicKeyCredential as PkcStatic | undefined;
  if (!pkc?.parseRequestOptionsFromJSON) return null;

  // ZITADEL può restituire l'oggetto già annidato in { publicKey: ... }.
  const publicKeyJson = (options.publicKey ?? options) as Record<string, unknown>;
  const publicKey = pkc.parseRequestOptionsFromJSON(publicKeyJson);
  const credential = (await navigator.credentials.get({ publicKey })) as
    | (PublicKeyCredential & { toJSON?: () => unknown })
    | null;
  if (!credential?.toJSON) return null;
  return JSON.stringify(credential.toJSON());
}

export function MfaForm({ methods, loginName }: MfaFormProps) {
  const codeMethods = methods.filter((m): m is "totp" | "otpEmail" | "otpSms" =>
    m === "totp" || m === "otpEmail" || m === "otpSms"
  );
  const [method, setMethod] = useState<MfaMethod>(methods[0] ?? "totp");
  const [notice, setNotice] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const [verifyingPasskey, startPasskey] = useTransition();
  const [state, formAction, pending] = useActionState<MfaVerifyState, FormData>(
    submitMfaCode,
    null
  );

  const error = clientError ?? state?.error ?? null;

  function requestOtp(target: "otpEmail" | "otpSms") {
    setNotice(null);
    setClientError(null);
    startSending(async () => {
      const result = await sendOtpChallenge(target);
      if (result.ok) {
        setNotice(
          target === "otpEmail"
            ? "Ti abbiamo inviato un codice via email."
            : "Ti abbiamo inviato un codice via SMS."
        );
      } else {
        setClientError(result.error);
      }
    });
  }

  function runPasskey() {
    setNotice(null);
    setClientError(null);
    startPasskey(async () => {
      const challenge = await startWebAuthnChallenge();
      if (!challenge.ok) {
        setClientError(challenge.error);
        return;
      }
      let assertion: string | null = null;
      try {
        assertion = await getWebAuthnAssertion(
          challenge.data.publicKeyCredentialRequestOptions
        );
      } catch {
        assertion = null;
      }
      if (!assertion) {
        setClientError(
          "Verifica con chiave di sicurezza non riuscita o annullata. Riprova o usa un altro metodo."
        );
        return;
      }
      const result = await submitWebAuthnAssertion(assertion);
      if (!result.ok) setClientError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Accesso come <span className="font-semibold text-foreground">{loginName}</span>.
        Completa la verifica in due passaggi per continuare.
      </p>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && !error && (
        <Alert role="status">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {methods.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Metodo di verifica">
          {methods.map((m) => (
            <Button
              key={m}
              type="button"
              size="sm"
              variant={m === method ? "default" : "outline"}
              onClick={() => {
                setMethod(m);
                setNotice(null);
                setClientError(null);
              }}
            >
              {METHOD_LABELS[m]}
            </Button>
          ))}
        </div>
      )}

      {method === "webAuthN" ? (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={runPasskey}
          disabled={verifyingPasskey}
        >
          {verifyingPasskey ? <Spinner className="size-[18px]" /> : (
            <Fingerprint aria-hidden className="size-[18px]" />
          )}
          Verifica con chiave di sicurezza
        </Button>
      ) : (
        <form action={formAction} className="flex flex-col gap-6">
          <input type="hidden" name="method" value={method} />
          {(method === "otpEmail" || method === "otpSms") && (
            <Button
              type="button"
              variant="outline"
              onClick={() => requestOtp(method)}
              disabled={sending}
            >
              {sending ? <Spinner className="size-[18px]" /> : method === "otpEmail" ? (
                <MessageSquareText aria-hidden className="size-[18px]" />
              ) : (
                <Smartphone aria-hidden className="size-[18px]" />
              )}
              {method === "otpEmail" ? "Invia codice via email" : "Invia codice via SMS"}
            </Button>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="mfa-code">
              {method === "totp"
                ? "Codice dell'app di autenticazione"
                : "Codice di verifica"}
            </Label>
            <InputOTP id="mfa-code" name="code" maxLength={6} required autoFocus>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Spinner className="size-[18px]" /> : null}
            Verifica e accedi
            <ArrowRight aria-hidden className="size-[18px]" />
          </Button>
        </form>
      )}

      {codeMethods.length === 0 && method !== "webAuthN" && (
        <>
          <Separator />
          <p className="text-sm text-muted-foreground">
            Nessun metodo di verifica disponibile. Contatta un amministratore.
          </p>
        </>
      )}
    </div>
  );
}
