<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Gausio — Convenzioni di sviluppo

Gestionale aziendale multi-tenant (workspace = azienda). Next.js 16 (App Router,
monolitico: frontend + backend), Tailwind v4, shadcn/ui, Drizzle ORM + Postgres,
Auth.js v5 + Zitadel. UI in italiano, identificatori di codice in inglese.

## Guardrail UI obbligatorio

Prima di modificare landing, pagine pubbliche, navbar, footer, tema o primitivi
condivisi (`Card`, `Button`, `Switch`, toast e brand), leggere integralmente
`docs/guardrails/ui-and-marketing.md`. Il documento è normativo: se una nuova
richiesta cambia una regola, aggiornare nello stesso intervento sia il codice
sia il guardrail.

## Architettura feature-first

```
src/
  app/                  # SOLO routing: pagine sottili che compongono le feature
  components/ui/        # primitivi shadcn — MAI importati dalle feature
  components/shared/    # wrapper e composti condivisi — UNICA fonte UI per le feature
  features/<feature>/   # schema.ts (zod), actions.ts ("use server"), queries.ts
                        # (server-only), components/ (client/server components)
  server/               # infrastruttura: db, auth, permessi, export, numerazione
  lib/                  # utilities pure condivise
```

### Regola fondamentale: primitivi vs shared
I componenti shadcn in `components/ui` sono **primitivi**. Le feature e le
pagine importano SOLO da `@/components/shared` (regola ESLint attiva). Se serve
un primitivo non ancora esposto: riesportalo in `shared/primitives.ts` o crea
un wrapper dedicato in `shared/`.

Wrapper già disponibili (barrel `@/components/shared`): `AppCard`, `AppDialog`,
`AppDropdown`, `ConfirmDialog`, `DataTable` + `DataTableColumnHeader`,
`DetailList`, `EmptyState`, `EntitySelect`/`EntitySelectField`, `ExportMenu`,
campi form RHF (`TextField`, `NumberField`, `DateField`, `TimeField`,
`TextareaField`, `SelectField`, `CheckboxField`, `SwitchField`, `FormError`,
`FormGrid`), `PageHeader`, `StatCard`, `StatusBadge`, `ThemeToggle`.

## Multi-tenancy, auth e permessi

- Ogni tabella business ha `workspaceId`; ogni query DEVE filtrare per
  `ctx.workspace.id`.
- Contesto: `requireWorkspace()` (layout/pagine, con redirect) e
  `getWorkspaceContext()` da `@/server/workspace`.
- Permessi per modulo (`view/create/edit/delete`): nelle server action usare
  `requirePermission(module, action)`; nelle pagine usare `can(ctx, module,
  action)` per nascondere azioni non permesse. Moduli: vedi
  `src/server/auth/permissions.ts` (`AppModule`).
- Le pagine di modulo devono fare redirect o mostrare un avviso se manca `view`.

## Server actions

Pattern obbligatorio (mai lanciare eccezioni verso il client):

```ts
"use server";
export async function createX(input: XInput): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requirePermission("module", "create");
    const parsed = xSchema.parse(input);
    // ...insert con workspaceId: ctx.workspace.id
    revalidatePath("/app/...");
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}
```

`ActionResult`, `ok`, `fail` da `@/lib/action-result`. Validazione zod in
`features/<f>/schema.ts`. Toast con `toast` da `@/components/shared/toast` lato
client; non importare direttamente `toast` da `sonner` nelle feature.

- Le colonne Drizzle `numeric` sono stringhe TS: formattare con
  `formatCurrency/formatNumber/formatDate` da `@/lib/format`.
- Numerazione documenti: `nextDocumentNumber(workspaceId, scope, prefix)` da
  `@/server/numbering` (scope es. `order:issued`, `invoice:received`,
  `ddt:issued`, `job`).

## Rotte (mappa completa)

