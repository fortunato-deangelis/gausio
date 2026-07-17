# Piano di implementazione — Custom Login UI ZITADEL nella Main App

> Stato: implementazione in corso. Questo documento è la base decisionale;
> in caso di divergenza tra questo piano e la documentazione ufficiale
> ZITADEL, prevale la documentazione ufficiale (vedi §9).

## 1. Obiettivo

Sostituire la Login UI hosted di ZITADEL con pagine completamente custom
dentro Gausio (stessa app Next.js), mantenendo:

- **Auth.js v5** come relying party OIDC (Authorization Code Flow + PKCE,
  state, nonce) per la sessione applicativa — nessun Credentials Provider;
- **ZITADEL** come Identity Provider: password, MFA, utenti e policy
  restano gestiti da ZITADEL tramite **Session API v2**, **OIDC Service v2**
  e **User Service v2**;
- l'utente sempre sul dominio della Main App (solo redirect 302 attraversano
  il dominio ZITADEL, mai pagine visibili).

## 2. Esito dell'audit del repository

| Aspetto | Stato |
| --- | --- |
| Next.js | 16.2.10, App Router, monolite (frontend + backend) |
| Middleware | `src/proxy.ts` (convenzione Next 16, sostituisce `middleware.ts`) |
| Auth | `next-auth@5.0.0-beta.31` in `src/server/auth/index.ts`: provider `zitadel` (OIDC). Il provider `dev-login` a credenziali, presente all'avvio del lavoro, è stato rimosso su richiesta: unica login Zitadel, con app OIDC diverse per ambiente |
| Pagine auth | `/sign-in`, `/sign-up`, `/forgot-password`, `/onboarding`, `/invito/[token]` in `src/app/(auth)` + componenti in `src/features/auth/components` |
| Package manager | npm |
| Test | nessun framework presente → verrà aggiunto Vitest |
| UI | shell editoriale condivisa (`AuthPageShell`), primitivi solo via `@/components/shared` (regola ESLint); `InputOTP` esiste in `components/ui` ma non è ancora riesportato |
| Guardrail | `docs/guardrails/ui-and-marketing.md` oggi dichiara login/registrazione/reset «delegati a Zitadel» → va aggiornato nello stesso intervento |

## 3. Meccanismo ZITADEL (verificato sulla documentazione corrente)

1. Auth.js avvia il flusso standard su `{issuer}/oauth/v2/authorize`.
2. Con la feature **Login V2** attiva (istanza: Console → Features → Login V2,
   `baseUri` = URL della Main App; oppure per-app `loginVersion`), ZITADEL
   risponde con un 302 verso `{baseUri}/login?authRequest=V2_<id>`.
3. La Main App autentica l'utente con la **Session API v2**
   (`POST /v2/sessions`, `PATCH /v2/sessions/{id}` con `checks` e
   `challenges`), usando il PAT di un service user con ruolo
   **`IAM_LOGIN_CLIENT`**.
4. A fattori completi la Main App chiama
   `POST /v2/oidc/auth_requests/{id}` con `{ session: { sessionId,
   sessionToken } }` → riceve `callbackUrl` (la `redirect_uri` del client con
   `code` + `state`) e vi redirige il browser. La chiamata è **una sola volta
   per auth request**.
5. Auth.js riceve il `code` su `/api/auth/callback/zitadel`, esegue il token
   exchange (PKCE) e crea la sessione applicativa JWT. Nessuna gestione
   manuale di JWT OIDC.

Prerequisiti lato ZITADEL (dettagli in `docs/ZITADEL_CONFIGURATION.md`):
ZITADEL ≥ v4 (Login V2 GA; su v2.5x+ via feature flag), service user macchina
con PAT e ruolo `IAM_LOGIN_CLIENT`, dominio della Main App registrato come
**trusted domain**, SMTP di produzione configurato.

## 4. Architettura nel repository

Rispetto all'albero d'esempio della richiesta, i moduli server vanno in
`src/server/zitadel/` (in questo repo `src/lib` è riservato a utility pure e
`src/server` all'infrastruttura — stessa suddivisione richiesta, percorso
conforme alle convenzioni del progetto). Le rotte restano quelle già
pubblicate (`/sign-in`, `/sign-up`, `/forgot-password`), che il guardrail UI
rende canoniche; l'albero della richiesta è dichiaratamente un esempio.

