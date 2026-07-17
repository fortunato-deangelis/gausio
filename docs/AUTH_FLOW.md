# Flussi di autenticazione — Custom Login UI ZITADEL

Tutti i flussi mantengono l'utente sul dominio della Main App: il dominio
ZITADEL compare solo in redirect 302 intermedi. Le chiamate alle API v2
partono sempre dal backend con il PAT del login client.

## Login con password (form-first)

Il form compare **subito** su `/sign-in`, senza alcun redirect preliminare.
Credenziali ed eventuale MFA vengono verificate via API; solo a
autenticazione completata parte l'handshake OIDC, che è una catena di
redirect invisibili finalizzata automaticamente.

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant App as Main App (Next.js)
  participant Z as ZITADEL

  B->>App: GET /sign-in → form custom (immediato)
  B->>App: POST server action (email, password, redirectTo)
  App->>Z: POST /v2/sessions {checks.user.loginName, lifetime}
  Z-->>App: sessionId + sessionToken
  App->>Z: PATCH /v2/sessions/{id} {checks.password}
  Z-->>App: nuovo sessionToken
  App->>Z: GET /v2/sessions/{id} + authentication_methods + settings/login
  Z-->>App: factors, metodi, policy (forceMfa)
  Note over App: set cookie di flusso HttpOnly cifrato<br/>(completed=true se nessuna MFA)

  alt MFA necessaria
    App->>B: 302 /mfa (vedi flusso MFA, poi riprende qui sotto)
  end

  Note over B,Z: — handshake OIDC automatico (solo 302, nessuna UI) —
  App->>B: 302 /api/login/start?callbackUrl=redirectTo
  B->>App: GET /api/login/start
  Note over App: Auth.js signIn("zitadel")<br/>set cookie PKCE + state + nonce
  App->>B: 302 {issuer}/oauth/v2/authorize?...
  B->>Z: GET /oauth/v2/authorize
  Note over Z: Login V2 attivo, baseUri = app
  Z->>B: 302 {app}/api/login?authRequest=V2_x
  B->>App: GET /api/login?authRequest=V2_x
  Note over App: cookie di flusso completed → finalizza subito
  App->>Z: POST /v2/oidc/auth_requests/V2_x {session}
  Z-->>App: callbackUrl (redirect_uri + code + state)
  Note over App: valida callbackUrl, cancella cookie di flusso
  App->>B: 302 callbackUrl
  B->>App: GET /api/auth/callback/zitadel?code&state
  App->>Z: POST /oauth/v2/token (code + PKCE verifier)
  Z-->>App: id_token + access_token
  Note over App: Auth.js verifica nonce, crea sessione JWT,<br/>sync utente su DB
  App->>B: 302 destinazione finale (/app o /onboarding)
```

Password errata o utente inesistente producono lo **stesso** messaggio
(«Credenziali non valide»); l'account bloccato dalla lockout policy ha un
messaggio dedicato.

## MFA (secondo fattore)

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant App as Main App
  participant Z as ZITADEL

  B->>App: GET /mfa
  Note over App: legge cookie di flusso;<br/>senza cookie → 302 /sign-in
  App->>Z: GET /v2/users/{userId}/authentication_methods
  Z-->>App: [TOTP, U2F, OTP_EMAIL, ...]
  App->>B: pagina con i metodi disponibili

  alt TOTP
    B->>App: POST action {method: totp, code}
    App->>Z: PATCH /v2/sessions/{id} {checks.totp.code}
  else OTP email / SMS
    B->>App: POST action "invia codice"
    App->>Z: PATCH /v2/sessions/{id} {challenges.otpEmail|otpSms}
    Z-->>B: email / SMS con il codice
    B->>App: POST action {method, code}
    App->>Z: PATCH /v2/sessions/{id} {checks.otpEmail|otpSms.code}
  else Passkey / U2F
    B->>App: POST action "challenge webauthn"
    App->>Z: PATCH /v2/sessions/{id} {challenges.webAuthN}
    Z-->>App: publicKeyCredentialRequestOptions
    App-->>B: options
    B->>B: navigator.credentials.get()
    B->>App: POST action {assertion}
    App->>Z: PATCH /v2/sessions/{id} {checks.webAuthN}
  end

  Z-->>App: nuovo sessionToken (fattore verificato)
  Note over App: cookie di flusso → completed=true
  App->>B: 302 /api/login/start → handshake OIDC automatico<br/>(come nel login: authorize → /api/login → finalizza → callback Auth.js)
```

