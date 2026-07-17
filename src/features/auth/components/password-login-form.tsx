"use client";

import { useActionState, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Spinner,
} from "@/components/shared";
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

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Inserisci l'email.")
    .email("Inserisci un'email valida."),
  password: z.string().min(1, "Inserisci la password."),
});

type LoginFormInput = z.infer<typeof loginFormSchema>;

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
  const [submitting, startSubmit] = useTransition();
  const [state, formAction, pending] = useActionState<PasswordLoginState, FormData>(
    submitPasswordLogin,
    null
  );
  const [serverErrorDismissed, setServerErrorDismissed] = useState(false);

  const form = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: loginHint ?? "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.set("authRequest", authRequest ?? "");
    formData.set("redirectTo", redirectTo);
    formData.set("email", values.email);
    formData.set("password", values.password);

    setServerErrorDismissed(false);
    startSubmit(() => {
      formAction(formData);
    });
  });

  const visibleError = !serverErrorDismissed ? state?.error : null;
  const busy = pending || submitting;

  return (
    <form
      onSubmit={onSubmit}
      onChange={() => {
        if (state?.error && !serverErrorDismissed) setServerErrorDismissed(true);
      }}
      noValidate
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="authRequest" value={authRequest ?? ""} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {visibleError && (
        <Alert
          variant="destructive"
          role="alert"
          onClose={() => {
            setServerErrorDismissed(true);
          }}
        >
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
              <Input
                {...field}
                id="sign-in-email"
                type="email"
                autoComplete="email"
                placeholder="tu@azienda.it"
                aria-invalid={fieldState.invalid}
                autoFocus={!loginHint}
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
              <Input
                {...field}
                id="sign-in-password"
                type="password"
                autoComplete="current-password"
                placeholder="Inserisci la password"
                aria-invalid={fieldState.invalid}
                autoFocus={Boolean(loginHint)}
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />
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
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Spinner className="size-[18px]" /> : null}
        Accedi
        <ArrowRight aria-hidden className="size-[18px]" />
      </Button>
    </form>
  );
}
