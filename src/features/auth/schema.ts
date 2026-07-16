import { z } from "zod";

/** Validazione zod dei flussi di autenticazione custom (login UI ZITADEL). */

export const AUTH_REQUEST_ID_PATTERN = /^V2_[0-9A-Za-z_-]+$/;

const authRequestId = z
  .string()
  .regex(AUTH_REQUEST_ID_PATTERN, "Richiesta di accesso non valida.");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email non valida.")
  .max(320, "Email troppo lunga.");

/** Al login la password non viene validata localmente (policy su ZITADEL). */
const loginPassword = z
  .string()
  .min(1, "Inserisci la password.")
  .max(256, "Password troppo lunga.");

/** Alla creazione vale un minimo prudenziale; la policy vera è su ZITADEL. */
const newPassword = z
  .string()
  .min(8, "La password deve avere almeno 8 caratteri.")
  .max(256, "Password troppo lunga.");

const verificationCode = z
  .string()
  .trim()
  .min(1, "Inserisci il codice.")
  .max(64, "Codice non valido.");

/** Path interno di destinazione post-login (fallback /app se non sicuro). */
const internalRedirect = z
  .string()
  .max(2048)
  .optional()
  .transform((value) =>
    value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
      ? value
      : "/app"
  );

export const credentialsSchema = z.object({
  /** Presente solo se il flusso è partito da una auth request esterna. */
  authRequest: authRequestId.optional().or(z.literal("").transform(() => undefined)),
  email,
  password: loginPassword,
  redirectTo: internalRedirect,
});
export type CredentialsInput = z.infer<typeof credentialsSchema>;

export const mfaMethods = ["totp", "otpEmail", "otpSms"] as const;
export type MfaCodeMethod = (typeof mfaMethods)[number];

export const mfaCodeSchema = z.object({
  method: z.enum(mfaMethods),
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6,8}$/, "Il codice deve contenere 6-8 cifre."),
});
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;

export const registerSchema = z
  .object({
    authRequest: authRequestId.optional().or(z.literal("").transform(() => undefined)),
    givenName: z.string().trim().min(1, "Inserisci il nome.").max(100),
    familyName: z.string().trim().min(1, "Inserisci il cognome.").max(100),
    email,
    password: newPassword,
    passwordConfirm: z.string().min(1, "Conferma la password."),
    termsAccepted: z.literal(true, {
      error: "Accetta i termini e la privacy policy per registrarti.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Le password non coincidono.",
    path: ["passwordConfirm"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    userId: z.string().trim().min(1).max(64),
    code: verificationCode,
    password: newPassword,
    passwordConfirm: z.string().min(1, "Conferma la password."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Le password non coincidono.",
    path: ["passwordConfirm"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  userId: z.string().trim().min(1).max(64),
  code: verificationCode,
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
