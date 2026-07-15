# Guardrail UI e marketing di Gausio

Questo documento è normativo. Raccoglie le decisioni UI/UX concordate e deve
essere letto prima di modificare la landing, le pagine pubbliche o i componenti
condivisi citati qui sotto.

Se una nuova richiesta esplicita dell'utente contraddice una regola, prevale la
nuova richiesta. Nello stesso intervento bisogna aggiornare sia il codice sia
questo documento, così il guardrail non rimane obsoleto.

## Principi trasversali

- L'interfaccia resta in italiano; gli identificatori di codice restano in
  inglese.
- Il tema è temporaneamente solo `light`: mantenere `defaultTheme="light"`,
  `forcedTheme="light"` ed `enableSystem={false}`. Anche chi aveva selezionato
  il dark deve vedere il light. Non riattivare toggle o tema dark finché non
  viene richiesto esplicitamente.
- Il marchio ha un'unica fonte: `BrandLogo` in
  `src/components/shared/brand-logo.tsx`, basato su `/g.svg`. Non duplicare il
  logo con SVG, immagini o markup locali. Nel sito pubblico usare il simbolo in
  `primary` e mostrare anche la label `Gausio`.
- Le card condivise dell'applicazione usano un padding di `24px`. Le card
  editoriali costruite direttamente nella landing sono escluse e mantengono il
  padding deciso dal layout della singola sezione.
- Il linguaggio visivo pubblico è netto e poco arrotondato: card marketing,
  CTA, toast e controlli rettangolari descritti in questo documento usano un
  radius di `2px`. Non introdurre pill o radius ampi in questi elementi.
- Le icone hamburger, chiusura drawer, tipo toast e chiusura toast misurano
  `20px × 20px`. L'area cliccabile può e deve rimanere più grande.

## Button e CTA

- La size `base` misura `40px` in altezza, usa label `text-base` e radius
  `2px`.
- La size `lg` misura `48px` in altezza, usa label `text-lg` e radius `2px`.
- Nel sito pubblico esiste una sola CTA concettuale: `Richiedi una demo`, con
  size `lg` e destinazione `/contatti`. La copia responsive in navbar e drawer
  è la stessa CTA, non una seconda azione.
- Non aggiungere CTA con label alternative senza una nuova decisione esplicita.

## Toast

- Usare il wrapper `toast` da `@/components/shared/toast`, mai importare
  direttamente `toast` da `sonner` nelle feature.
- Varianti ammesse: `base`, `success`, `warning`, `error`. La variante base è
  resa come informativa.
- Ogni toast ha altezza minima `80px`, nessun bordo e radius `2px`.
- Layout orizzontale: icona variante a sinistra, colonna testuale al centro,
  chiusura a destra. Icona variante e chiusura sono entrambe `20px × 20px`.
- La colonna testuale contiene sempre due righe semantiche: titolo
  `text-base font-bold` e corpo `text-base font-normal`.
- Titoli standard: `Informazione`, `Operazione completata`, `Attenzione`,
  `Errore`. Il messaggio passato dal chiamante diventa il corpo.
- Background solidi, non trasparenti, nella famiglia cromatica della variante;
  testo e icone usano una gradazione più scura della stessa famiglia.

## Card condivise

- `Card`/`AppCard`, header, content e footer usano lo spacing standard di
  `24px`.
- Non annullare il padding con `px-0`, salvo un'eccezione esplicitamente
  richiesta e documentata.
- `StatCard` segue lo stesso padding di `24px`.
- Questa regola non modifica le card custom della landing, che hanno una
  composizione editoriale autonoma.

## Landing e pagine pubbliche

- Il contenitore pubblico massimo è `1440px`, espresso con `max-w-360`.
  Navbar, sezioni della home, footer, contatti, pagine legali e preferenze
  cookie devono condividere questo limite. Gli sfondi possono restare full
  bleed e i blocchi di testo possono essere più stretti per leggibilità.