## Registrazione (form-first)

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant App as Main App
  participant Z as ZITADEL

  B->>App: GET /sign-up → form custom (immediato)
  B->>App: POST action {nome, cognome, email, password, termini}
  Note over App: verifica policy password<br/>(GET /v2/settings/password/complexity)
  App->>Z: POST /v2/users/human {profile, email.sendCode(urlTemplate), password}
  Z-->>App: userId
  Z-->>B: email di verifica con link a /verify-email
  App->>Z: POST /v2/sessions {checks.user.userId} + PATCH {checks.password}
  Z-->>App: sessionId + sessionToken
  Note over App: cookie di flusso (completed=true, redirectTo=/onboarding)
  App->>B: 302 /verify-email?userId=…
  B->>App: incolla il codice ricevuto via email → POST action
  App->>Z: POST /v2/users/{userId}/email/verify {verificationCode}
  Z-->>App: ok
  Note over App: flusso di login attivo → prosegue da solo
  App->>B: 302 /api/login/start → handshake OIDC automatico<br/>→ /api/login finalizza → callback Auth.js → /onboarding
```

## Verifica email

Due ingressi equivalenti: subito dopo la registrazione (codice incollato a
mano) oppure dal link nell'email (urlTemplate →
`/verify-email?userId={{.UserID}}&code={{.Code}}`, codice precompilato):

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant App as Main App
  participant Z as ZITADEL

  B->>App: GET /verify-email?userId[&code]
  B->>App: POST action "Conferma email" {userId, code}
  App->>Z: POST /v2/users/{userId}/email/verify {verificationCode}
  Z-->>App: ok / errore codice
  alt flusso di login attivo (post-registrazione)
    App->>B: 302 handshake OIDC → onboarding
  else nessun flusso
    App-->>B: esito + link ad Accedi (re-invio via email/resend)
  end
```

## Password dimenticata / reset

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant App as Main App
  participant Z as ZITADEL

  B->>App: POST /forgot-password action {email}
  App->>Z: POST /v2/users (emailQuery EQUALS, limit 1)
  alt utente trovato
    App->>Z: POST /v2/users/{userId}/password_reset {sendLink, urlTemplate}
    Z-->>B: email con link a /reset-password?userId&code
  else utente non trovato
    Note over App: nessuna chiamata ulteriore
  end
  App-->>B: sempre lo stesso messaggio (no enumeration)

  B->>App: GET /reset-password?userId&code → form nuova password
  B->>App: POST action {userId, code, password}
  Note over App: verifica policy password
  App->>Z: POST /v2/users/{userId}/password {newPassword, verificationCode}
  Z-->>App: ok / codice non valido
  App-->>B: esito + link a /sign-in
```

## Logout

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant App as Main App
  participant Z as ZITADEL

  B->>App: POST signOutAction (topbar)
  Note over App: legge id_token dal JWT Auth.js,<br/>signOut() cancella il cookie di sessione
  App->>B: 302 {issuer}/oidc/v1/end_session?id_token_hint&post_logout_redirect_uri
  B->>Z: GET /oidc/v1/end_session
  Note over Z: termina la sessione ZITADEL<br/>(nessuna interazione: id_token_hint presente)
  Z->>B: 302 {app} (post_logout_redirect_uri registrata)
```

Se l'`id_token` non è disponibile il logout resta locale con redirect
diretto alla landing.

## Casi particolari

- **Auth request esterna**: se una authorize request raggiunge `/api/login`
  senza un flusso completo (es. avviata da un altro client OIDC
  dell'istanza), l'utente è portato al form custom con `?authRequest=V2_…`
  (o a `/sign-up` per `prompt=create`); il form la finalizza dopo il login
  (`pendingRequestId` nel cookie di flusso).
- **`prompt=none`**: `/api/login` chiude subito la auth request con
  `ERROR_REASON_LOGIN_REQUIRED` e rimanda il browser alla `redirect_uri`
  del client (validata) — nessuna UI.
- **Auth request scaduta/riusata**: la finalizzazione fallisce → redirect a
  `/sign-in?error=flow` con messaggio e possibilità di ripartire.
- **Cookie di flusso scaduto (>15 min) o incompleto**: `/mfa` e le action
  rimandano a `/sign-in?error=flow`; `/api/login` non finalizza mai un
  flusso non `completed`.
- **Annulla su /mfa**: cancella il cookie di flusso e torna a `/sign-in`.
