"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, MailCheck } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Spinner,
} from "@/components/shared";
import {
  resendVerificationEmail,
  submitVerifyEmail,
  type VerifyEmailState,
} from "../actions";
import { AuthTextLink } from "./auth-form-elements";

type VerifyEmailFormProps = Readonly<{
  userId: string;
  /** Codice precompilato quando si arriva dal link nell'email. */
  code?: string;
}>;

/**
 * Conferma dell'indirizzo email: il codice ricevuto via email può essere
 * incollato manualmente oppure arrivare precompilato dal link. Se c'è un
 * flusso di login attivo (registrazione appena conclusa), la verifica
 * prosegue automaticamente con l'accesso.
 */
export function VerifyEmailForm({ userId, code }: VerifyEmailFormProps) {
  const [state, formAction, pending] = useActionState<VerifyEmailState, FormData>(
    submitVerifyEmail,
    null
  );
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resending, startResend] = useTransition();

  function resend() {
    setResendNotice(null);
    startResend(async () => {
      const result = await resendVerificationEmail(userId);
      setResendNotice(
        result.ok
          ? "Ti abbiamo inviato una nuova email di verifica."
          : result.error
      );
    });
  }

  if (state && "done" in state) {
    return (
      <div className="flex flex-col gap-6">
        <Alert role="status">
          <CheckCircle2 aria-hidden className="size-[18px]" />
          <AlertDescription>
            Email verificata. Il tuo account è pronto.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Vai ad <AuthTextLink href="/sign-in">Accedi</AuthTextLink>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {state && "error" in state && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {resendNotice && (
        <Alert role="status">
          <AlertDescription>{resendNotice}</AlertDescription>
        </Alert>
      )}
      <form action={formAction} className="flex flex-col gap-6">
        <input type="hidden" name="userId" value={userId} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="verify-email-code">Codice di verifica</Label>
          <Input
            id="verify-email-code"
            name="code"
            type="text"
            required
            autoComplete="one-time-code"
            placeholder="Incolla il codice ricevuto via email"
            defaultValue={code}
            autoFocus
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner className="size-[18px]" /> : (
            <MailCheck aria-hidden className="size-[18px]" />
          )}
          Conferma email
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={resend}
        disabled={resending}
      >
        {resending ? <Spinner className="size-[18px]" /> : null}
        Invia di nuovo l&apos;email di verifica
      </Button>
    </div>
  );
}
