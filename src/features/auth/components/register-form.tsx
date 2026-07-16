"use client";

import { useActionState } from "react";
import { UserRoundPlus } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  LegalConsent,
  Spinner,
} from "@/components/shared";
import { submitRegistration, type RegisterState } from "../actions";
import { AuthLinkRow, AuthTextLink } from "./auth-form-elements";

type RegisterFormProps = Readonly<{
  /** Auth request OIDC già aperta (solo per flussi arrivati da Login V2). */
  authRequest?: string;
  loginHint?: string;
  signInUrl: string;
  forgotPasswordUrl: string;
  passwordPolicyHint?: string;
}>;

/**
 * Registrazione custom: l'utente viene creato su ZITADEL (User API v2) e
 * autenticato nella stessa auth request OIDC, senza lasciare l'app.
 */
export function RegisterForm({
  authRequest,
  loginHint,
  signInUrl,
  forgotPasswordUrl,
  passwordPolicyHint,
}: RegisterFormProps) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    submitRegistration,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="authRequest" value={authRequest ?? ""} />
      {state?.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sign-up-given-name">Nome</Label>
            <Input
              id="sign-up-given-name"
              name="givenName"
              type="text"
              required
              autoComplete="given-name"
              placeholder="Mario"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sign-up-family-name">Cognome</Label>
            <Input
              id="sign-up-family-name"
              name="familyName"
              type="text"
              required
              autoComplete="family-name"
              placeholder="Rossi"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-up-email">Email</Label>
          <Input
            id="sign-up-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@azienda.it"
            defaultValue={loginHint}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-up-password">Password</Label>
          <Input
            id="sign-up-password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Crea una password"
          />
          {passwordPolicyHint && (
            <p className="text-sm text-muted-foreground">{passwordPolicyHint}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-up-password-confirm">Conferma password</Label>
          <Input
            id="sign-up-password-confirm"
            name="passwordConfirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Ripeti la password"
          />
        </div>
      </div>
      <AuthLinkRow>
        <p>
          Hai già un account? <AuthTextLink href={signInUrl}>Accedi</AuthTextLink>
        </p>
        <p>
          Password dimenticata?{" "}
          <AuthTextLink href={forgotPasswordUrl}>Clicca qui</AuthTextLink>.
        </p>
      </AuthLinkRow>
      <LegalConsent id="registration-terms" labelClassName="text-sm" required />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner className="size-[18px]" /> : (
          <UserRoundPlus aria-hidden className="size-[18px]" />
        )}
        Registrati
      </Button>
    </form>
  );
}
