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
| `AUTH_ZITADEL_ID` / `AUTH_ZITADEL_SECRET` | Credenziali dell'app OIDC |
| `AUTH_DEV_LOGIN` | `true` per abilitare il login di sviluppo senza Zitadel |
| `UPLOADS_DIR` | Cartella degli allegati (default `storage/uploads`) |

### Login di sviluppo

Con `AUTH_DEV_LOGIN=true` la pagina di accesso mostra un form "Login di
sviluppo" che crea l'utente al volo dalla sola email: utile per provare
l'app senza un'istanza Zitadel. **Non abilitarlo in produzione.**

### Configurazione Zitadel

1. Crea un progetto e un'applicazione **Web** (OIDC, Authorization Code + PKCE).
2. Redirect URI: `https://<host>/api/auth/callback/zitadel`
   (in dev: `http://localhost:3000/api/auth/callback/zitadel`).
3. Copia issuer, client id e client secret nelle env.

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
