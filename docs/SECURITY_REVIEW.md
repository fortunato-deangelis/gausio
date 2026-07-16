# Security review — 16 luglio 2026

## Stato del documento

Questo documento è il registro operativo della security review di Gausio.
Contiene sia le correzioni già applicate sia i rischi ancora aperti, con ID
stabili da usare in issue, commit e pull request.

Legenda:

- **Corretto**: mitigazione implementata e verificata nel codice corrente.
- **Aperto**: intervento applicativo o infrastrutturale ancora necessario.
- **Decisione**: rischio il cui trattamento dipende dall'architettura scelta.
- **Condizionato**: sfruttabilità o impatto dipendono dalla configurazione del
  deployment, di ZITADEL o del reverse proxy.

## Perimetro e limiti

Revisione statica di `src/`, route handler, Server Actions, schema Drizzle,
autenticazione Auth.js/ZITADEL, autorizzazione e ruoli, isolamento workspace,
upload/download, export, header HTTP, validazione Zod e dipendenze npm.

Il confronto è stato eseguito rispetto a OWASP ASVS 5.0, OWASP Top 10 e alle
cheat sheet OWASP per Authentication, Authorization, Session Management,
Forgot Password, Logging e Denial of Service, oltre alla documentazione
ufficiale ZITADEL per Login UI custom, Session API, MFA e OIDC.

Questa review non sostituisce un penetration test sul deployment reale. Non
sono stati verificati direttamente reverse proxy, DNS, TLS, secret manager,
policy effettive ZITADEL, Postgres, storage, WAF, rete o configurazione cloud.

## Sintesi esecutiva

Le fondamenta dell'autenticazione sono valide: password e token sono gestiti
lato server, l'email OIDC deve essere verificata, lo stato intermedio è cifrato
e i controlli workspace vengono ricalcolati dal database. Restano però quattro
rischi ad alta priorità che impediscono di considerare il sistema pronto per un
rollout ERP sensibile:

1. il login custom non applica integralmente le policy ZITADEL;
2. le sessioni JWT applicative non sono revocabili dopo reset o blocco IdP;
3. il rate limiting auth non è affidabile in un deployment distribuito;
4. i permessi `settings` possono trasformarsi in escalation a ruolo admin.

### Registro findings autenticazione e autorizzazione

| ID | Severità | Stato | Finding |
| --- | --- | --- | --- |
| AUTH-01 | Alta | Aperto | Applicazione incompleta delle policy ZITADEL e possibile bypass MFA in registrazione |
| AUTH-02 | Alta | Aperto | Sessioni Auth.js JWT non revocabili e durata implicita di 30 giorni |
| AUTH-03 | Alta | Aperto, condizionato | Rate limiting in-memory, distribuito e IP non fidato |
| AUTH-04 | Alta | Aperto | Escalation verticale tramite permessi `settings` |
| AUTH-05 | Media | Aperto | Open redirect con backslash in `safeCallbackUrl` |
| AUTH-06 | Media | Aperto | Enumerazione utenti residua tramite comportamento e account bloccato |
| AUTH-07 | Media | Decisione | Login UI capace di finalizzare auth request di qualsiasi client ZITADEL registrato |
| AUTH-08 | Media | Aperto | Check OIDC dichiarati diversi da quelli realmente configurati |
| AUTH-09 | Media | Aperto, condizionato | Configurazione auth non fail-closed e segreti non validati |
| AUTH-10 | Media | Aperto | Enrollment/recovery MFA incompleti e WebAuthn configurato debolmente |
| AUTH-11 | Media | Aperto, condizionato | Server Actions auth esposte al limite globale di 21 MB |
| AUTH-12 | Media | Aperto | Audit log di sicurezza insufficiente |
| AUTH-13 | Media | Aperto | Sessioni ZITADEL da 5 ore non terminate nei flussi abbandonati o falliti |
| AUTH-14 | Media | Aperto, condizionato | Password policy non adeguata agli account senza MFA |
| AUTH-15 | Media | Aperto | Race condition nel vincolo dell'ultimo amministratore |
| DEP-01 | Media | Aperto | Vulnerabilità moderate nel grafo npm production |

