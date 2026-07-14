import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { AppCard } from "@/components/shared";
import { ContactForm } from "@/features/marketing/components/contact-form";

export const metadata: Metadata = {
  title: "Contatti",
  description:
    "Contatta il team di Gausio: richieste commerciali, supporto e informazioni.",
};

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "info@gausio.example",
  },
  {
    icon: Phone,
    label: "Telefono",
    value: "+39 06 1234 5678",
  },
  {
    icon: MapPin,
    label: "Sede",
    value: "Via dell'Innovazione 42, 00100 Roma",
  },
  {
    icon: Clock,
    label: "Orari",
    value: "Lun–Ven, 9:00–18:00",
  },
] as const;

export default function ContattiPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Parliamone</h1>
        <p className="mt-3 text-muted-foreground">
          Hai domande su Gausio, vuoi una demo o hai bisogno di supporto?
          Compila il modulo e ti risponderemo entro un giorno lavorativo.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AppCard title="Scrivici" description="Tutti i campi con * sono obbligatori.">
          <ContactForm />
        </AppCard>

        <div className="flex flex-col gap-4">
          {CONTACT_INFO.map((info) => (
            <div
              key={info.label}
              className="flex items-start gap-3 rounded-xl border bg-card p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <info.icon aria-hidden className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{info.label}</p>
                <p className="text-sm text-muted-foreground">{info.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
