"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/shared/toast";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  Target,
} from "lucide-react";
import {
  AppCard,
  Button,
  FormError,
  FormGrid,
  LegalConsent,
  SelectField,
  Spinner,
  TextField,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { onboardingSchema, type OnboardingInput } from "../schema";
import { createWorkspace } from "../actions";

const SECTORS = [
  { value: "manifatturiero", label: "Manifatturiero" },
  { value: "servizi", label: "Servizi" },
  { value: "edilizia", label: "Edilizia" },
  { value: "it", label: "IT e software" },
  { value: "commercio", label: "Commercio" },
  { value: "altro", label: "Altro" },
];

const SIZES = [
  { value: "1-9", label: "1–9 persone" },
  { value: "10-49", label: "10–49 persone" },
  { value: "50-249", label: "50–249 persone" },
  { value: "250+", label: "250+ persone" },
];

const GOALS = [
  { value: "fatturazione", label: "Fatturazione e ordini" },
  { value: "magazzino", label: "Magazzino e logistica" },
  { value: "commesse", label: "Commesse e progetti" },
  { value: "iso", label: "Qualità e certificazioni ISO" },
  { value: "tutto", label: "Gestione completa dell'azienda" },
];

const CHANNELS = [
  { value: "passaparola", label: "Passaparola" },
  { value: "ricerca", label: "Motore di ricerca" },
  { value: "social", label: "Social network" },
  { value: "evento", label: "Evento o fiera" },
  { value: "altro", label: "Altro" },
];

const STEPS = [
  {
    title: "La tua azienda",
    subtitle: "Esigenze e dimensioni",
    eyebrow: "Questionario",
    heading: "Raccontaci cosa deve semplificare Gausio",
    description:
      "A destra trovi le domande essenziali per preparare un workspace coerente con dimensione, settore e priorità operative.",
    icon: Target,
  },
  {
    title: "Profilo aziendale",
    subtitle: "Dati e contatti",
    eyebrow: "Anagrafica",
    heading: "Completa il profilo della tua azienda",
    description:
      "Questi dati iniziali verranno usati nelle schermate operative e nei documenti aziendali. Potrai completarli o modificarli anche dopo.",
    icon: Building2,
  },
  {
    title: "Riepilogo",
    subtitle: "Controlla e crea",
    eyebrow: "Conferma",
    heading: "Controlla il percorso di configurazione",
    description:
      "La timeline riassume quanto hai impostato finora. Se tutto torna, crea il workspace e passa alla dashboard.",
    icon: ClipboardCheck,
  },
] as const;

const STEP_FIELDS: Record<number, (keyof OnboardingInput)[]> = {
  0: ["sector", "companySize", "goal", "discoveryChannel", "termsAccepted"],
  1: [
    "name",
    "vatNumber",
    "fiscalCode",
    "address",
    "city",
    "zipCode",
    "province",
    "email",
    "phone",
    "pec",
    "sdiCode",
  ],
};

function labelOf(options: { value: string; label: string }[], value?: string) {
  return options.find((o) => o.value === value)?.label ?? "—";
}

type OnboardingWizardProps = Readonly<{
  isAdditionalWorkspace?: boolean;
}>;

/** Wizard di onboarding: questionario, profilo aziendale, riepilogo. */
export function OnboardingWizard({
  isAdditionalWorkspace = false,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      vatNumber: "",
      fiscalCode: "",
      address: "",
      city: "",
      zipCode: "",
      province: "",
      email: "",
      phone: "",
      pec: "",
      sdiCode: "",
      sector: "",
      companySize: "",
      goal: "",
      discoveryChannel: "",
      termsAccepted: false,
    },
  });

  const next = async () => {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = await createWorkspace(values);
    if (result.ok) {
      toast.success("Workspace creato! Benvenuto in Gausio.");
      router.push("/app");
      router.refresh();
    } else {
      setError(result.error);
    }
  });

  const values = useWatch({ control: form.control });
  const currentStep = STEPS[step];
  const CurrentIcon = currentStep.icon;
  const primaryCta =
    step < STEPS.length - 1
      ? "Continua"
      : form.formState.isSubmitting
        ? "Creazione in corso"
        : "Crea workspace";

  return (
    <AppCard
      className="w-full rounded-[2px] bg-white py-0 shadow-sm"
      contentClassName="p-0"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid min-h-155 lg:grid-cols-[minmax(300px,0.60fr)_minmax(0,1fr)]"
      >
        <aside className="flex min-h-105 flex-col justify-between gap-10 bg-[#f4f4f4] px-7 py-8 sm:px-10 lg:px-12 lg:py-12">
          <div>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
                disabled={form.formState.isSubmitting}
                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-50"
              >
                <ArrowLeft aria-hidden className="size-4" />
                Indietro
              </button>
            ) : (
              <div className="mb-5 h-5" aria-hidden />
            )}

            <div className="mb-8 flex size-12 items-center justify-center rounded-[2px] bg-primary text-primary-foreground">
              <CurrentIcon aria-hidden className="size-6" />
            </div>
            <p className="text-sm font-semibold text-primary">
              {isAdditionalWorkspace ? "Nuovo workspace" : currentStep.eyebrow}
            </p>
            <h1 className="mt-3 max-w-96 text-4xl font-bold leading-tight text-balance sm:text-5xl lg:text-6xl">
              {isAdditionalWorkspace && step === 0
                ? "Crea un nuovo workspace"
                : currentStep.heading}
            </h1>
            <p className="mt-5 max-w-88 text-base leading-7 text-muted-foreground">
              {isAdditionalWorkspace && step === 0
                ? "Stai creando un workspace aggiuntivo: sarai amministratore anche di questo."
                : currentStep.description}
            </p>
          </div>

          <div className="space-y-5">
            <FormError message={error} />
            {step < STEPS.length - 1 ? (
              <Button
                key="continue"
                type="button"
                size="lg"
                onClick={(event) => {
                  event.preventDefault();
                  void next();
                }}
                className="w-full"
              >
                {primaryCta}
                <ArrowRight aria-hidden className="size-4.5" />
              </Button>
            ) : (
              <Button
                key="submit"
                type="submit"
                size="lg"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting && <Spinner className="size-4" />}
                {primaryCta}
              </Button>
            )}
            <div
              className="flex items-center justify-center gap-2"
              aria-label="Avanzamento onboarding"
            >
              {STEPS.map(({ title }, index) => (
                <span
                  key={title}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === step
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/25"
                  )}
                  aria-current={index === step ? "step" : undefined}
                >
                  <span className="sr-only">
                    {title}
                    {index === step ? " (step corrente)" : ""}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 items-center px-6 py-8 sm:px-10 lg:px-12">
          <div className="w-full">
            {step === 0 && (
              <div className="space-y-6">
                <FormGrid>
                  <SelectField
                    control={form.control}
                    name="sector"
                    label="Settore"
                    description="Seleziona l'ambito principale in cui opera l'azienda."
                    options={SECTORS}
                    required
                  />
                  <SelectField
                    control={form.control}
                    name="companySize"
                    label="Dimensione azienda"
                    description="Indica il numero complessivo di persone nel team."
                    options={SIZES}
                    required
                  />
                  <SelectField
                    control={form.control}
                    name="goal"
                    label="Obiettivo principale"
                    description="Scegli il primo processo che vuoi rendere più semplice."
                    options={GOALS}
                    required
                  />
                  <SelectField
                    control={form.control}
                    name="discoveryChannel"
                    label="Come ci hai conosciuto?"
                    description="Questa informazione è facoltativa."
                    options={CHANNELS}
                  />
                </FormGrid>
                <Controller
                  control={form.control}
                  name="termsAccepted"
                  render={({ field, fieldState }) => (
                    <LegalConsent
                      id={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            )}

            {step === 1 && (
              <FormGrid>
                <TextField
                  control={form.control}
                  name="name"
                  label="Ragione sociale"
                  placeholder="Es. Rossi S.r.l."
                  required
                />
                <TextField control={form.control} name="vatNumber" label="Partita IVA" />
                <TextField control={form.control} name="fiscalCode" label="Codice fiscale" />
                <TextField control={form.control} name="email" label="Email aziendale" type="email" />
                <TextField control={form.control} name="phone" label="Telefono" />
                <TextField control={form.control} name="pec" label="PEC" type="email" />
                <TextField control={form.control} name="sdiCode" label="Codice SDI" />
                <TextField control={form.control} name="address" label="Indirizzo" />
                <TextField control={form.control} name="city" label="Città" />
                <TextField control={form.control} name="zipCode" label="CAP" />
                <TextField control={form.control} name="province" label="Provincia" />
              </FormGrid>
            )}

            {step === 2 && (
              <div className="mx-auto w-full max-w-2xl rounded-[2px] bg-white p-6 sm:p-8">
                <div className="mb-8">
                  <h2 className="text-xl font-bold">Riepilogo del percorso di onboarding</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Controlla le informazioni inserite e conferma per salire a bordo di Gausio. Potrai sempre modificare i dati in seguito.
                  </p>
                </div>

                <ol className="space-y-0">
                  {[
                    {
                      title: "Questionario completato",
                      meta: "Completato",
                      description: `${labelOf(SECTORS, values.sector)} · ${labelOf(
                        SIZES,
                        values.companySize
                      )} · ${labelOf(GOALS, values.goal)}`,
                      state: "done",
                    },
                    {
                      title: "Profilo aziendale",
                      meta: values.name || "Da verificare",
                      description: [
                        values.vatNumber ? `P. IVA ${values.vatNumber}` : null,
                        values.email || null,
                        values.city
                          ? `${values.city}${values.province ? ` (${values.province})` : ""}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "I dati principali sono pronti per essere salvati.",
                      state: "done",
                    },
                    {
                      title: "Canale di scoperta",
                      meta: values.discoveryChannel ? "Indicazione ricevuta" : "Facoltativo",
                      description:
                        values.discoveryChannel
                          ? labelOf(CHANNELS, values.discoveryChannel)
                          : "Potrai aggiungere questa informazione in seguito.",
                      state: values.discoveryChannel ? "done" : "idle",
                    },
                    {
                      title: "Crea workspace",
                      meta: "Pronto",
                      description:
                        "Conferma per creare lo spazio di lavoro e aprire la dashboard.",
                      state: "current",
                    },
                  ].map((item, index, items) => (
                    <li key={item.title} className="relative flex gap-5 pb-8 last:pb-0">
                      {index < items.length - 1 && (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-3 top-7 h-[calc(100%-1.25rem)] w-px",
                            item.state === "idle"
                              ? "border-l border-dashed border-border"
                              : "bg-border"
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-white",
                          item.state === "current"
                            ? "border-primary text-primary"
                            : item.state === "done"
                              ? "border-foreground text-foreground"
                              : "border-border text-muted-foreground"
                        )}
                      >
                        {item.state === "done" ? (
                          <Check aria-hidden className="size-3.5" />
                        ) : (
                          <span
                            aria-hidden
                            className={cn(
                              "size-2 rounded-full",
                              item.state === "current"
                                ? "bg-primary"
                                : "bg-muted-foreground/40"
                            )}
                          />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <h3 className="text-base font-bold">{item.title}</h3>
                          <span className="text-sm text-muted-foreground">
                            · {item.meta}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      </form>
    </AppCard>
  );
}