## Correzioni applicate

### Priorità alta

- Eliminata l'enumerazione **esplicita** dell'email in registrazione: conflitti
  e altri errori di creazione restituiscono lo stesso messaggio generico.
- Uniformato il tempo minimo del recupero password per ridurre il canale
  laterale tra email presente e assente.
- Il reinvio della verifica email è vincolato al flusso cifrato corrente,
  impedendo invii arbitrari conoscendo un `userId`.
- Il collegamento OIDC richiede `email_verified=true` e non può sovrascrivere
  un account locale già associato a un altro `sub` ZITADEL.
- Le auth request OIDC sono legate al flusso che le ha originate, mitigando
  request mix-up e login CSRF.
- Gli inviti workspace possono essere accettati solo dall'email destinataria.
- Le FK globali di commesse, progetti, task e documenti ISO vengono validate
  rispetto al workspace prima del salvataggio.
- Elenco, upload, cancellazione e download degli allegati verificano entità,
  workspace, modulo e permesso (`view`/`edit`/`delete`).
- I movimenti di magazzino usano aggiornamenti condizionali atomici; richieste
  concorrenti non possono produrre scorte negative, storni doppi o generare
  due volte i movimenti dello stesso DDT.

### Hardening aggiuntivo

- CSP con `unsafe-eval` soltanto in sviluppo; produzione senza `unsafe-eval` e
  con `upgrade-insecure-requests`.
- Pagine con codici/token (`reset-password`, `verify-email`, inviti) marcate
  `no-referrer` e `private, no-store`.
- Errori DB/filesystem/libreria non vengono restituiti integralmente al client;
  i messaggi ZITADEL nei log sono ripuliti da newline e limitati.
- Download ed export neutralizzano header injection nei nomi file, supportano
  `filename*` UTF-8 e disabilitano la cache.
- Percorsi allegati controllati contro traversal; file orfani rimossi se
  l'inserimento DB fallisce.
- Valori numerici non finiti e documenti con oltre 200 righe vengono rifiutati.
- Timeout di 15 secondi sulle chiamate backend a ZITADEL.
- Il workspace attivo è salvato in cookie `HttpOnly`, `SameSite=Lax` e
  `Secure` in produzione.
- Impedita la rimozione/demozione **sequenziale** dell'ultimo amministratore;
  resta AUTH-15 per la concorrenza.

## Findings ad alta priorità

### AUTH-01 — Policy ZITADEL non applicate integralmente

**Evidenze**

- `src/server/zitadel/settings.ts` modella `allowUsernamePassword`,
  `allowRegister`, `forceMfaLocalOnly`, `hidePasswordReset`, `secondFactors` e
  `multiFactors`.
- `src/features/auth/actions.ts` legge le impostazioni dopo la verifica della
  password, ma la decisione in `src/server/zitadel/mfa.ts` considera soltanto
  `forceMfa`.
- La registrazione non verifica `allowRegister`, non valuta la policy MFA e
  crea direttamente un flusso con `completed: true`.
- Forgot/reset password non applicano `hidePasswordReset`.
- I metodi mostrati all'utente non vengono filtrati con `secondFactors` e
  `multiFactors`.

**Impatto**

Il login con password può restare utilizzabile quando disabilitato; una policy
`forceMfaLocalOnly` può non essere rispettata; soprattutto, un nuovo utente può
completare registrazione, verifica email e OIDC senza MFA anche se la policy la
impone. ZITADEL documenta che con la Session API è responsabilità del client
decidere se lo stato della sessione è sufficiente.

**Remediation**

