import type { Metadata } from "next";
import Link from "next/link";
import { LegalArticle } from "@/features/marketing/components/legal-article";

export const metadata: Metadata = {
  title: "Termini e condizioni",
  description:
    "Termini e condizioni d'uso della piattaforma Gausio.",
};

export default function TermsPage() {
  return (
    <LegalArticle title="Termini e condizioni" lastUpdated="14 luglio 2026">
      <p>
        I presenti Termini e condizioni (&quot;Termini&quot;) disciplinano
        l&apos;utilizzo della piattaforma Gausio (il &quot;Servizio&quot;),
        fornita da Gausio S.r.l., Via dell&apos;Innovazione 42, 00100 Roma,
        P.IVA 01234567890 (&quot;Gausio&quot;). Registrandosi o utilizzando il
        Servizio, l&apos;utente accetta integralmente i presenti Termini.
      </p>

      <h2>1. Oggetto del Servizio</h2>
      <p>
        Gausio è un&apos;applicazione web gestionale che consente alle aziende
        di gestire, all&apos;interno di spazi di lavoro dedicati
        (&quot;workspace&quot;): anagrafiche di clienti e fornitori, ordini,
        fatture, documenti di trasporto, magazzino, commesse, progetti,
        personale e documentazione per i sistemi di gestione (ISO). Il
        Servizio è erogato in modalità software-as-a-service.
      </p>

      <h2>2. Account e registrazione</h2>
      <ul>
        <li>
          La registrazione avviene tramite il provider di identità Zitadel.
          L&apos;utente è responsabile della riservatezza delle proprie
          credenziali e di ogni attività compiuta tramite il proprio account.
        </li>
        <li>
          L&apos;utente si impegna a fornire informazioni veritiere, complete e
          aggiornate.
        </li>
        <li>
          Il Servizio è riservato a soggetti che agiscono nell&apos;esercizio
          di attività imprenditoriale o professionale.
        </li>
      </ul>

      <h2>3. Workspace, ruoli e contenuti</h2>
      <ul>
        <li>
          L&apos;utente che crea un workspace ne diventa amministratore e può
          invitare altri utenti assegnando ruoli e permessi per modulo.
        </li>
        <li>
          I dati inseriti nel workspace restano di titolarità
          dell&apos;azienda cliente; Gausio li tratta come responsabile del
          trattamento secondo la <Link href="/privacy-policy">Privacy Policy</Link>.
        </li>
        <li>
          L&apos;amministratore è responsabile della correttezza dei dati
          inseriti e della gestione dei permessi all&apos;interno del proprio
          workspace.
        </li>
      </ul>

      <h2>4. Obblighi e divieti dell&apos;utente</h2>
      <p>È vietato, a titolo esemplificativo:</p>
      <ul>
        <li>utilizzare il Servizio per finalità illecite o fraudolente;</li>
        <li>
          caricare contenuti che violino diritti di terzi, la normativa
          applicabile o che contengano codice dannoso;
        </li>
        <li>
          tentare di accedere a workspace, dati o funzionalità non autorizzati,
          o di compromettere la sicurezza e la disponibilità del Servizio;
        </li>
        <li>
          rivendere o concedere in sublicenza il Servizio senza accordo
          scritto.
        </li>
      </ul>

      <h2>5. Corrispettivi</h2>
      <p>
        Il piano Free è gratuito. I piani a pagamento sono fatturati secondo i
        prezzi pubblicati sul sito o concordati per iscritto. In caso di
        mancato pagamento, Gausio può sospendere l&apos;accesso al Servizio
        previa comunicazione con congruo preavviso.
      </p>

      <h2>6. Proprietà intellettuale</h2>
      <p>
        Il software, l&apos;interfaccia, i marchi e la documentazione del
        Servizio sono e restano di proprietà esclusiva di Gausio o dei suoi
        licenzianti. All&apos;utente è concessa una licenza d&apos;uso
        limitata, non esclusiva e non trasferibile, per la durata del
        rapporto.
      </p>

      <h2>7. Disponibilità del Servizio e limitazione di responsabilità</h2>
      <ul>
        <li>
          Gausio si impegna a mantenere il Servizio disponibile con la massima
          continuità ragionevolmente possibile, fatti salvi interventi di
          manutenzione programmata o cause di forza maggiore.
        </li>
        <li>
          Nei limiti consentiti dalla legge, Gausio non risponde dei danni
          indiretti, della perdita di profitti o di dati imputabile a un uso
          non conforme del Servizio. La responsabilità complessiva di Gausio è
          in ogni caso limitata ai corrispettivi versati dal cliente nei 12
          mesi precedenti l&apos;evento dannoso.
        </li>
        <li>
          Nulla nei presenti Termini limita la responsabilità per dolo o colpa
          grave.
        </li>
      </ul>

      <h2>8. Durata, recesso e cessazione</h2>
      <ul>
        <li>
          L&apos;utente può cessare l&apos;utilizzo del Servizio e richiedere
          la cancellazione dell&apos;account in qualsiasi momento.
        </li>
        <li>
          Gausio può risolvere il contratto in caso di violazione sostanziale
          dei presenti Termini, previa diffida ove applicabile.
        </li>
        <li>
          Alla cessazione, l&apos;azienda cliente può esportare i propri dati
          nei formati resi disponibili (PDF, XLSX) entro 30 giorni; decorso
          tale termine i dati saranno cancellati o anonimizzati.
        </li>
      </ul>

      <h2>9. Modifiche ai Termini</h2>
      <p>
        Gausio può aggiornare i presenti Termini dandone comunicazione con
        almeno 30 giorni di preavviso per le modifiche sostanziali. L&apos;uso
        continuato del Servizio dopo l&apos;entrata in vigore delle modifiche
        ne costituisce accettazione.
      </p>

      <h2>10. Legge applicabile e foro competente</h2>
      <p>
        I presenti Termini sono regolati dalla legge italiana. Per ogni
        controversia è competente in via esclusiva il Foro di Roma, fatti
        salvi i fori inderogabili previsti dalla legge.
      </p>

      <h2>11. Contatti</h2>
      <p>
        Per qualsiasi domanda sui presenti Termini:{" "}
        <a href="mailto:legal@gausio.com">legal@gausio.com</a> o la
        pagina <Link href="/contatti">Contatti</Link>.
      </p>
    </LegalArticle>
  );
}
