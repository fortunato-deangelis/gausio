# Variabili d'ambiente

Riferimento completo (vedi `.env.example` per il template). «Obbl.» indica
se la variabile è necessaria per il funzionamento in produzione con la
login custom attiva.

## Database

| Variabile | Obbl. | Uso | Esempio | Dove recuperarla |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | sì | Connessione Postgres (Drizzle) | `postgresql://postgres:postgres@localhost:5432/gausio` | Dal proprio Postgres |

## Auth.js

| Variabile | Obbl. | Uso | Esempio | Dove recuperarla |
| --- | --- | --- | --- | --- |
| `AUTH_SECRET` | sì | Firma/cifra il JWT di sessione Auth.js **e** deriva (HKDF) la chiave AES-256-GCM del cookie di flusso login | stringa casuale ≥32 byte | `npx auth secret` |
| `AUTH_URL` | sì | URL pubblico dell'app: base per redirect OIDC, urlTemplate email, RP ID WebAuthn, post-logout | `https://app.example.com` | Dominio di deploy |

## ZITADEL — OIDC (Auth.js)

| Variabile | Obbl. | Uso | Esempio | Dove recuperarla |
| --- | --- | --- | --- | --- |
| `AUTH_ZITADEL_ISSUER` | sì | Issuer OIDC dell'istanza | `https://idp.example.com` | URL istanza ZITADEL |
| `AUTH_ZITADEL_ID` | sì | Client ID dell'app OIDC | `3273981239@gausio` | Console → progetto → app |
| `AUTH_ZITADEL_SECRET` | solo auth method Basic/Post | Client Secret dell'app OIDC; con Authentication Method **None** (PKCE, public client) va lasciato vuoto e Auth.js usa `token_endpoint_auth_method: none` | — | Console → progetto → app → Configuration |

## ZITADEL — login UI custom

| Variabile | Obbl. | Uso | Esempio | Dove recuperarla |
| --- | --- | --- | --- | --- |
| `ZITADEL_SERVICE_USER_TOKEN` | sì | PAT del service user `IAM_LOGIN_CLIENT`; autentica tutte le chiamate alle API v2 (sessions, oidc, users, settings), che rispondono sull'issuer | `k86ihn-VLM…` | Console → service user → PAT (vedi `docs/ZITADEL_CONFIGURATION.md` §3) |

Comportamento: le pagine custom sono l'unica login. **Senza**
`ZITADEL_SERVICE_USER_TOKEN` (o senza le `AUTH_ZITADEL_*`) i form restano
visibili ma mostrano un avviso di configurazione e le action rispondono con
un errore generico: non esiste alcun redirect verso la UI hosted.

## Sito e sviluppo

| Variabile | Obbl. | Uso | Esempio | Dove recuperarla |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | sì | URL canonico per metadata/sitemap/robots | `https://gausio.com` | Dominio pubblico |
| `UPLOADS_DIR` | no | Cartella allegati (relativa alla root) | `storage/uploads` | — |

Non esiste un login di sviluppo: in locale si usa un'applicazione OIDC
ZITADEL dedicata (stesse variabili, valori dell'app dev).

## Note

- Nessuna variabile con prefisso `NEXT_PUBLIC_` contiene segreti: tutto ciò
  che riguarda ZITADEL resta server-side.
- La rotazione di `ZITADEL_SERVICE_USER_TOKEN` non invalida le sessioni
  applicative esistenti: serve solo per i nuovi login.
- La rotazione di `AUTH_SECRET` invalida sia le sessioni Auth.js sia gli
  eventuali flussi di login in corso (cookie di flusso non più decifrabile:
  l'utente ricomincia dall'accesso).
