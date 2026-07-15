import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/shared";
import { ProductScreenPlaceholder } from "@/features/marketing/components/product-screen-placeholder";

export const metadata: Metadata = {
  title: "Gausio — Tutto torna.",
  description:
    "Gausio collega persone, informazioni e lavoro quotidiano in un unico gestionale, così la tua azienda resta sempre sotto controllo.",
};

const FAQS = [
  {
    question: "Posso sostituire gli strumenti che uso oggi?",
    answer:
      "Sì. La demo serve anche a capire quali strumenti possono essere riuniti e quali dati conviene portare con te. Il passaggio viene pianificato per gradi, senza fermare il lavoro quotidiano.",
  },
  {
    question: "Il team deve cambiare completamente metodo?",
    answer:
      "No. Gausio dà una struttura comune al modo in cui già lavorate. Le attività diventano più leggibili, i passaggi più chiari e le informazioni smettono di dipendere dalla memoria delle singole persone.",
  },
  {
    question: "Come aiuta a evitare ritardi e urgenze?",
    answer:
      "Rende visibili priorità, scadenze e passaggi ancora aperti prima che diventino problemi. Chi deve agire trova subito il contesto, senza ricostruirlo tra email, messaggi e fogli separati.",
  },
  {
    question: "Quanto costa Gausio?",
    answer:
      "Dipende dalle dimensioni del team e dal percorso più adatto alla tua azienda. Durante la demo definiamo ciò che serve davvero, evitando pacchetti sovradimensionati e costi difficili da leggere.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <section className="overflow-hidden bg-white px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-32 lg:pt-36">
        <div className="mx-auto w-full max-w-360 text-center">
          <p className="text-lg font-semibold text-primary sm:text-xl">Gausio</p>
          <h1 className="mx-auto mt-4 max-w-5xl text-5xl font-bold leading-[0.95] tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl">
            La tua azienda.
            <span className="block text-primary">Tutto torna.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            Quando clienti, ordini, attività e documenti vivono nello stesso
            flusso, il team smette di rincorrere informazioni e torna a far
            avanzare il lavoro.
          </p>
          <ProductScreenPlaceholder
            variant="overview"
            caption="Panoramica aziendale"
            className="mt-14 sm:mt-20"
          />
        </div>
      </section>

      <section
        id="funzionalita"
        className="scroll-mt-20 bg-[#f5f5f7] px-5 py-24 sm:px-8 sm:py-32"
      >
        <div className="mx-auto w-full max-w-360">
          <h2 className="text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Prima di tutto, cosa cambia.
          </h2>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="flex min-h-[30rem] flex-col overflow-hidden rounded-[2px] bg-white p-7 sm:min-h-[44rem] sm:p-10">
              <p className="text-base font-semibold text-primary">
                La giornata giusta, fin dall’inizio.
              </p>
              <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
                Parti da ciò che richiede attenzione. Non da ciò che devi
                cercare.
              </h3>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Scadenze, attività ferme e priorità emergono subito. Sai dove
                intervenire prima che una piccola attesa diventi un’urgenza.
              </p>
              <ProductScreenPlaceholder
                variant="overview"
                caption="Priorità e attività del giorno"
                className="mt-auto translate-y-12"
              />
            </article>

            <article className="flex min-h-[30rem] flex-col overflow-hidden rounded-[2px] bg-white p-7 sm:min-h-[44rem] sm:p-10">
              <p className="text-base font-semibold text-primary">
                Una sola versione della verità.
              </p>
              <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
                Un dato entra una volta. E continua a lavorare.
              </h3>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Niente copie tra fogli, email e strumenti diversi. Ogni
                passaggio riparte dalle informazioni già raccolte.
              </p>
              <ProductScreenPlaceholder
                variant="workflow"
                caption="Flusso di lavoro collegato"
                className="mt-auto translate-y-12"
              />
            </article>

            <article className="overflow-hidden rounded-[2px] bg-white p-7 sm:p-10 lg:col-span-2">
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <p className="text-base font-semibold text-primary">
                    Da una persona all’altra, senza vuoti.
                  </p>
                  <h3 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
                    Il lavoro cambia mano. Il contesto resta.
                  </h3>
                  <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                    Commerciale, amministrazione e operatività lavorano sullo
                    stesso filo. Meno domande ripetute, meno passaggi persi,
                    meno tempo per ricostruire cosa è già successo.
                  </p>
                </div>
                <ProductScreenPlaceholder
                  variant="workflow"
                  caption="Passaggi tra reparti"
                />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8 sm:py-36">
        <div className="mx-auto w-full max-w-360">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-lg font-semibold text-primary sm:text-xl">
              Fatto per restare in controllo.
            </p>
            <h2 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
              Una decisione non dovrebbe iniziare con:
              <span className="block text-muted-foreground">
                “Dove trovo il dato?”
              </span>
            </h2>
            <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-muted-foreground">
              Andamento, carichi e punti critici diventano leggibili mentre il
              lavoro accade. Non quando è ormai troppo tardi per intervenire.
            </p>
          </div>
          <ProductScreenPlaceholder
            variant="insights"
            caption="Andamento e indicatori aziendali"
            className="mt-16 sm:mt-20"
          />
        </div>
      </section>

      <section className="bg-[#f5f5f7] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto w-full max-w-360">
          <div className="max-w-4xl">
            <p className="text-lg font-semibold text-primary sm:text-xl">
              Meno attrito. Più avanzamento.
            </p>
            <h2 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
              Il lavoro non dovrebbe ricominciare da zero a ogni passaggio.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <article className="overflow-hidden rounded-[2px] bg-white">
              <div className="p-7 sm:p-10">
                <p className="text-base font-semibold text-primary">
                  Le scadenze non diventano sorprese.
                </p>
                <h3 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
                  Prima lo vedi. Prima lo risolvi.
                </h3>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  Ciò che è fermo, in ritardo o in attesa non resta nascosto
                  dentro una casella di posta.
                </p>
              </div>
              <ProductScreenPlaceholder
                variant="workflow"
                caption="Scadenze e avanzamento"
                className="m-4 mt-0 sm:m-6 sm:mt-0"
              />
            </article>

            <article className="overflow-hidden rounded-[2px] bg-[#111111] text-white">
              <div className="p-7 sm:p-10">
                <p className="text-base font-semibold text-primary">
                  I numeri arrivano prima delle sorprese.
                </p>
                <h3 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
                  Il margine non si scopre a fine mese.
                </h3>
                <p className="mt-5 text-lg leading-relaxed text-white/65">
                  Costi, tempo e valore restano leggibili mentre il lavoro
                  procede. Così puoi correggere la rotta, non solo commentarla.
                </p>
              </div>
              <ProductScreenPlaceholder
                variant="insights"
                caption="Margini e andamento"
                className="m-4 mt-0 sm:m-6 sm:mt-0"
              />
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8 sm:py-36">
        <div className="mx-auto grid w-full max-w-360 gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-lg font-semibold text-primary sm:text-xl">
              Il team cambia. Il metodo resta.
            </p>
            <h2 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
              Ognuno vede ciò che serve.
              <span className="block text-muted-foreground">
                Tutti vedono la stessa azienda.
              </span>
            </h2>
            <p className="mt-7 text-xl leading-relaxed text-muted-foreground">
              Ruoli diversi, responsabilità chiare e un contesto condiviso.
              Quando entra una nuova persona, il lavoro non deve essere
              ricostruito da capo.
            </p>
          </div>
          <ProductScreenPlaceholder
            variant="team"
            caption="Team, ruoli e responsabilità"
          />
        </div>
      </section>

      <section
        id="prezzi"
        className="scroll-mt-20 bg-[#f5f5f7] px-5 py-6 sm:px-8 sm:py-8"
      >
        <div className="mx-auto w-full max-w-360 overflow-hidden rounded-[2px] bg-[#111111] px-7 py-16 text-white sm:px-12 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-lg font-semibold text-primary sm:text-xl">
              Più valore. Meno costi invisibili.
            </p>
            <h2 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
              Un unico gestionale. Non una collezione di abbonamenti.
            </h2>
            <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-white/65">
              Strumenti separati costano più del loro canone: richiedono copie,
              controlli e collegamenti manuali. Gausio riunisce il lavoro e
              cresce con ciò che serve davvero alla tua azienda.
            </p>
          </div>
          <ProductScreenPlaceholder
            variant="overview"
            caption="Spazio di lavoro unificato"
            className="mt-14 sm:mt-20"
          />
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-20 bg-white px-5 py-24 sm:px-8 sm:py-36"
      >
        <div className="mx-auto grid w-full max-w-360 gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="text-lg font-semibold text-primary sm:text-xl">
              Domande frequenti
            </p>
            <h2 className="mt-4 text-5xl font-bold leading-none tracking-[-0.05em] sm:text-7xl">
              Prima di partire.
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={"faq-" + index}
                className="border-black/12"
              >
                <AccordionTrigger
                  className="py-7 text-left text-xl font-semibold sm:text-2xl"
                  iconClassName="size-[30px]"
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-3xl pb-7 text-lg leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-[#f5f5f7] px-5 py-24 text-center sm:px-8 sm:py-36">
        <div className="mx-auto max-w-5xl">
          <p className="text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            Quando tutto torna,
            <span className="block text-primary">puoi guardare più avanti.</span>
          </p>
        </div>
      </section>
    </>
  );
}
