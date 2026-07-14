import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Briefcase,
  Building2,
  CheckCircle2,
  Contact,
  FileOutput,
  FileSpreadsheet,
  KanbanSquare,
  Quote,
  Receipt,
  ShieldCheck,
  Sparkles,
  Truck,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  buttonVariants,
} from "@/components/shared";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gausio — Il gestionale all-in-one per la tua azienda",
  description:
    "Clienti e fornitori, ordini, fatture, DDT, magazzino, commesse, personale e documentazione ISO: tutto in un'unica piattaforma.",
};

const STATS = [
  { value: "1.200+", label: "Aziende attive" },
  { value: "3,5 mln", label: "Documenti gestiti" },
  { value: "11", label: "Moduli integrati" },
  { value: "99,9%", label: "Uptime garantito" },
] as const;

const FEATURES = [
  {
    icon: Contact,
    title: "Clienti e fornitori",
    description:
      "Anagrafica unica con qualifica fornitori per i tuoi audit ISO.",
  },
  {
    icon: Receipt,
    title: "Ordini emessi e ricevuti",
    description:
      "Ciclo attivo e passivo con righe, stati e collegamento alle commesse.",
  },
  {
    icon: FileOutput,
    title: "Fatture con editor",
    description:
      "Crea fatture riga per riga con IVA, sconti e totali calcolati in automatico.",
  },
  {
    icon: Truck,
    title: "DDT",
    description:
      "Documenti di trasporto collegati a ordini, articoli e movimenti di magazzino.",
  },
  {
    icon: Boxes,
    title: "Magazzino",
    description:
      "Carico, scarico e rettifiche con giacenze aggiornate in tempo reale.",
  },
  {
    icon: Briefcase,
    title: "Commesse",
    description:
      "Il perno che collega vendite, acquisti, ore lavorate e marginalità.",
  },
  {
    icon: KanbanSquare,
    title: "Project management",
    description: "Progetti e task con board di stato, priorità e assegnatari.",
  },
  {
    icon: Users,
    title: "Personale",
    description:
      "Anagrafica dipendenti, ferie, permessi, malattie, timbrature e schede lavoro.",
  },
  {
    icon: ShieldCheck,
    title: "Documenti ISO",
    description:
      "Procedure e documentazione con revisioni per ISO 9001, 27001 e altre.",
  },
  {
    icon: UsersRound,
    title: "Permessi granulari",
    description:
      "Ruoli con permessi per modulo: visualizza, aggiungi, modifica, elimina.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export PDF ed Excel",
    description:
      "Elenchi e dettagli esportabili in PDF e XLSX con un clic.",
  },
  {
    icon: Building2,
    title: "Multi-workspace",
    description:
      "Gestisci più aziende con lo stesso account e passa dall'una all'altra.",
  },
] as const;

const STEPS = [
  {
    icon: UserPlus,
    title: "1. Registrati",
    description:
      "Crea il tuo account in pochi secondi con l'identità aziendale gestita da Zitadel.",
  },
  {
    icon: Building2,
    title: "2. Crea il workspace",
    description:
      "Rispondi a poche domande di onboarding e configura il profilo della tua azienda.",
  },
  {
    icon: UsersRound,
    title: "3. Invita il team",
    description:
      "Aggiungi colleghi e assegna ruoli: ognuno vede solo i moduli di sua competenza.",
  },
] as const;

const PLANS = [
  {
    name: "Free",
    price: "0 €",
    period: "per sempre",
    highlight: false,
    features: [
      "1 workspace",
      "3 utenti inclusi",
      "Clienti, ordini e fatture",
      "Export PDF",
    ],
    cta: "Inizia gratis",
  },
  {
    name: "Business",
    price: "29 €",
    period: "utente / mese",
    highlight: true,
    features: [
      "Workspace illimitati",
      "Utenti illimitati",
      "Tutti gli 11 moduli",
      "Export PDF ed Excel",
      "Permessi granulari",
      "Supporto prioritario",
    ],
    cta: "Prova Business",
  },
  {
    name: "Enterprise",
    price: "Su misura",
    period: "contattaci",
    highlight: false,
    features: [
      "Tutto di Business",
      "SSO dedicato",
      "SLA personalizzato",
      "Onboarding assistito",
    ],
    cta: "Contattaci",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Abbiamo sostituito quattro strumenti diversi con Gausio. Ordini, fatture e magazzino finalmente parlano tra loro.",
    name: "Laura Bianchi",
    role: "Titolare, OfficinaMeccanica B&C",
  },
  {
    quote:
      "La gestione documentale ISO 9001 con revisioni ci ha fatto superare l'audit senza stress. Consigliatissimo.",
    name: "Marco Ferretti",
    role: "Quality Manager, Ferretti Impianti",
  },
  {
    quote:
      "I permessi per modulo sono perfetti: il commerciale vede le sue cose, l'amministrazione le sue. Zero confusione.",
    name: "Giulia Esposito",
    role: "CFO, Esposito Logistics",
  },
] as const;

