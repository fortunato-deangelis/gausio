import type { Metadata } from "next";
import Link from "next/link";
import { LegalArticle } from "@/features/marketing/components/legal-article";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sul trattamento dei dati personali ai sensi del Regolamento (UE) 2016/679 (GDPR).",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalArticle title="Privacy Policy" lastUpdated="14 luglio 2026">
      <p>
        La presente informativa descrive le modalità di trattamento dei dati
        personali degli utenti che consultano il sito e utilizzano
        l&apos;applicazione Gausio, ai sensi del Regolamento (UE) 2016/679
        (&quot;GDPR&quot;) e del D.Lgs. 196/2003 come modificato dal D.Lgs.
        101/2018 (&quot;Codice Privacy&quot;).
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Il titolare del trattamento è <strong>Gausio S.r.l.</strong>, con sede
        legale in Via dell&apos;Innovazione 42, 00100 Roma (RM), P.IVA
        01234567890, contattabile all&apos;indirizzo email{" "}
        <a href="mailto:privacy@gausio.com">privacy@gausio.com</a> o
        tramite la pagina <Link href="/contatti">Contatti</Link>.
      </p>

      <h2>2. Categorie di dati trattati</h2>
      <ul>
        <li>
          <strong>Dati di registrazione e account</strong>: nome, cognome,
          indirizzo email e immagine del profilo, forniti tramite il provider
          di identità Zitadel al momento della registrazione o dell&apos;accesso.
        </li>
        <li>
          <strong>Dati aziendali inseriti dagli utenti</strong>: anagrafiche di
          clienti e fornitori, documenti commerciali (ordini, fatture, DDT),
          dati del personale, documenti allegati e ogni altro contenuto
          caricato nei workspace. Per tali dati Gausio S.r.l. opera come{" "}
          <strong>responsabile del trattamento</strong> ai sensi dell&apos;art.
          28 GDPR per conto dell&apos;azienda titolare del workspace.
        </li>
        <li>
          <strong>Dati di navigazione</strong>: indirizzi IP, log tecnici e
          dati necessari alla sicurezza e all&apos;erogazione del servizio.
        </li>
        <li>
          <strong>Dati da modulo di contatto</strong>: nome, email, azienda e
          contenuto del messaggio inviato tramite la pagina Contatti.
        </li>
      </ul>

      <h2>3. Finalità e basi giuridiche</h2>
      <ul>
        <li>
          <strong>Erogazione del servizio</strong> (creazione account, gestione
          dei workspace, funzionalità applicative) — base giuridica:
          esecuzione del contratto (art. 6.1.b GDPR).
        </li>
        <li>
          <strong>Riscontro alle richieste di contatto</strong> — base
          giuridica: esecuzione di misure precontrattuali (art. 6.1.b GDPR).
        </li>
        <li>
          <strong>Sicurezza e prevenzione degli abusi</strong> — base
          giuridica: legittimo interesse (art. 6.1.f GDPR).
        </li>
        <li>
          <strong>Adempimenti di legge</strong> (contabili, fiscali) — base
          giuridica: obbligo legale (art. 6.1.c GDPR).
        </li>
        <li>
          <strong>Statistiche di utilizzo</strong> tramite cookie opzionali —
          base giuridica: consenso (art. 6.1.a GDPR), revocabile in ogni
          momento dalla pagina{" "}
          <Link href="/preferenza-cookie">Preferenze cookie</Link>.
        </li>
      </ul>

      <h2>4. Modalità del trattamento e conservazione</h2>
      <p>
        I dati sono trattati con strumenti elettronici e misure di sicurezza
        adeguate (cifratura in transito, controllo degli accessi per ruolo,
        isolamento dei dati per workspace). I dati dell&apos;account sono
        conservati per tutta la durata del rapporto e cancellati o
        anonimizzati entro 12 mesi dalla chiusura, fatti salvi gli obblighi di
        legge. I dati inseriti nei workspace sono conservati secondo le
        istruzioni dell&apos;azienda titolare del workspace. I log tecnici sono
        conservati per un massimo di 12 mesi.
      </p>

      <h2>5. Destinatari dei dati</h2>
      <p>
        I dati possono essere comunicati a fornitori di servizi tecnici che
        agiscono come responsabili del trattamento (hosting, provider di
        identità Zitadel, servizi di posta elettronica), a consulenti e
        autorità nei casi previsti dalla legge. I dati non sono oggetto di
        diffusione né di processi decisionali automatizzati che producano
        effetti giuridici sugli interessati.
      </p>

      <h2>6. Trasferimenti extra UE</h2>
      <p>
        I dati sono conservati su server ubicati nell&apos;Unione Europea.
        Qualora un fornitore comporti trasferimenti verso paesi terzi, questi
        avvengono sulla base di decisioni di adeguatezza o delle clausole
        contrattuali standard approvate dalla Commissione Europea (artt. 45 e
        46 GDPR).
      </p>

      <h2>7. Diritti degli interessati</h2>
      <p>
        Ai sensi degli articoli 15-22 del GDPR, l&apos;interessato ha diritto
        di ottenere: l&apos;accesso ai propri dati, la rettifica, la
        cancellazione, la limitazione del trattamento, la portabilità dei
        dati, nonché di opporsi al trattamento fondato sul legittimo interesse
        e di revocare il consenso prestato in qualsiasi momento, senza
        pregiudicare la liceità del trattamento antecedente alla revoca.
      </p>
      <p>
        Le richieste possono essere inviate a{" "}
        <a href="mailto:privacy@gausio.com">privacy@gausio.com</a>.
        Resta salvo il diritto di proporre reclamo al Garante per la
        protezione dei dati personali (
        <a
          href="https://www.garanteprivacy.it"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.garanteprivacy.it
        </a>
        ) ai sensi dell&apos;art. 77 GDPR.
      </p>

      <h2>8. Cookie</h2>
      <p>
        Per le informazioni sull&apos;uso dei cookie si rinvia alla{" "}
        <Link href="/cookie-policy">Cookie Policy</Link> e alla pagina{" "}
        <Link href="/preferenza-cookie">Preferenze cookie</Link>.
      </p>

      <h2>9. Modifiche alla presente informativa</h2>
      <p>
        Eventuali modifiche sostanziali saranno comunicate tramite il sito o
        via email. La data dell&apos;ultimo aggiornamento è indicata in testa
        alla pagina.
      </p>
    </LegalArticle>
  );
}