```
src/
  server/zitadel/
    config.ts        # env, feature detection (custom login attivo?)
    client.ts        # fetch wrapper API v2: base URL, Bearer PAT, JSON, errori
    session.ts       # createSession, updateSession (checks/challenges), get, delete
    auth-request.ts  # getAuthRequest, createCallback (success/error)
    settings.ts      # login settings, password complexity
    users.ts         # register, verify email, password reset, search, auth methods
    cookies.ts       # cookie di flusso login HttpOnly cifrato (AES-256-GCM)
    errors.ts        # mappatura errori gRPC-gateway → messaggi uniformi (no enumeration)
    security.ts      # rate limiting in-memory, validazione redirect/callbackUrl
  features/auth/
    schema.ts        # zod: credenziali, codici OTP, registrazione, reset
    actions.ts       # server actions: password, MFA, register, reset, resend
    components/      # pagine custom: sign-in, mfa, sign-up, reset, verify-email
  app/(auth)/
    sign-in/  sign-up/  forgot-password/       # esistenti, rifatte custom
    reset-password/  verify-email/  mfa/        # nuove
  app/api/login/route.ts        # entry point: riceve ?authRequest= da ZITADEL
  app/api/login/start/route.ts  # avvia il flusso OIDC via Auth.js (set cookie PKCE)
  app/api/auth/[...nextauth]/   # esistente (callback + token exchange)
```

### Flusso login (percorso felice, form-first)

```
GET /sign-in → form custom immediato (nessun redirect preliminare)
form email+password → server action:
  POST /v2/sessions {checks.user.loginName, lifetime}
  PATCH /v2/sessions/{id} {checks.password}
  → cookie di flusso HttpOnly cifrato {sessionId, sessionToken, userId,
    redirectTo, completed}
  → MFA necessaria? (factors + authentication_methods + login settings forceMfa)
      sì → redirect /mfa (TOTP | OTP email | OTP SMS | passkey/U2F)
      no → handshake OIDC automatico (soli 302, nessuna UI ZITADEL):
        → 302 /api/login/start       (signIn("zitadel") → cookie PKCE/state/nonce)
        → 302 {issuer}/oauth/v2/authorize?...
        → 302 /api/login?authRequest=V2_x   (Login V2 baseUri → Main App)
        → flusso completed → POST /v2/oidc/auth_requests/V2_x {session}
        → 302 callbackUrl = /api/auth/callback/zitadel?code=...&state=...
        → Auth.js token exchange → sessione applicativa → redirect finale
```

Le auth request arrivate dall'esterno (altri client OIDC, prompt=create)
atterrano sul form con `?authRequest=V2_…` e vengono finalizzate dopo il
login (`pendingRequestId`).

La password viaggia solo browser → server action Next.js → ZITADEL; mai dal
browser alle API ZITADEL. Lo stato intermedio del login vive in un cookie
HttpOnly+Secure+SameSite=Lax cifrato (AES-256-GCM con chiave derivata via
HKDF da `AUTH_SECRET`), mai in localStorage.

### MFA

- Metodi letti da `GET /v2/users/{userId}/authentication_methods` incrociati
  con i `secondFactors` dei login settings (`GET /v2/settings/login`,
  `forceMfa`/`forceMfaLocalOnly` inclusi).
- TOTP: `PATCH … {checks.totp.code}`.
- OTP Email/SMS: `PATCH … {challenges.otpEmail|otpSms}` per l'invio, poi
  `PATCH … {checks.otpEmail|otpSms.code}`.
- Passkey/U2F: `PATCH … {challenges.webAuthN {domain,
  userVerificationRequirement}}` → `navigator.credentials.get()` lato client
  → `PATCH … {checks.webAuthN.credentialAssertionData}`.
- Nessuna logica MFA locale: policy e verifica restano su ZITADEL.

### Registrazione

`/sign-up` custom → server action: `POST /v2/users/human` (profile, email
con `sendCode.urlTemplate` → `/verify-email?userId={{.UserID}}&code={{.Code}}`,
password) → login automatico via Session API sulla stessa auth request →
onboarding. `/verify-email` chiama `POST /v2/users/{userId}/email/verify` e
offre il re-invio (`POST /v2/users/{userId}/email/resend`).

### Password dimenticata

