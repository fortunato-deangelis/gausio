# Configurazione ZITADEL per la login UI custom

Passi manuali da eseguire sull'istanza ZITADEL (Console) perché la login
custom di Gausio funzioni. Requisito: **ZITADEL v4+** (Login V2 GA; su
v2.6x/v3 va abilitata la feature flag Login V2).

Negli esempi: `https://idp.example.com` è l'istanza ZITADEL,
`https://app.example.com` è Gausio (`AUTH_URL`).

## 1. Organizzazione e progetto

1. Crea (o riusa) un'organizzazione per gli utenti dell'app.
2. Crea un progetto (es. «Gausio»).

## 2. Applicazione OIDC (client di Auth.js)

Nel progetto crea un'applicazione **Web**:

- **Grant type**: Authorization Code + **PKCE**. Authentication Method a
  scelta: **None** (public client, nessun Client Secret — la Console mostra
  «no secret is required»; lasciare `AUTH_ZITADEL_SECRET` vuoto) oppure
  **Basic**/**Post** (confidential client, con secret in
  `AUTH_ZITADEL_SECRET`). Entrambe supportate dall'app; PKCE è attivo in
  ogni caso.
- **Redirect URI**: `https://app.example.com/api/auth/callback/zitadel`
  (in sviluppo `http://localhost:3000/api/auth/callback/zitadel`, con
  «Dev Mode» attivo per consentire http).
- **Post-logout redirect URI**: `https://app.example.com/`.
- Scope usati: `openid profile email` (default provider Auth.js).

Annota il **Client ID** → `AUTH_ZITADEL_ID` (e il **Client Secret** →
`AUTH_ZITADEL_SECRET`, solo con auth method Basic/Post); l'issuer
dell'istanza → `AUTH_ZITADEL_ISSUER`.

## 3. Service user «login client» + PAT

La login UI custom chiama le API v2 con un utente macchina dedicato:

1. Crea un **service user** (es. `gausio-login-client`) con
   Access Token Type **Bearer**.
2. Assegnagli il ruolo di membership **istanza**: `IAM_LOGIN_CLIENT`
   (Console → Default settings → Members → «Instance Login Client»).
   Il ruolo copre: lettura/creazione/aggiornamento sessioni, lettura e
   finalizzazione delle auth request OIDC (`session.write`, `session.link`),
   gestione utenti per registrazione e reset.
3. Genera un **Personal Access Token (PAT)** → `ZITADEL_SERVICE_USER_TOKEN`.
   Conserva una scadenza gestibile (es. 6-12 mesi) e pianifica la rotazione.

> Consiglio operativo (dalla doc ufficiale): prima di attivare Login V2 a
> livello istanza, crea anche un PAT di riserva per un utente `IAM_OWNER`,
> per poter amministrare l'istanza se la login dovesse rompersi.

## 4. Feature Login V2 (redirect verso l'app)

Console → **Default settings → Features → Login V2**:

- **Enabled**: on.
- **Base URI**: `https://app.example.com/api`
  → ZITADEL redirige le authorize request a
  `https://app.example.com/api/login?authRequest=V2_…`, gestita da
  `src/app/api/login/route.ts`.

Con il flag attivo a livello istanza, la login custom vale per **tutte** le
applicazioni dell'istanza. In alternativa si può attivare per singola app
OIDC (checkbox «Login V2» nell'app, efficace solo se il flag istanza è
spento); la base URI per-app ha limitazioni note (issue zitadel#10722).

Self-hosted: equivalente via env
`ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED` e
`ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_BASEURI`.

## 5. Trusted domain

Il dominio dell'app deve essere registrato come **trusted domain**
dell'istanza (richiesto quando le API sono usate da un dominio diverso dal
custom domain ZITADEL):

```
POST {issuer}/zitadel.instance.v2.InstanceService/AddTrustedDomain
Authorization: Bearer <PAT IAM_OWNER>
{ "trustedDomain": "app.example.com" }
```

(oppure Admin API v1 `AddInstanceTrustedDomain`; dominio senza schema).

## 6. Policy (gestite in ZITADEL, lette dall'app)

- **Login policy** (Default settings → Login Behaviour and Security):
  username/password, registrazione consentita (`allowRegister`), **Force
  MFA** se richiesta; secondi fattori ammessi (TOTP, U2F, OTP Email, OTP
  SMS). L'app li legge da `GET /v2/settings/login` e mostra solo i metodi
  configurati dall'utente.
- **Password complexity** (Default settings → Password Complexity): letta da
  `GET /v2/settings/password/complexity` e applicata nei form di
  registrazione/reset prima della chiamata (ZITADEL resta l'enforcement
  finale).
- **Lockout policy**: massimo tentativi password/OTP; superata la soglia
  l'account risulta bloccato e l'app mostra il messaggio dedicato (lo
  sblocco avviene da Console).

## 7. SMTP e template email

- Configura un **provider SMTP di produzione** (Default settings →
  Notification providers): quello built-in è solo per test.
- Le email di verifica e reset usano i template di ZITADEL (Message Texts)
  ma con **link verso l'app** grazie agli `urlTemplate` inviati dall'app:
  - verifica email → `https://app.example.com/verify-email?userId={{.UserID}}&code={{.Code}}`
  - reset password → `https://app.example.com/reset-password?userId={{.UserID}}&code={{.Code}}`
- La pagina `/verify-email` accetta anche l'**inserimento manuale del
  codice** (flusso post-registrazione): perché il codice sia visibile nel
  corpo dell'email oltre che nel link, personalizza il Message Text
  «Verify email» aggiungendo il placeholder `{{.Code}}` al testo
  (Default settings → Message Texts → Verify email).
- Per gli OTP via SMS serve un provider SMS (es. Twilio) configurato.

## 8. Riepilogo valori → variabili d'ambiente

| Cosa | Dove in Console | Variabile |
| --- | --- | --- |
| Issuer istanza | URL istanza | `AUTH_ZITADEL_ISSUER` |
| Client ID app OIDC | Progetto → App | `AUTH_ZITADEL_ID` |
| Client Secret app OIDC | Progetto → App | `AUTH_ZITADEL_SECRET` |
| PAT service user | Service user → Personal Access Tokens | `ZITADEL_SERVICE_USER_TOKEN` |

## 9. Checklist finale

- [ ] App OIDC con redirect + post-logout URI corretti
- [ ] Service user con ruolo `IAM_LOGIN_CLIENT` e PAT valido
- [ ] Login V2 attivo con Base URI `= {AUTH_URL}/api`
- [ ] Trusted domain aggiunto
- [ ] SMTP di produzione configurato
- [ ] Login policy e password policy riviste
- [ ] PAT di riserva `IAM_OWNER` custodito
