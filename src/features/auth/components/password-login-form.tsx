"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { Alert, AlertDescription, Button, Input, Label, Spinner } from "@/components/shared";
import { submitPasswordLogin, type PasswordLoginState } from "../actions";
import { AuthLinkRow, AuthTextLink } from "./auth-form-elements";

type PasswordLoginFormProps = Readonly<{
  /** Auth request OIDC già aperta (solo per flussi arrivati da Login V2). */
  authRequest?: string;
  /** Destinazione interna post-login. */
  redirectTo: string;
  loginHint?: string;
  forgotPasswordUrl: string;
  signUpUrl: string;
}>;

/**
 * Form custom email+password: la verifica avviene in una server action
 * che parla con la Session API di ZITADEL; la password non lascia mai il
 * canale browser → backend Next.
 */
export function PasswordLoginForm({
  authRequest,
  redirectTo,
  loginHint,
  forgotPasswordUrl,
  signUpUrl,
}: PasswordLoginFormProps) {
  const [state, formAction, pending] = useActionState<PasswordLoginState, FormData>(
    submitPasswordLogin,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="authRequest" value={authRequest ?? ""} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {state?.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-in-email">Email</Label>
          <Input
            id="sign-in-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@azienda.it"
            defaultValue={loginHint}
            autoFocus={!loginHint}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-in-password">Password</Label>
          <Input
            id="sign-in-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Inserisci la password"
            autoFocus={Boolean(loginHint)}
          />
        </div>
      </div>
      <AuthLinkRow>
        <p>
          Non hai un account? <AuthTextLink href={signUpUrl}>Registrati</AuthTextLink>
        </p>
        <p>
          Password dimenticata?{" "}
          <AuthTextLink href={forgotPasswordUrl}>Clicca qui</AuthTextLink>.
        </p>
      </AuthLinkRow>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner className="size-[18px]" /> : null}
        Accedi
        <ArrowRight aria-hidden className="size-[18px]" />
      </Button>
    </form>
  );
}
