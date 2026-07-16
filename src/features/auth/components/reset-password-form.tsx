"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, Button, Input, Label, Spinner } from "@/components/shared";
import { submitResetPassword, type ResetPasswordState } from "../actions";
import { AuthTextLink } from "./auth-form-elements";

type ResetPasswordFormProps = Readonly<{
  userId: string;
  code: string;
  passwordPolicyHint?: string;
}>;

/** Impostazione della nuova password con il codice ricevuto via email. */
export function ResetPasswordForm({ userId, code, passwordPolicyHint }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    submitResetPassword,
    null
  );

  if (state && "done" in state) {
    return (
      <div className="flex flex-col gap-6">
        <Alert role="status">
          <CheckCircle2 aria-hidden className="size-[18px]" />
          <AlertDescription>
            Password aggiornata. Ora puoi accedere con la nuova password.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Vai ad <AuthTextLink href="/sign-in">Accedi</AuthTextLink>.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="code" value={code} />
      {state && "error" in state && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password-new">Nuova password</Label>
        <Input
          id="reset-password-new"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Crea una nuova password"
        />
        {passwordPolicyHint && (
          <p className="text-sm text-muted-foreground">{passwordPolicyHint}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password-confirm">Conferma password</Label>
        <Input
          id="reset-password-confirm"
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Ripeti la nuova password"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner className="size-[18px]" /> : null}
        Imposta nuova password
        <ArrowRight aria-hidden className="size-[18px]" />
      </Button>
    </form>
  );
}
