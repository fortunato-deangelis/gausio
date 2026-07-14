"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  AppCard,
  Button,
  DetailList,
  FormError,
  FormGrid,
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

const STEPS = ["La tua azienda", "Profilo aziendale", "Riepilogo"] as const;

const STEP_FIELDS: Record<number, (keyof OnboardingInput)[]> = {
  0: ["sector", "companySize", "goal", "discoveryChannel"],
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
    <AppCard className="w-full max-w-2xl">
      {/* Indicatore di step */}
      <ol className="mb-6 flex items-center gap-2" aria-label="Avanzamento">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                index < step
                  ? "bg-primary text-primary-foreground"
                  : index === step
                    ? "bg-primary/15 text-primary ring-2 ring-primary"
                    : "bg-muted text-muted-foreground"
              )}
              aria-current={index === step ? "step" : undefined}
            >
              {index < step ? <Check aria-hidden className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:block",
                index === step ? "font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden className="h-px flex-1 bg-border" />
            )}
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {step === 0 && (
          <FormGrid>
            <SelectField
              control={form.control}
              name="sector"
              label="Settore"
              options={SECTORS}
              required
            />
            <SelectField
              control={form.control}
              name="companySize"
              label="Dimensione azienda"
              options={SIZES}
              required
            />
            <SelectField
              control={form.control}
              name="goal"
              label="Obiettivo principale"
              options={GOALS}
              required
            />
            <SelectField
              control={form.control}
              name="discoveryChannel"
              label="Come ci hai conosciuto?"
              options={CHANNELS}
            />
          </FormGrid>
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

        <div className="flex justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0 || form.formState.isSubmitting}
          >
            Indietro
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continua
            </Button>
          ) : (
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Spinner className="size-4" />}
              Crea workspace
            </Button>
          )}
        </div>
      </form>
    </AppCard>
  );
}