- [ ] Introdurre un valutatore server-side unico delle policy ZITADEL.
- [ ] Applicarlo prima di login password, registrazione, recovery e OIDC.
- [ ] Trattare `forceMfaLocalOnly` nel flusso password locale.
- [ ] Impedire la registrazione quando `allowRegister=false`.
- [ ] Impedire password login quando `allowUsernamePassword=false`.
- [ ] Rispettare `hidePasswordReset` lato server, non solo nella UI.
- [ ] Filtrare i fattori con le policy ZITADEL effettive.
- [ ] Rileggere i fattori della sessione immediatamente prima di
  `completeLogin`, senza fidarsi del flag `completed` nel cookie.
- [ ] Implementare enrollment MFA obbligatorio per i nuovi utenti.

**Criteri di accettazione**

- Test automatici dimostrano che ciascuna policy `false`/`true` modifica il
  flusso come previsto.
- Con `forceMfa` o `forceMfaLocalOnly`, nessuna auth request viene finalizzata
  senza il fattore richiesto.
- La registrazione non può produrre una sessione Auth.js prima del completamento
  di email verification e MFA richiesta.

### AUTH-02 — Sessioni applicative non revocabili

**Evidenze**

- `src/server/auth/index.ts` configura solo `session: { strategy: "jwt" }`.
- La versione Auth.js installata usa un `maxAge` predefinito di 30 giorni.
- `submitResetPassword` cambia la password su ZITADEL ma non invalida i JWT
  Gausio già emessi.
- Le richieste autenticate non verificano a ogni accesso lo stato dell'utente
  su ZITADEL né una versione di sessione locale.

**Impatto**

Un cookie Auth.js rubato può continuare a funzionare dopo reset password,
blocco/disabilitazione dell'utente, revoca delle sessioni IdP o modifica della
MFA. Anche il logout da un altro dispositivo non revoca il JWT sottratto.

**Remediation**

- [ ] Scegliere sessioni database revocabili oppure introdurre una
  `sessionVersion` persistente verificata a ogni richiesta.
- [ ] Invalidare tutte le sessioni dopo reset password e compromissione account.
- [ ] Gestire blocco/disabilitazione ZITADEL tramite webhook/evento o verifica
  server-side affidabile.
- [ ] Definire timeout assoluto e idle timeout coerenti con un ERP.
- [ ] Richiedere autenticazione recente per gestione ruoli, membri e altre
  operazioni ad alto impatto.
- [ ] Offrire una pagina per vedere e revocare le sessioni attive.

**Criteri di accettazione**

- Un JWT acquisito prima del reset password viene rifiutato subito dopo il reset.
- La disabilitazione dell'utente impedisce l'accesso senza attendere 30 giorni.
- Sono presenti test per revoca singola, revoca globale, scadenza idle e
  scadenza assoluta.

### AUTH-03 — Rate limiting non affidabile in produzione distribuita

**Evidenze**

- `clientKey()` prende direttamente il primo valore di `X-Forwarded-For`.
- `src/server/zitadel/security.ts` conserva i bucket in una `Map` di processo.
- La chiave login è composta da IP ed email; più IP ottengono bucket distinti
  sullo stesso account.
- Restart, autoscaling e più repliche azzerano o frammentano i contatori.

**Impatto**

Possibile password spraying, brute force distribuito, abuso di invio email/SMS
e creazione massiva di account. Se il proxy non sovrascrive gli header inoltrati
dal client, è possibile anche falsificare la componente IP.

**Remediation**

- [ ] Usare Redis o altro store condiviso con incremento e scadenza atomici.
- [ ] Accettare l'IP esclusivamente da una catena di proxy fidata e documentata.
- [ ] Applicare limiti distinti per IP, account e coppia IP+account.
- [ ] Aggiungere progressive delay, rilevamento password spraying e alert.
- [ ] Introdurre CAPTCHA/adaptive challenge solo dopo segnali di abuso.
- [ ] Allineare i limiti con lockout e rate limit ZITADEL per evitare account DoS.

**Criteri di accettazione**