Pubbliche (group `(public)`, layout con navbar/footer/cookie banner):
`/` landing, `/privacy-policy`, `/cookie-policy`,
`/termini-e-condizioni`, `/dichiarazione-di-accessibilita`,
`/preferenza-cookie`. La vecchia `/preferenze-cookie` reindirizza alla rotta
canonica singolare.

Auth: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`,
`/verify-email`, `/mfa`, `/onboarding`, `/invito/[token]`. Le pagine sono
una login UI custom form-first (Session API v2 + OIDC Service v2 via
`src/server/zitadel/*`; l'handshake OIDC parte dopo l'autenticazione, entry
point `/api/login` per la feature Login V2). Richiede `AUTH_ZITADEL_*` +
`ZITADEL_SERVICE_USER_TOKEN`. Vedi `docs/ARCHITECTURE.md` e
`docs/AUTH_FLOW.md`.

App (group `(app)`, prefisso `/app`, protetto, layout con sidebar Vuexy):
- `/app` dashboard per ruolo
- `/app/contatti`, `/app/contatti/nuovo`, `/app/contatti/[id]`
- `/app/vendite/ordini[/nuovo|/[id]]`, `/app/vendite/fatture[/nuovo|/[id]]`
- `/app/acquisti/ordini[/nuovo|/[id]]`, `/app/acquisti/fatture[/nuovo|/[id]]`
- `/app/logistica/ddt[/nuovo|/[id]]`
- `/app/magazzino` (articoli), `/app/magazzino/[id]`, `/app/magazzino/movimenti`
- `/app/commesse[/nuova|/[id]]`
- `/app/progetti[/nuovo|/[id]]` (dettaglio = board task)
- `/app/personale` (dipendenti), `/app/personale/[id]`,
  `/app/personale/assenze`, `/app/personale/timbrature`,
  `/app/personale/schede-lavoro`
- `/app/iso[/nuovo|/[id]]`
- `/app/impostazioni` (profilo azienda), `/app/impostazioni/membri`,
  `/app/impostazioni/ruoli`

La sidebar è già definita in `src/lib/navigation.ts` e filtra per permesso.

## Collegamenti incrociati (quick-create)

Regola UX: ovunque un form referenzi un'altra entità (cliente, fornitore,
commessa, articolo…), usare `EntitySelectField` con `quickCreate` per crearla
inline senza cambiare pagina. Contratti dei dialog quick-create:

- `features/contacts/components/contact-quick-create.tsx` esporta
  `ContactQuickCreateDialog({ initialName, kind, onCreated, onClose })`
  (`kind: "client" | "supplier" | "both"`; `onCreated({ value, label })`).
- `features/jobs/components/job-quick-create.tsx` esporta
  `JobQuickCreateDialog({ initialTitle, onCreated, onClose })`.
- `features/warehouse/components/item-quick-create.tsx` esporta
  `ItemQuickCreateDialog({ initialName, onCreated, onClose })`.

## Allegati

Ogni form/dettaglio di modulo monta
`AttachmentsPanel({ entityType, entityId })` da
`@/features/attachments/components/attachments-panel` (entityType da
`attachmentEntityEnum`).

## Export PDF/XLSX

Route handler per modulo sotto `src/app/api/export/<modulo>/route.ts`
(elenco, `?format=pdf|xlsx`) e `.../<modulo>/[id]/route.ts` (dettaglio PDF).
Usare `buildXlsx`, `buildListPdf`, `buildDetailPdf` (`@/server/export/*`),
`fileResponse` e `requirePermission(module, "view")`. Nelle pagine elenco
montare `ExportMenu({ pdfUrl, xlsxUrl })`.

## Comandi

- `npm run dev` / `npm run build` / `npm run lint`
- `npx drizzle-kit generate` (nuova migrazione), `npx drizzle-kit migrate`
- Env: vedi `.env.example` (Postgres, Zitadel). L'unica modalità di login è
  Zitadel: in locale si usa un'applicazione OIDC dedicata allo sviluppo.
