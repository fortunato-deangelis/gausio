"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Button,
  DateField,
  EntitySelectField,
  FormError,
  FormGrid,
  NumberField,
  SelectField,
  Spinner,
  TextField,
  TextareaField,
  type EntityOption,
} from "@/components/shared";
import { ContactQuickCreateDialog } from "@/features/contacts/components/contact-quick-create";
import { JobQuickCreateDialog } from "@/features/jobs/components/job-quick-create";
import { createDdt, updateDdt } from "../actions";
import {
  DDT_STATUS_OPTIONS,
  EMPTY_DDT_LINE,
  TRANSPORT_REASON_OPTIONS,
  TRANSPORTED_BY_OPTIONS,
  ddtSchema,
  type DdtInput,
} from "../schema";
import {
  DdtLinesEditor,
  type DdtItemInfo,
  type DdtLinesControl,
  type DdtLinesSetValue,
} from "./ddt-lines-editor";

type DdtFormProps = Readonly<{
  direction: "issued" | "received";
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  itemOptions: readonly EntityOption[];
  itemInfos: readonly DdtItemInfo[];
  ddtId?: string;
  initialValues?: DdtInput;
  onSaved?: () => void;
}>;

export function DdtForm({
  direction,
  contactOptions,
  jobOptions,
  itemOptions,
  itemInfos,
  ddtId,
  initialValues,
  onSaved,
}: DdtFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const contactLabel = direction === "issued" ? "Destinatario" : "Mittente";

  const form = useForm<DdtInput>({
    resolver: zodResolver(ddtSchema),
    defaultValues: initialValues ?? {
      contactId: "",
      jobId: null,
      date: new Date().toISOString().slice(0, 10),
      status: "draft",
      transportReason: "Vendita",
      transportedBy: "Mittente",
      carrier: "",
      packagesCount: "",
      weight: "",
      destinationAddress: "",
      notes: "",
      lines: [{ ...EMPTY_DDT_LINE }],
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = ddtId
      ? await updateDdt(ddtId, values)
      : await createDdt(direction, values);
    if (result.ok) {
      toast.success(ddtId ? "DDT aggiornato." : "DDT creato.");
      onSaved?.();
      router.push(`/app/logistica/ddt/${result.data.id}`);
      router.refresh();
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormGrid>
        <EntitySelectField
          control={form.control}
          name="contactId"
          label={contactLabel}
          required
          clearable={false}
          options={contactOptions}
          placeholder={`Seleziona ${contactLabel.toLowerCase()}…`}
          quickCreateLabel="Nuovo contatto"
          quickCreate={({ close, onCreated, initialQuery }) => (
            <ContactQuickCreateDialog
              initialName={initialQuery}
              kind={direction === "issued" ? "client" : "supplier"}
              onCreated={onCreated}
              onClose={close}
            />
          )}
        />
        <EntitySelectField
          control={form.control}
          name="jobId"
          label="Commessa"
          options={jobOptions}
          placeholder="Nessuna commessa"
          quickCreateLabel="Nuova commessa"
          quickCreate={({ close, onCreated, initialQuery }) => (
            <JobQuickCreateDialog
              initialTitle={initialQuery}
              onCreated={onCreated}
              onClose={close}
            />
          )}
        />
        <DateField control={form.control} name="date" label="Data" required />
        <SelectField
          control={form.control}
          name="status"
          label="Stato"
          options={DDT_STATUS_OPTIONS}
        />
        <SelectField
          control={form.control}
          name="transportReason"
          label="Causale del trasporto"
          options={TRANSPORT_REASON_OPTIONS}
        />
        <SelectField
          control={form.control}
          name="transportedBy"
          label="Trasporto a cura di"
          options={TRANSPORTED_BY_OPTIONS}
        />
        <TextField
          control={form.control}
          name="carrier"
          label="Vettore"
          placeholder="Ragione sociale del vettore"
        />
        <NumberField
          control={form.control}
          name="packagesCount"
          label="Numero colli"
          min={0}
          step="1"
        />
        <TextField
          control={form.control}
          name="weight"
          label="Peso"
          placeholder="Es. 120 kg"
        />
        <TextField
          control={form.control}
          name="destinationAddress"
          label="Luogo di destinazione"
          placeholder="Indirizzo di consegna"
        />
      </FormGrid>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Righe merce</h2>
        <DdtLinesEditor
          control={form.control as unknown as DdtLinesControl}
          setValue={form.setValue as unknown as DdtLinesSetValue}
          itemOptions={itemOptions}
          itemInfos={itemInfos}
        />
        {form.formState.errors.lines?.message && (
          <FormError message={form.formState.errors.lines.message} />
        )}
      </div>

      <TextareaField control={form.control} name="notes" label="Note" />

      <FormError message={error} />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onSaved ? onSaved() : router.push("/app/logistica/ddt")
          }
        >
          Annulla
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner className="size-4" />}
          {ddtId ? "Salva modifiche" : "Crea DDT"}
        </Button>
      </div>
    </form>
  );
}