- Due repliche condividono lo stesso contatore.
- Cambiare IP non azzera il limite globale dell'account.
- Gli header IP inviati direttamente dal client non influenzano la chiave.
- Test di carico verificano risposta, scadenza e assenza di race condition.

### AUTH-04 — Escalation verticale tramite `settings`

**Evidenze**

- `inviteMember` richiede `settings.create` ma permette di scegliere un ruolo
  `admin`.
- `updateMemberRole` richiede `settings.edit` e permette di assegnare il ruolo
  `admin`, anche al chiamante stesso.
- `updateRolePermissions` richiede `settings.edit` e consente di modificare
  l'intera matrice dei permessi di un ruolo custom.

**Impatto**

Un ruolo custom con `settings.create` o `settings.edit` può diventare di fatto
super-amministratore, invitando un account controllato come admin oppure
promuovendo sé stesso.

**Remediation**

- [ ] Separare `manage_workspace`, `manage_members`, `assign_roles` e
  `manage_permissions`.
- [ ] Consentire l'assegnazione del ruolo admin esclusivamente a un admin.
- [ ] Impedire auto-promozione e modifica del proprio ruolo privilegiato.
- [ ] Impedire che un utente conceda permessi che non possiede.
- [ ] Richiedere re-auth/MFA recente per assegnazioni admin.
- [ ] Registrare tutte le modifiche in un audit log append-only.

**Criteri di accettazione**

- Un utente non-admin con ogni combinazione di permessi `settings` non può
  assegnare o ottenere il ruolo admin.
- Le verifiche sono server-side e coperte da test di escalation verticale.

## Findings di media priorità

### AUTH-05 — Open redirect con backslash

`src/features/auth/components/auth-url.ts` accetta un callback come
`/\evil.example` perché controlla `startsWith("/")` e rifiuta solo `//`.
Il parser URL normalizza il backslash e può interpretare la destinazione come
`https://evil.example/`.

- [ ] Riutilizzare `isSafeInternalPath()` in tutti i punti di redirect.
- [ ] Testare `/\evil.example`, `//evil.example`, URL assolute, backslash
  codificati e controlli Unicode/canonicalizzazione.

### AUTH-06 — Enumerazione utenti residua

Il testo "email già utilizzata" è stato eliminato e il conflitto restituisce un
errore generico. Rimangono due canali:

- registrazione riuscita: redirect a verifica email;
- account esistente/errore: risposta di errore nello stesso form;
- account bloccato: messaggio diverso da credenziali non valide.

- [ ] Valutare un esito uniforme "se possibile riceverai un'email" per la
  registrazione, con gestione sicura dell'account già esistente.
- [ ] Uniformare account inesistente, password errata, bloccato e disabilitato,
  lasciando il dettaglio solo nei log server.
- [ ] Spostare invio email in coda e aggiungere jitter per ridurre side-channel
  temporali statistici.

### AUTH-07 — Auth request OIDC multi-client

`src/app/api/login/route.ts` finalizza auth request valide provenienti da
qualsiasi client registrato nell'istanza ZITADEL, senza mostrare client, scope o
consenso. Questo può essere corretto per una Login UI instance-wide, ma è
eccessivo se Gausio deve autenticare soltanto la propria applicazione.

- [ ] **Decisione architetturale:** Login UI app-specific o instance-wide.
- [ ] Se app-specific, allowlist esatta su `authRequest.clientId ===
  AUTH_ZITADEL_ID`.
- [ ] Se instance-wide, implementare identità del relying party, scope,
  consenso, `prompt`, `max_age`, errori OIDC e test multi-client.

### AUTH-08 — Check OIDC e documentazione incoerenti

`docs/SECURITY.md`, `docs/AUTH_FLOW.md` e `tests/auth-oidc.test.ts` dichiarano
PKCE, state e nonce. Il provider Auth.js installato usa invece il default PKCE;
il test verifica soltanto `provider.type === "oidc"` e non i check effettivi.

