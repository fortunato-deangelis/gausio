"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/shared/toast";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  Target,
} from "lucide-react";
import {
  AppCard,
  Button,
  DetailList,
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
    icon: Target,
  },
  {
    title: "Profilo aziendale",
    subtitle: "Dati e contatti",
    icon: Building2,
  },
  {
    title: "Riepilogo",
    subtitle: "Controlla e crea",
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

/** Wizard di onboarding: questionario, profilo aziendale, riepilogo. */
export function OnboardingWizard() {
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

  const values = form.watch();

  return (
    <AppCard className="w-full rounded-[2px] bg-white shadow-sm">
      {/* Indicatore di step */}
      <ol
        className="mb-8 flex flex-col gap-3 border-b border-black/10 pb-6 sm:flex-row sm:items-center sm:gap-4"
        aria-label="Avanzamento"
      >
        {STEPS.map(({ title, subtitle, icon: Icon }, index) => {
          const state =
            index < step
              ? "completed"
              : index === step
                ? "current"
                : "upcoming";

          return (
            <li
              key={title}
              data-state={state}
              className="flex min-w-0 flex-1 items-center gap-3"
              aria-current={index === step ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-[2px] border transition-colors",
                  index < step
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === step
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                )}
              >
                {index < step ? (
                  <Check aria-hidden className="size-5" />
                ) : (
                  <Icon aria-hidden className="size-5" />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  className={cn(
                    "truncate text-base font-bold",
                    index === step
                      ? "text-primary"
                      : index < step
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {title}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {subtitle}
                </span>
              </span>
              {index < STEPS.length - 1 && (
                <ChevronRight
                  aria-hidden
                  className={cn(
                    "ml-auto size-5 shrink-0",
                    index < step ? "text-primary" : "text-muted-foreground/60"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        {step === 0 && (
          <>
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
          </>
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
          <DetailList
            items={[
              { label: "Ragione sociale", value: values.name || "—" },
              { label: "Partita IVA", value: values.vatNumber || "—" },
              { label: "Settore", value: labelOf(SECTORS, values.sector) },
              {
                label: "Dimensione",
                value: labelOf(SIZES, values.companySize),
              },
              { label: "Obiettivo", value: labelOf(GOALS, values.goal) },
              {
                label: "Città",
                value: values.city
                  ? `${values.city}${values.province ? ` (${values.province})` : ""}`
                  : "—",
              },
              { label: "Email", value: values.email || "—" },
              { label: "PEC", value: values.pec || "—" },
            ]}
          />
        )}

        <FormError message={error} />

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-black/10 pt-6 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0 || form.formState.isSubmitting}
            className="sm:min-w-36"
          >
            <ArrowLeft aria-hidden className="size-[18px]" />
            Indietro
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              key="continue"
              type="button"
              size="lg"
              onClick={(event) => {
                event.preventDefault();
                void next();
              }}
              className="sm:min-w-36"
            >
              Continua
              <ArrowRight aria-hidden className="size-[18px]" />
            </Button>
          ) : (
            <Button
              key="submit"
              type="submit"
              size="lg"
              disabled={form.formState.isSubmitting}
              className="sm:min-w-48"
            >
              {form.formState.isSubmitting && <Spinner className="size-4" />}
              Crea workspace
            </Button>
          )}
        </div>
      </form>
    </AppCard>
  );
}