- Direzione visiva: pagina prodotto ispirata alla gerarchia Apple, senza
  copiarne asset o contenuti. Usare molto spazio, tipografia ampia, alternanza
  tra bianco e `#f5f5f7`, composizioni editoriali e superfici piatte.
- Non usare estetica glass per card o sezioni. Durante lo scroll la navbar deve
  avere sfondo solido, senza blur o trasparenza.
- Le sezioni e card marketing usano radius `2px` e prevedono visual di prodotto:
  screenshot reali quando disponibili, altrimenti pseudo-wireframe tramite
  `ProductScreenPlaceholder`.
- Gli chevron degli accordion FAQ nella landing misurano `30px × 30px`.
- Il copy deve essere marketing ma concreto: partire da un problema riconoscibile,
  mostrare il beneficio e chiudere sull'effetto per l'azienda. Evitare sia il
  catalogo tecnico di funzionalità sia slogan vaghi. È corretto citare il
  contesto operativo (clienti, ordini, attività, documenti, scadenze, team)
  senza trasformare la pagina in documentazione del prodotto.

## Navbar pubblica

- Altezza e altezza massima: `80px`. Larghezza massima: `1440px`.
- Desktop diviso in tre aree: blocco logo a sinistra, navigazione allineata a
  sinistra nella parte centrale, CTA a destra.
- Brand desktop: simbolo `primary` con label `Gausio` accanto.
- Voci consentite: `Funzionalità`, `Prezzi`, `FAQ`. Non aggiungere `Contatti`
  come voce: il contatto è rappresentato dalla CTA demo.
- Link di navigazione `text-lg`, senza background in hover. Stato attivo e
  hover sono indicati da una linea inferiore.
- Il drawer mobile rispecchia voci e CTA desktop. Hamburger e chiusura sono
  `20px × 20px`.
- Quando la pagina è scrollata, la navbar è solida e non usa effetto glass.

## Footer pubblico

- Contenitore e riga copyright hanno larghezza massima `1440px`.
- Usare `BrandLogo`, con simbolo `primary` e label `Gausio`.
- Tutti i testi del footer sono almeno `text-base`.
- In `Legale`, `Preferenze cookie` compare una sola volta e punta alla rotta
  canonica `/preferenza-cookie`.
- `/preferenze-cookie` è solo una rotta legacy che reindirizza alla canonica.
- Gli indirizzi email pubblici usano il dominio `@gausio.com`, mai
  `@gausio.example`.

## Pagine legali e preferenze cookie

- Le pagine legali seguono il layout editoriale della landing: contenitore
  massimo `1440px`, gerarchia tipografica ampia, contenuto leggibile e superfici
  con radius `2px`.
- Il corpo del testo è almeno `text-base`; le tabelle devono rimanere
  consultabili su mobile tramite overflow orizzontale.
- Nella pagina `/preferenza-cookie`, i pulsanti usano size `base`.
- Gli switch della pagina sono rettangolari: root `40px × 24px`, radius `2px`;
  thumb interno `18px × 18px`, radius `2px`, con margini simmetrici di `3px`.

## Hydration e markup pubblico

- Non creare differenze server/client con branch su `window`, `Date.now()`,
  `Math.random()`, formattazione locale non deterministica, dati esterni senza
  snapshot o nesting HTML non valido.
- Attributi iniettati da estensioni browser, come `cz-shortcut-listen`, non
  vanno replicati nel markup React. Il `suppressHydrationWarning` già presente
  su `html` e `body` copre questa alterazione esterna nota.

## Verifica minima

- Dopo modifiche ai primitivi condivisi: eseguire almeno `npx tsc --noEmit` e
  `npm run lint`.
- Dopo modifiche a Tailwind, layout pubblico o confini client/server: eseguire
  anche `npm run build` quando l'ambiente lo consente.
- Verificare la resa desktop e mobile delle modifiche visuali, in particolare
  navbar, drawer, footer, toast e overflow delle pagine legali.