- [ ] Configurare esplicitamente i check OIDC supportati e richiesti.
- [ ] Aggiungere un test sul provider normalizzato e un E2E del callback.
- [ ] Correggere la documentazione perché descriva il runtime reale.

### AUTH-09 — Configurazione non fail-closed

- `.env.example` contiene il placeholder `AUTH_SECRET=change-me`.
- `getAppOrigin()` usa `http://localhost:3000` come fallback.
- Issuer e origin non vengono obbligati a HTTPS in produzione.
- Non viene verificata robustezza o rotazione di `AUTH_SECRET` e PAT.

Azioni:

- [ ] Validare tutte le env all'avvio con schema e messaggi non sensibili.
- [ ] Rifiutare placeholder, secret corti, HTTP e origin non canoniche in prod.
- [ ] Conservare PAT e secret in secret manager o file montato read-only.
- [ ] Definire rotazione e procedura di emergenza senza downtime prolungato.
- [ ] Limitare l'egress del processo ai soli endpoint ZITADEL necessari.

### AUTH-10 — MFA, recovery e WebAuthn incompleti

- Non esistono enrollment, recovery, sostituzione o rimozione sicura del fattore.
- Con MFA obbligatoria e nessun metodo configurato l'utente resta bloccato.
- WebAuthn usa `USER_VERIFICATION_REQUIREMENT_DISCOURAGED`.
- La UI parla di passkey ma la mappatura considera U2F e ignora il metodo
  `AUTHENTICATION_METHOD_TYPE_PASSKEY`.
- TOTP viene proposto prima di WebAuthn; email e SMS sono fattori più deboli.

Azioni:

- [ ] Implementare enrollment obbligatorio e recovery ad alta garanzia.
- [ ] Richiedere re-auth/MFA per cambio o rimozione fattore.
- [ ] Preferire WebAuthn/passkey, poi TOTP; limitare email/SMS ai casi ammessi.
- [ ] Usare user verification `preferred` o `required` secondo il flusso.
- [ ] Notificare l'utente dopo modifica di password o fattori.

### AUTH-11 — Body da 21 MB sulle action anonime

Il limite `serverActions.bodySizeLimit: 21mb` è globale per supportare gli
allegati, quindi si applica anche a login, registrazione, OTP e reset prima che
Zod possa rifiutare i campi. È un rischio di resource exhaustion.

- [ ] Spostare gli upload su route dedicata/object storage.
- [ ] Ridurre il limite globale delle Server Actions.
- [ ] Applicare al proxy limiti molto inferiori sulle rotte auth pubbliche.

### AUTH-12 — Audit logging insufficiente

Sono loggati errori API ZITADEL, ma manca un audit strutturato per login,
fallimenti, MFA, reset, inviti, assegnazione ruoli, cambi permesso, revoche e
operazioni amministrative.

- [ ] Definire eventi, actor, target, workspace, esito, motivo, timestamp,
  request/correlation ID e IP normalizzato.
- [ ] Non loggare password, OTP, token, cookie o dati personali non necessari.
- [ ] Rendere il registro append-only, protetto e monitorato con alert.

### AUTH-13 — Lifetime e cleanup delle sessioni ZITADEL

La sessione Session API dura 5 ore, il cookie `gausio.login-flow` 15 minuti e
`abandonLoginFlow()` cancella solo il cookie. `deleteSession()` esiste ma non è
usata sui flussi abbandonati o falliti. La documentazione interna afferma che il
`sessionToken` vive al massimo 15 minuti, cosa non equivalente alla lifetime
reale della sessione ZITADEL.

- [ ] Decidere se la sessione serve per SSO o è soltanto transitoria.
- [ ] Ridurne la lifetime o terminarla esplicitamente quando sicuro.
- [ ] Eseguire cleanup best-effort negli errori e nell'abbandono del flusso.
- [ ] Allineare documentazione, comportamento e test.