const FAQS = [
  {
    question: "Posso provare Gausio gratuitamente?",
    answer:
      "Sì: il piano Free è gratuito per sempre e include i moduli essenziali per un workspace con 3 utenti. Puoi passare a Business in qualsiasi momento.",
  },
  {
    question: "Come funziona l'autenticazione?",
    answer:
      "L'accesso è gestito da Zitadel, una piattaforma di identità open source: login sicuro, MFA e single sign-on senza password memorizzate da noi.",
  },
  {
    question: "Posso gestire più aziende con un solo account?",
    answer:
      "Certo. Ogni azienda è un workspace separato con i propri dati, ruoli e permessi: passi dall'una all'altra con un clic.",
  },
  {
    question: "Gausio è adatto alle certificazioni ISO?",
    answer:
      "Sì: il modulo Qualità gestisce procedure e documenti con codici, revisioni, approvazioni e storico, pensato per ISO 9001, ISO 27001, ISO 14001 e ISO 45001. Inoltre puoi tracciare i fornitori qualificati.",
  },
  {
    question: "I miei dati sono al sicuro?",
    answer:
      "I dati risiedono in un database PostgreSQL dedicato, con isolamento per workspace e permessi granulari per modulo. Puoi esportare tutto in qualsiasi momento in PDF o Excel.",
  },
  {
    question: "Posso importare o esportare i dati?",
    answer:
      "Ogni elenco e ogni documento è esportabile in PDF e XLSX. Per import massivi contattaci: il piano Enterprise include l'onboarding assistito.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background"
        />
        <div
          aria-hidden
          className="absolute -top-24 right-0 size-96 rounded-full bg-chart-2/20 blur-3xl"
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center">
          <Badge className="bg-primary/15 text-primary border-transparent">
            <Sparkles aria-hidden className="size-3.5" />
            Gestionale all-in-one
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Gestisci la tua azienda,{" "}
            <span className="text-primary">tutto in un unico posto</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Clienti e fornitori, ordini, fatture, DDT, magazzino, commesse,
            personale e qualità ISO: Gausio unisce tutti i processi della tua
            azienda in un&apos;unica piattaforma collegata.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }))}>
              Inizia gratis
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="#funzionalita"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Scopri le funzionalità
            </Link>
          </div>
          <dl className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <dt className="order-2 text-sm text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="order-1 text-3xl font-bold text-primary">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Funzionalità */}
      <section id="funzionalita" className="scroll-mt-20 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Tutti i moduli di cui hai bisogno
            </h2>
            <p className="mt-3 text-muted-foreground">
              Ogni modulo è collegato agli altri: crea un cliente direttamente
              dal form della commessa, collega fatture agli ordini, scarica il
              magazzino dai DDT.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <feature.icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="border-y bg-card/50 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Come funziona</h2>
            <p className="mt-3 text-muted-foreground">
              Dalla registrazione al team operativo in meno di dieci minuti.
            </p>
          </div>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.title}
                className="flex flex-col items-center gap-3 rounded-xl border bg-background p-8 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon aria-hidden className="size-5" />
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Prezzi */}
      <section id="prezzi" className="scroll-mt-20 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Prezzi semplici e trasparenti
            </h2>
            <p className="mt-3 text-muted-foreground">
              Parti gratis, cresci quando vuoi. Nessun costo nascosto.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "flex flex-col gap-6 rounded-xl border bg-card p-8",
                  plan.highlight &&
                    "relative border-primary shadow-lg shadow-primary/10"
                )}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-transparent">
                    Più scelto
                  </Badge>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>{" "}
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </p>
                </div>
                <ul className="flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-success"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Enterprise" ? "/contatti" : "/sign-in"}
                  className={cn(
                    buttonVariants({
                      variant: plan.highlight ? "default" : "outline",
                      size: "lg",
                    }),
                    "w-full"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonianze */}
      <section className="border-y bg-card/50 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Le aziende che ci hanno scelto
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="flex flex-col gap-4 rounded-xl border bg-background p-6"
              >
                <Quote aria-hidden className="size-6 text-primary/40" />
                <blockquote className="flex-1 text-sm leading-6 text-muted-foreground">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Domande frequenti
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA finale */}
      <section className="pb-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-chart-2 px-8 py-16 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold tracking-tight">
              Pronto a mettere ordine nella tua azienda?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Crea il tuo workspace gratuito: bastano due minuti, senza carta di
              credito.
            </p>
            <div className="mt-8">
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "bg-white text-primary hover:bg-white/90"
                )}
              >
                Inizia gratis ora
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
