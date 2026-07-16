# Sviluppo locale

L'unica modalità di login è ZITADEL, anche in locale: si usa
un'**applicazione OIDC dedicata allo sviluppo** (e, se serve isolamento
completo, un'organizzazione o un'istanza dev) con le stesse variabili
d'ambiente valorizzate per l'app dev.

## Setup

1. Prepara l'istanza ZITADEL seguendo `docs/ZITADEL_CONFIGURATION.md`
   (app OIDC di sviluppo, service user + PAT, Login V2 con base URI,
   trusted domain). Per lo sviluppo la base URI è
   `http://localhost:3000/api` e la redirect URI
   `http://localhost:3000/api/auth/callback/zitadel` (attiva «Dev Mode»
   sull'app OIDC per consentire http).
2. `.env`:

   ```dotenv
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gausio
   AUTH_SECRET=<npx auth secret>
   AUTH_URL=http://localhost:3000
   AUTH_ZITADEL_ISSUER=https://tuaistanza.zitadel.cloud
   AUTH_ZITADEL_ID=<client id app dev>
   # solo se l'app OIDC usa auth method Basic/Post; con "None" (PKCE) ometti
   AUTH_ZITADEL_SECRET=
   ZITADEL_SERVICE_USER_TOKEN=<PAT login client>
   ```

3. Avvio:

   ```bash
   npm install
   npx drizzle-kit migrate
   npm run dev
   ```

4. Visita `http://localhost:3000/sign-in`: il form custom compare subito;
   l'handshake OIDC (redirect invisibili) avviene solo dopo l'accesso.

Senza `ZITADEL_SERVICE_USER_TOKEN` i form restano visibili ma mostrano un
avviso di configurazione e l'accesso non può completarsi: il PAT è
obbligatorio per la login custom.

## HTTPS locale (necessario per le passkey)

WebAuthn richiede un secure context. `localhost` è considerato sicuro dai
browser, quindi TOTP/OTP/passkey funzionano già su `http://localhost:3000`.
Se serve un dominio realistico:

```bash
npm run dev -- --experimental-https
# oppure: mkcert + reverse proxy (Caddy/nginx) su https://gausio.localhost
```

Aggiorna di conseguenza `AUTH_URL`, la redirect URI e la base URI Login V2.
Ricorda che le passkey registrate su un dominio non valgono su un altro.

## Comandi

| Comando | Uso |
| --- | --- |
| `npm run dev` | sviluppo |
| `npm run build` / `npm start` | build e avvio produzione |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | unit test Vitest (`tests/`) |

## Debug del flusso di login

- I log server con prefisso `[zitadel]` riportano contesto, HTTP status e
  message key dell'IdP (mai dati sensibili).
- `?error=flow` su `/sign-in` indica auth request scaduta/riusata o cookie
  di flusso non valido: ripartire dall'accesso.
- Per ispezionare una auth request: gli id `V2_…` compaiono nell'URL di
  `/sign-in`; con il PAT puoi interrogare
  `GET {issuer}/v2/oidc/auth_requests/{id}`.
- Cookie: `gausio.login-flow` (flusso login, cifrato), `authjs.*`
  (sessione e parametri OIDC di Auth.js).

## Problemi comuni

| Sintomo | Causa probabile | Rimedio |
| --- | --- | --- |
| Arrivi alla login hosted di ZITADEL | Login V2 non attivo o base URI errata | Console → Features → Login V2, base URI `= {AUTH_URL}/api` |
| Loop di redirect su /sign-in | PAT mancante/scaduto (login custom disattiva) o `error=flow` persistente | Verifica `ZITADEL_SERVICE_USER_TOKEN`, guarda i log `[zitadel]` |
| 401/403 dalle API v2 | Ruolo `IAM_LOGIN_CLIENT` mancante sul service user | Assegna il ruolo a livello istanza |
| «Credenziali non valide» sempre | Utente in un'altra organizzazione o login policy restrittiva | Controlla org dell'utente e login settings |
| Email di verifica/reset non arrivano | SMTP non configurato sull'istanza | Configura il provider SMTP (o usa la Console per i test) |
| `redirect_uri` non valida al callback | Redirect URI non registrata o Dev Mode spento (http) | Aggiorna l'app OIDC in Console |
| Passkey non proposta/errore dominio | RP ID ≠ dominio corrente | Allinea `AUTH_URL` e dominio; registra di nuovo la passkey |
| Build con `/mfa` statica | Env assenti a build time | Già gestito: la pagina è `force-dynamic` |