### AUTH-14 — Password policy

Il minimo applicativo è 8 caratteri. Se MFA non è obbligatoria, OWASP consiglia
password più lunghe; manca inoltre un controllo contro password comuni o
compromesse. Il limite massimo di 256 caratteri è invece adeguato.

- [ ] Minimo di almeno 15 caratteri senza MFA; almeno 8 con MFA obbligatoria.
- [ ] Consentire password manager, spazi, Unicode e incolla.
- [ ] Evitare regole arbitrarie di composizione quando non richieste.
- [ ] Bloccare password comuni/compromesse senza inviarle a servizi terzi in
  chiaro.

### AUTH-15 — Race sull'ultimo amministratore

Il controllo del numero di admin e la successiva modifica/rimozione non sono
protetti da una transazione serializzabile o da lock. Due richieste concorrenti
possono entrambe osservare due admin e rimuoverli/demoverli entrambi.

- [ ] Rendere controllo e mutazione atomici con transazione e lock appropriato.
- [ ] Aggiungere un test di concorrenza Postgres.

### DEP-01 — Vulnerabilità npm moderate

Audit del 16 luglio 2026:

- 8 vulnerabilità moderate complessive;
- 4 nel grafo production: `next`/`postcss` e `exceljs`/`uuid`;
- nessuna vulnerabilità high o critical.

I fix automatici proposti da npm suggeriscono downgrade anomali e non devono
essere applicati senza verifica. Occorre monitorare release correttive e
valutare la raggiungibilità dei percorsi vulnerabili.

- [ ] Verificare advisory e impatto reale nel modo in cui Gausio usa i pacchetti.
- [ ] Aggiornare appena esiste una versione compatibile corretta.
- [ ] Eseguire `npm audit --omit=dev` in CI e definire una policy di eccezione
  con scadenza.

## Altri rischi residui applicativi e infrastrutturali

### SEC-01 — Allegati

Mancano scansione antimalware, quarantena e content validation. Il disco locale
non è adatto a serverless o più repliche: usare object storage privato, nomi
casuali, URL firmate brevi e scansione asincrona prima della disponibilità.

### SEC-02 — Seconda barriera multi-tenant nel database

L'isolamento è principalmente applicativo. RLS o FK composite comprendenti
`workspace_id` limiterebbero l'impatto di future query o action prive di filtro.

### SEC-03 — CSP

La produzione mantiene `unsafe-inline` per compatibilità Next.js. Valutare nonce
per-request o SRI, misurando l'impatto sulla renderizzazione e sulla cache.

### SEC-04 — Token inviti

Gli inviti usano token ad alta entropia e accettazione vincolata all'email, ma
il token è memorizzato in chiaro. Valutare hash, revoca e rotazione esplicite.

### SEC-05 — Registrazione parzialmente completata

Se ZITADEL crea l'utente ma sessione o invio email falliscono, il retry incontra
un account esistente. Rendere il flusso idempotente o implementare una saga di
recupero senza reintrodurre enumerazione utenti.

## Esito per OWASP Top 10 (2021)

| Area | Esito aggiornato |
| --- | --- |
| A01 Broken Access Control | Corrette le falle cross-tenant, allegati e inviti individuate. Restano AUTH-04, AUTH-15 e la seconda barriera DB. |
| A02 Cryptographic Failures | Stato login AES-256-GCM e cookie HttpOnly. Robustezza reale dipendente da `AUTH_SECRET`, PAT, rotazione e validazione env (AUTH-09). |
| A03 Injection | Query Drizzle parametrizzate; nessun `eval` applicativo, command execution o HTML non filtrato individuato. `unsafe-eval` è consentito solo nel CSP di sviluppo. |
| A04 Insecure Design | Principali residui: applicazione policy IdP, revoca sessioni, recovery MFA e modello amministrativo. |
| A05 Security Misconfiguration | Header presenti; restano `unsafe-inline`, configurazione non fail-closed e dipendenze dalla corretta catena proxy. |
| A06 Vulnerable Components | DEP-01: 8 moderate complessive, 4 nel grafo production; nessuna high/critical al 16 luglio 2026. |
| A07 Identification/Auth Failures | Email verificata, account linking e binding OIDC migliorati. Restano AUTH-01, AUTH-02, AUTH-03, AUTH-06, AUTH-10 e AUTH-14. |
| A08 Software/Data Integrity | Lockfile presente; mancano policy CI sulle advisory e scansione malware allegati. |
| A09 Logging/Monitoring | Leakage ridotto, ma manca audit log strutturato e alerting (AUTH-12). |
| A10 SSRF | Nessun fetch controllato direttamente dall'utente; issuer ZITADEL proviene da env ma va validato fail-closed. |