`/forgot-password` → server action: lookup server-side dell'utente
(`POST /v2/users` con `emailQuery`) e `POST /v2/users/{userId}/password_reset`
con `sendLink.urlTemplate` → `/reset-password?userId={{.UserID}}&code={{.Code}}`.
Risposta sempre identica («se l'indirizzo esiste…», no enumeration).
`/reset-password` → validazione complessità da
`GET /v2/settings/password/complexity` + `POST /v2/users/{userId}/password`
con `verificationCode`.

### Logout

Server action: legge `idToken` (salvato nel JWT Auth.js al login) e lo
`sid`/sessionId ZITADEL, esegue `signOut` Auth.js (pulizia cookie), poi 302 a
`{issuer}/oidc/v1/end_session?id_token_hint=…&client_id=…&post_logout_redirect_uri=…`
(URI registrata sull'app OIDC; default `AUTH_URL`, override
`AUTH_POST_LOGOUT_REDIRECT_URI`). Il fallback senza `idToken` resta il logout
locale con redirect alla landing.

## 5. Sicurezza

- PKCE, `state`, `nonce`: gestiti da Auth.js (invariati); test di regressione
  sulla configurazione.
- CSRF: server actions Next (POST same-origin, verifica origin del framework)
  + cookie SameSite=Lax; le action di auth non usano GET.
- Redirect: `safeCallbackUrl` esistente (solo path relativi); la
  `callbackUrl` di ZITADEL viene validata contro la `redirect_uri` della auth
  request e l'origin dell'app prima del redirect (no open redirect).
- No user enumeration: messaggio unico «credenziali non valide» (collasso di
  `Errors.User.NotFound` e `Errors.User.Password.Invalid`), reset password a
  risposta costante; stato distinto solo per account bloccato
  (`Errors.User.Locked`, richiede amministratore).
- Rate limiting: limiter in-memory per IP+identificatore sulle action
  sensibili (login, OTP, register, reset), con nota di produzione per store
  condiviso; ZITADEL applica comunque lockout policy e rate limit propri.
- Header: CSP, `Referrer-Policy`, `Permissions-Policy`,
  `X-Content-Type-Options`, `frame-ancestors` via `headers()` in
  `next.config.ts`.
- Logging: mai password/OTP/token; `errors.ts` sanifica i messaggi ZITADEL
  prima del log.

## 6. Variabili d'ambiente (nuove)

| Variabile | Uso | Obbligatoria |
| --- | --- | --- |
| `ZITADEL_SERVICE_USER_TOKEN` | PAT del service user `IAM_LOGIN_CLIENT` | sì per la login custom |

Le pagine custom sono l'unica login: senza PAT (o senza `AUTH_ZITADEL_*`)
mostrano un avviso di configurazione, mai un redirect verso la UI hosted.
Non esiste un login di sviluppo: in locale si usa un'app OIDC Zitadel
dedicata.

## 7. Test (Vitest)

Unit test su: cifratura/decifratura cookie di flusso, `safeCallbackUrl` e
validazione `callbackUrl` (open redirect), mappatura errori (no
enumeration), rate limiter, schema zod (credenziali/OTP/password), forma
delle richieste Session/User/OIDC API (fetch mockato: path, header, body),
logica di selezione MFA, configurazione Auth.js (PKCE/state/nonce attivi,
nessun Credentials provider per il flusso reale), header di sicurezza.
Script npm: `test`, `typecheck`.

## 8. Fasi di lavoro

1. `src/server/zitadel/*` (config, client, errors, cookies, security) + test.
2. Session/auth-request/settings/users + test.
3. Rotte `/api/login`, `/api/login/start`; pagine e action custom login +
   MFA; integrazione Auth.js (idToken per logout).
4. Registrazione, verifica email, reset password.
5. Logout OIDC + header di sicurezza.
6. Documentazione (`ARCHITECTURE`, `AUTH_FLOW`, `ZITADEL_CONFIGURATION`,
   `ENVIRONMENT`, `SECURITY`, `LOCAL_DEVELOPMENT`) + aggiornamento guardrail
   UI e `AGENTS.md` (nuove rotte).
7. `npm install` (vitest), lint, typecheck, test, build; correzioni; report.

## 9. Divergenze note rispetto alla richiesta

- I moduli vivono in `src/server/zitadel/` e non in `lib/zitadel/`: in questo
  repo `src/lib` è riservato a utility pure (convenzione AGENTS.md).
- Le rotte restano `/sign-in`, `/sign-up`, `/forgot-password` (guardrail UI
  normativo) con l'aggiunta di `/reset-password`, `/verify-email`, `/mfa`;
  l'albero `login/register/…` della richiesta era un esempio.
- `POST /v2/users/human` e `POST /v2/users/{userId}/password` sono marcati
  deprecati nella reference più recente in favore di `POST /v2/users/new` e
  `PATCH /v2/users/{userId}`. Si usano comunque gli endpoint **classici**:
  sono quelli adottati dalle guide ufficiali «Build your own Login UI»
  tuttora pubblicate, funzionano su tutte le versioni correnti e non
  obbligano a conoscere l'`organizationId` (richiesto dal nuovo
  `CreateUser`). La scelta è annotata nel codice per una futura migrazione.
- Il repo ufficiale `zitadel/typescript` è archiviato (ott 2025): il
  riferimento è l'app `apps/login` nel monorepo `zitadel/zitadel`.
