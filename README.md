# Gausio

Gestionale aziendale multi-tenant costruito con **Next.js 16** (monolitico:
frontend + backend), **Tailwind CSS v4**, **shadcn/ui**, **Drizzle ORM +
PostgreSQL** e autenticazione **Zitadel** via **Auth.js v5**.

## Funzionalità

- **Workspace multipli**: ogni azienda è un workspace; onboarding guidato,
  inviti, ruoli (Amministratore, Commerciale, Dipendente, Marketing) e
  **permessi per modulo** (visualizza / crea / modifica / elimina).
- **Anagrafiche**: clienti e fornitori unificati, con **qualifica fornitori**
  (ISO) e archiviazione.
- **Ciclo attivo/passivo**: ordini emessi e ricevuti, **fatture emesse e
  ricevute con editor a righe** (IVA per aliquota, sconti, totali live),
  DDT con generazione dei movimenti di magazzino.
- **Magazzino**: articoli con scorta minima, **carico / scarico / rettifiche**
  con aggiornamento transazionale delle giacenze.
- **Commesse** collegate a clienti, documenti e ore lavorate.
- **Project management**: progetti con board kanban dei task.
- **Personale**: anagrafica dipendenti, ferie / permessi / malattie con
  approvazione, timbrature, schede lavoro su commessa.
- **Documenti ISO** (9001, 27001, 14001, 45001…): procedure e documentazione
  con ciclo di revisioni e approvazione.
- **Allegati** su ogni entità, **export PDF/XLSX** (elenco e dettaglio) in
  tutti i moduli, **dashboard diverse per ruolo**, tema chiaro/scuro.
- Pagine pubbliche complete (landing, contatti, privacy, cookie policy,
  termini, accessibilità) con **banner cookie** a categorie.

## Requisiti

- Node.js 20+
- PostgreSQL 15+
- (Produzione) Un'istanza [Zitadel](https://zitadel.com) con un'app OIDC
  (Authorization Code + PKCE)

## Setup

```bash
git clone <repo>
cd gausio
npm install
cp .env.example .env      # e compila le variabili
npx drizzle-kit migrate    # crea le tabelle sul DATABASE_URL configurato
npm run dev
```

### Variabili d'ambiente

| Variabile | Descrizione |
| --- | --- |
| `DATABASE_URL` | Stringa di connessione Postgres |
| `AUTH_SECRET` | Segreto Auth.js (`npx auth secret`) |
| `AUTH_URL` | URL pubblico dell'app |
| `AUTH_ZITADEL_ISSUER` | Issuer dell'istanza Zitadel |
| `AUTH_ZITADEL_ID` | Client ID dell'app OIDC |
| `AUTH_ZITADEL_SECRET` | Client Secret (solo auth method Basic/Post; vuoto con "None"/PKCE) |
| `ZITADEL_SERVICE_USER_TOKEN` | PAT del login client (abilita la login UI custom) |
| `UPLOADS_DIR` | Cartella degli allegati (default `storage/uploads`) |

### Autenticazione

L'unica modalità di login è Zitadel (OIDC, code flow + PKCE). In locale si usa
un'applicazione OIDC Zitadel dedicata allo sviluppo (stesse variabili, valori
dell'app dev). Le pagine `/sign-in`, `/sign-up`, `/mfa`, `/forgot-password`,
`/reset-password` e `/verify-email` sono una login UI completamente custom:
form nell'app, verifica via Session/User API v2, l'utente non vede mai la UI
hosted. Richiede tutte le variabili `AUTH_ZITADEL_*` più
`ZITADEL_SERVICE_USER_TOKEN`; se mancano, le pagine mostrano un avviso di
configurazione.

### Configurazione Zitadel

Vedi `docs/ZITADEL_CONFIGURATION.md` per la procedura completa (app OIDC,
service user con ruolo Instance Login Client + PAT, feature Login V2 con base
URI verso l'app, trusted domain, SMTP).

La pagina `/sign-up` apre la registrazione ospitata con il parametro OIDC
`prompt=create`. `/forgot-password` continua invece nel flusso self-service di
Zitadel, così l'applicazione non gestisce direttamente le credenziali.

## Architettura

Sviluppo **feature-first**: ogni dominio vive in `src/features/<feature>`
(schema zod, server actions, query, componenti). I componenti shadcn in
`src/components/ui` sono trattati come **primitivi**: le feature usano solo i
wrapper condivisi di `src/components/shared` (regola ESLint dedicata).
Convenzioni complete in [AGENTS.md](./AGENTS.md).

```
src/
  app/            # routing (pagine sottili)
  components/
    ui/           # primitivi shadcn
    shared/       # wrapper condivisi (unica fonte UI per le feature)
    layout/       # shell della dashboard
  features/       # domini: contacts, orders, invoices, ddt, warehouse,
                  # jobs, projects, hr, iso, workspaces, dashboard, ...
  server/         # db (Drizzle), auth, permessi, export PDF/XLSX
  lib/            # utilities condivise
```

## Script

| Comando | Descrizione |
| --- | --- |
| `npm run dev` | Sviluppo (Turbopack) |
| `npm run build` / `npm start` | Build e avvio produzione |
| `npm run lint` | ESLint |
| `npx drizzle-kit generate` | Genera una migrazione dallo schema |
| `npx drizzle-kit migrate` | Applica le migrazioni |
