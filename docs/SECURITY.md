# Sicurezza — login UI custom

## Threat model (sintesi)

| Minaccia | Mitigazione |
| --- | --- |
| Furto credenziali in transito | HTTPS; password solo browser → server action → ZITADEL (mai browser → IdP); HSTS |
| Open redirect (phishing post-login) | `safeCallbackUrl`/`isSafeInternalPath` (solo path interni); `callbackUrl` di ZITADEL validata contro l'origin dell'app prima del redirect |
| CSRF sulle action di login | Server actions Next (POST same-origin con verifica Origin del framework), cookie `SameSite=Lax`, nessuna mutazione via GET |
| Replay/manomissione dello stato di login | Cookie di flusso HttpOnly cifrato AES-256-GCM (auth tag) con TTL 15 min; il `sessionToken` non è mai leggibile dal client |
| Enumerazione utenti | Messaggio unico per utente inesistente/password errata; conflitti di registrazione collassati in un errore generico; risposta e durata minima uniformi su forgot-password; lookup email solo server-side |
| Brute force credenziali/OTP | Rate limiting per IP+identificatore sulle action sensibili; lockout policy e rate limit di ZITADEL come seconda linea |
| Furto token OIDC | Code flow + PKCE + state + nonce (Auth.js); token mai nel browser storage; sessione applicativa in cookie HttpOnly |
| Compromissione del PAT | PAT solo in env server; ruolo minimo `IAM_LOGIN_CLIENT`; rotazione pianificata |
| Clickjacking | CSP `frame-ancestors 'none'` |
| XSS → esfiltrazione sessione | CSP, cookie HttpOnly, escaping React; nessun `dangerouslySetInnerHTML` nei flussi auth |
| Auth request forgiata | Id validato (`^V2_[0-9A-Za-z_-]+$`), letto e finalizzato solo server-side col PAT; `CreateCallback` è one-shot |
| Login CSRF / request mix-up | La auth request esterna deve coincidere con quella salvata nel cookie; il flusso interno accetta solo redirect URI sull'origin dell'app |
| Account linking OIDC | Sincronizzazione locale solo con claim `email_verified=true`; un account già collegato non può essere riassegnato a un altro `sub` |
| Accesso cross-tenant | FK ricevute dal client validate contro il workspace; allegati autorizzati in base a entità, modulo e azione |
| Furto invito | Il token resta ad alta entropia e l'accettazione è vincolata all'email autenticata destinataria |

## Cookie

| Cookie | Contenuto | Attributi |
| --- | --- | --- |
| `authjs.session-token` (`__Secure-` in prod) | JWT sessione Auth.js | HttpOnly, Secure, SameSite=Lax (gestito da Auth.js) |
| Cookie PKCE/state/nonce Auth.js | Parametri del flusso OIDC | HttpOnly, vita breve (gestiti da Auth.js) |
| `gausio.login-flow` | Stato login cifrato: requestId, sessionId, sessionToken ZITADEL, userId | HttpOnly, Secure (prod), SameSite=Lax, Max-Age 900s, AES-256-GCM con chiave HKDF(`AUTH_SECRET`) |

Mai usati: localStorage, sessionStorage, IndexedDB per materiale sensibile.

## Token

- **PAT service user**: solo env server, mai in bundle client, mai loggato.
- **sessionToken ZITADEL**: vive solo nel cookie cifrato durante il login
  (≤15 min) e viene consumato dalla finalizzazione.
- **id_token / access_token**: gestiti da Auth.js nel JWT di sessione
  server-side; l'`id_token` è conservato esclusivamente per `end_session`
  e non è esposto nella sessione client.

## Logging

`src/server/zitadel/errors.ts` è l'unico punto di log degli errori IdP:
registra contesto, HTTP status, codice gRPC e message key ZITADEL. **Mai**
loggati: password, OTP, codici di verifica, sessionToken, PAT, id/access
token, body delle richieste. I messaggi mostrati all'utente sono testi
statici applicativi, mai il messaggio grezzo dell'IdP.

## MFA

Policy e verifica restano su ZITADEL (`forceMfa`, fattori ammessi, codici).
L'app orchestra soltanto: sceglie il passo successivo dai `factors` della
sessione e dai metodi configurati. WebAuthn usa il dominio dell'app come RP
ID; le passkey sono legate al dominio (cambiare dominio le invalida).

## Rate limiting

In-app: sliding window in-memory per IP+identificatore —
credenziali/codici 10/5min, invii email 5/15min, registrazioni 5/h
(`src/server/zitadel/security.ts`). Limite della soluzione: per-istanza
Node; in produzione multi-replica va affiancato da rate limiting a livello
di edge/reverse proxy o da uno store condiviso (Redis). Difese lato IdP
comunque attive: lockout policy e rate limit ZITADEL (HTTP 429).

## Header di risposta (next.config.ts)

- `Content-Security-Policy`: `default-src 'self'`; `connect-src 'self'`
  (il browser non contatta mai ZITADEL); `frame-ancestors 'none'`;
  `form-action 'self'`; `object-src 'none'`; `base-uri 'self'`.
  `script-src`/`style-src` includono `'unsafe-inline'` per gli script
  inline di Next; soltanto in sviluppo `script-src` include anche
  `'unsafe-eval'`, richiesto dalle diagnostiche React. In produzione
  `unsafe-eval` è assente e viene aggiunto `upgrade-insecure-requests`.
  Hardening ulteriore possibile con nonce per-request
  (middleware/proxy che genera il nonce e header dinamico).
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy`: camera/microfono/geolocalizzazione/pagamenti
  disabilitati (WebAuthn non richiede permessi aggiuntivi).
- `Strict-Transport-Security` (attivo su HTTPS).

## Checklist produzione

- [ ] `AUTH_URL` in HTTPS; certificato valido
- [ ] `AUTH_SECRET` forte e ruotabile; procedura di rotazione nota
- [ ] PAT `IAM_LOGIN_CLIENT` con scadenza e rotazione pianificata
- [ ] Trusted domain e post-logout URI registrati su ZITADEL
- [ ] SMTP di produzione configurato (niente provider built-in)
- [ ] Lockout policy e Force MFA riviste con il cliente
- [ ] Rate limiting a livello edge per deployment multi-replica
- [ ] Limite body al reverse proxy coerente con i 21 MB delle Server Actions
- [ ] Scansione antimalware degli allegati e storage oggetti privato in produzione
- [ ] Valutare RLS/composite FK Postgres come seconda barriera multi-tenant
- [ ] Monitoraggio dei log `[zitadel]` (errori API) e dei 429
- [ ] Test end-to-end del logout OIDC e del reset password su dominio reale
