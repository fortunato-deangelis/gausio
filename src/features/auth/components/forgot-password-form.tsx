"use client";

import { useActionState } from "react";
import { ArrowRight, MailCheck, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, Button, Input, Label, Spinner } from "@/components/shared";
import { submitForgotPassword, type ForgotPasswordState } from "../actions";

/**
 * Richiesta reset password custom. La risposta è identica sia che l'email
 * esista sia che non esista (nessuna enumerazione degli utenti).
 */
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(
    submitForgotPassword,
    null
  );

  if (state && "done" in state) {
    return (
      <Alert role="status">
        <MailCheck aria-hidden className="size-[18px]" />
        <AlertDescription>
          Se l&apos;indirizzo è associato a un account, riceverai a breve
          un&apos;email con il link per reimpostare la password.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state && "error" in state && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="forgot-password-email">Email</Label>
        <Input
          id="forgot-password-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@azienda.it"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner className="size-[18px]" /> : (
          <RefreshCcw aria-hidden className="size-[18px]" />
        )}
        Recupera password
        <ArrowRight aria-hidden className="size-[18px]" />
      </Button>
    </form>
  );
}