## Piano di lavoro raccomandato

### P0 — prima di un rollout sensibile

- [ ] AUTH-01 — policy ZITADEL e MFA registrazione.
- [ ] AUTH-02 — revoca sessioni applicative.
- [ ] AUTH-04 — separazione privilegi e blocco escalation admin.

### P1 — subito dopo P0

- [ ] AUTH-03 — rate limiting condiviso e proxy fidato.
- [ ] AUTH-05 — open redirect con backslash.
- [ ] AUTH-09 — validazione env e segreti fail-closed.
- [ ] AUTH-10 — enrollment e recovery MFA.
- [ ] AUTH-11 — limite body auth.
- [ ] AUTH-15 — atomicità ultimo amministratore.
- [ ] SEC-01 — storage privato e antimalware allegati.

### P2 — hardening e tracciabilità

- [ ] AUTH-06 — privacy/enumerazione completa.
- [ ] AUTH-07 — decisione Login UI multi-client.
- [ ] AUTH-08 — check OIDC e documentazione.
- [ ] AUTH-12 — audit log e alerting.
- [ ] AUTH-13 — session cleanup ZITADEL.
- [ ] AUTH-14 — password policy.
- [ ] DEP-01 — remediation dipendenze.
- [ ] SEC-02/03/04/05 — difese aggiuntive.

## Strategia di test mancante

I test attuali sono prevalentemente unitari. Aggiungere test d'integrazione ed
E2E avversariali per:

- policy ZITADEL in ogni combinazione significativa;
- registrazione con email verification e MFA obbligatoria;
- reset password seguito da replay di una sessione precedente;
- account disabilitato e revoca globale;
- OIDC multi-client, `prompt`, `max_age`, state/nonce/PKCE e callback ostili;
- callback `/\evil.example` e varianti codificate;
- brute force su più IP e più repliche;
- auto-promozione, invito admin e modifica permessi;
- race concorrente sull'ultimo amministratore;
- autorizzazione cross-tenant con Postgres reale;
- logout OIDC sul dominio di produzione.

## Verifiche eseguite

- `npm test`: 11 file, 75 test superati.
- `npm run typecheck`: superato durante la review generale.
- `npm run lint`: nessun errore; tre warning React Compiler già presenti.
- `npm run build`: build Next.js 16.2.10 completata durante la review generale.
- `npm audit`: 8 moderate complessive, 0 high, 0 critical.
- `npm audit --omit=dev`: 4 moderate nel grafo production.
- `git diff --check`: nessun errore whitespace durante la review generale.

## Riferimenti

- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OWASP Denial of Service Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [ZITADEL Session Validation](https://zitadel.com/docs/guides/integrate/login-ui/session-validation)
- [ZITADEL MFA in a Custom Login UI](https://zitadel.com/docs/guides/integrate/login-ui/mfa)
- [ZITADEL OIDC in a Custom Login UI](https://zitadel.com/docs/guides/integrate/login-ui/oidc-standard)
- [ZITADEL Delete Session](https://zitadel.com/docs/reference/api/session/zitadel.session.v2.SessionService.DeleteSession)
