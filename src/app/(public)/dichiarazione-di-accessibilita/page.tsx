import type { Metadata } from "next";
import Link from "next/link";
import { LegalArticle } from "@/features/marketing/components/legal-article";

export const metadata: Metadata = {
  title: "Dichiarazione di accessibilità",
  description:
    "Stato di conformità del sito e dell'applicazione Gausio alle WCAG 2.2 livello AA.",
};

export default function AccessibilityPage() {
  return (
    <LegalArticle
      title="Dichiarazione di accessibilità"
      lastUpdated="14 luglio 2026"
    >
      <p>
        Gausio S.r.l. si impegna a rendere il proprio sito web e la propria
        applicazione accessibili, in coerenza con i principi della Legge 9
        gennaio 2004, n. 4 (&quot;Legge Stanca&quot;), della Direttiva (UE)
        2016/2102 e dello standard tecnico di riferimento{" "}
        <strong>WCAG 2.2 livello AA</strong>.
      </p>

      <h2>Stato di conformità</h2>
      <p>
        Il sito e l&apos;applicazione sono <strong>parzialmente conformi</strong>{" "}
        alle WCAG 2.2 livello AA. La maggior parte dei contenuti soddisfa i
        requisiti; alcune aree sono ancora in corso di adeguamento.
      </p>

      <h2>Contenuti non accessibili</h2>
      <ul>
        <li>
          Alcuni grafici della dashboard non dispongono ancora di una
          descrizione testuale alternativa completa dei dati rappresentati.
        </li>
        <li>
          Alcune tabelle complesse potrebbero risultare di difficile
          navigazione con screen reader su schermi di piccole dimensioni.
        </li>
        <li>
          I documenti PDF generati dagli export non sono ancora marcati
          (tagged PDF).
        </li>
      </ul>
      <p>
        Le misure correttive sono pianificate nell&apos;ambito del ciclo di
        sviluppo continuo del prodotto.
      </p>

      <h2>Accorgimenti adottati</h2>
      <ul>
        <li>Navigazione completa da tastiera e indicatori di focus visibili;</li>
        <li>struttura semantica dei contenuti (landmark, heading gerarchici);</li>
        <li>etichette e messaggi di errore associati ai campi dei moduli;</li>
        <li>
          contrasto dei colori conforme ai requisiti AA sia in tema chiaro sia
          in tema scuro;
        </li>
        <li>
          annunci alle tecnologie assistive per le operazioni asincrone (es.
          salvataggio delle preferenze cookie);
        </li>
        <li>testi alternativi per le icone informative.</li>
      </ul>

      <h2>Metodo di valutazione</h2>
      <p>
        La valutazione è stata effettuata internamente (autovalutazione ai
        sensi dell&apos;art. 3-quater della Direttiva (UE) 2016/2102) mediante
        verifica manuale con tastiera e screen reader e strumenti automatici
        di analisi dell&apos;accessibilità, sulle pagine e sui flussi
        principali dell&apos;applicazione.
      </p>

      <h2>Feedback e contatti</h2>
      <p>
        Se riscontri barriere di accessibilità o desideri segnalare un
        problema, scrivici tramite la pagina{" "}
        <Link href="/contatti">Contatti</Link> o all&apos;indirizzo{" "}
        <a href="mailto:accessibilita@gausio.example">
          accessibilita@gausio.example
        </a>
        . Ci impegniamo a rispondere entro 30 giorni.
      </p>

      <h2>Procedura di attuazione</h2>
      <p>
        In caso di risposta insoddisfacente o mancata risposta, è possibile
        rivolgersi all&apos;Agenzia per l&apos;Italia Digitale (AgID) tramite
        la procedura di attuazione prevista dalla normativa vigente (
        <a
          href="https://www.agid.gov.it"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.agid.gov.it
        </a>
        ).
      </p>
    </LegalArticle>
  );
}
