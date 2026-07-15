import type { Metadata } from "next";
import Link from "next/link";
import { LegalArticle } from "@/features/marketing/components/legal-article";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Informativa sull'uso dei cookie e delle tecnologie similari sul sito e sull'applicazione Gausio.",
};

export default function CookiePolicyPage() {
  return (
    <LegalArticle title="Cookie Policy" lastUpdated="14 luglio 2026">
      <p>
        Questa informativa descrive i cookie e le tecnologie similari
        utilizzati dal sito e dall&apos;applicazione Gausio, in conformità al
        GDPR, alla direttiva ePrivacy e alle Linee guida del Garante per la
        protezione dei dati personali del 10 giugno 2021.
      </p>

      <h2>1. Cosa sono i cookie</h2>
      <p>
        I cookie sono piccoli file di testo che i siti visitati inviano al
        dispositivo dell&apos;utente, dove vengono memorizzati per essere
        ritrasmessi agli stessi siti alla visita successiva. Si distinguono in
        cookie <strong>tecnici/necessari</strong> (indispensabili al
        funzionamento del servizio, che non richiedono consenso) e cookie{" "}
        <strong>opzionali</strong> (di preferenza o statistici, installati solo
        con il consenso dell&apos;utente).
      </p>

      <h2>2. Cookie utilizzati da Gausio</h2>
      <p>
        Gausio utilizza esclusivamente cookie di prima parte. Nessun cookie di
        profilazione pubblicitaria è presente.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Cookie</th>
            <th scope="col">Categoria</th>
            <th scope="col">Finalità</th>
            <th scope="col">Durata</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>authjs.session-token</code>
            </td>
            <td>Necessario</td>
            <td>
              Mantiene la sessione di accesso dell&apos;utente autenticato
              (Auth.js).
            </td>
            <td>Sessione / 30 giorni</td>
          </tr>
          <tr>
            <td>
              <code>authjs.csrf-token</code>, <code>authjs.callback-url</code>
            </td>
            <td>Necessario</td>
            <td>Protezione CSRF e gestione del flusso di autenticazione.</td>
            <td>Sessione</td>
          </tr>
          <tr>
            <td>
              <code>gausio_ws</code>
            </td>
            <td>Necessario</td>
            <td>Ricorda il workspace (azienda) attivo dell&apos;utente.</td>
            <td>12 mesi</td>
          </tr>
          <tr>
            <td>
              <code>gausio_cookie_consent</code>
            </td>
            <td>Necessario</td>
            <td>
              Memorizza le scelte espresse tramite il banner di consenso
              (versionato: se la policy cambia, il consenso viene richiesto di
              nuovo).
            </td>
            <td>180 giorni</td>
          </tr>
          <tr>
            <td>
              <code>theme</code> (localStorage)
            </td>
            <td>Preferenza (opzionale)</td>
            <td>Ricorda la scelta del tema chiaro o scuro.</td>
            <td>Fino a revoca</td>
          </tr>
          <tr>
            <td>Cookie statistici</td>
            <td>Statistica (opzionale)</td>
            <td>
              Statistiche aggregate e anonime di utilizzo, attivate solo con il
              consenso alla categoria &quot;statistici&quot;. Allo stato
              attuale nessun cookie statistico è installato.
            </td>
            <td>—</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Gestione del consenso</h2>
      <p>
        Alla prima visita viene mostrato un banner che consente di accettare
        tutti i cookie, rifiutare quelli opzionali o gestire le preferenze per
        singola categoria. Le scelte possono essere modificate in qualsiasi
        momento dalla pagina{" "}
        <Link href="/preferenza-cookie">Preferenze cookie</Link> o tramite il
        collegamento &quot;Preferenze cookie&quot; nel footer del sito.
      </p>

      <h2>4. Gestione tramite browser</h2>
      <p>
        È inoltre possibile gestire o eliminare i cookie tramite le
        impostazioni del proprio browser. La disabilitazione dei cookie
        necessari può compromettere l&apos;utilizzo dell&apos;applicazione
        (ad esempio impedendo l&apos;accesso all&apos;area riservata).
      </p>

      <h2>5. Titolare del trattamento</h2>
      <p>
        Gausio S.r.l., Via dell&apos;Innovazione 42, 00100 Roma —{" "}
        <a href="mailto:privacy@gausio.com">privacy@gausio.com</a>. Per
        ogni altra informazione si rinvia alla{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
    </LegalArticle>
  );
}
