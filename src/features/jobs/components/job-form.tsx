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
  type SelectOption,
} from "@/components/shared";
import { ContactQuickCreateDialog } from "@/features/contacts/components/contact-quick-create";
import { createJob, updateJob } from "../actions";
import {
  JOB_STATUS_LABELS,
  jobSchema,
  jobStatuses,
  type JobInput,
} from "../schema";

type JobFormProps = Readonly<{
  jobId?: string;
  defaultValues?: Partial<JobInput>;
  clientOptions: EntityOption[];
  memberOptions: SelectOption[];
  onSuccess?: (id: string) => void;
}>;

const statusOptions = jobStatuses.map((s) => ({
  value: s,
  label: JOB_STATUS_LABELS[s],
}));

export function JobForm({
  jobId,
  defaultValues,
  clientOptions,
  memberOptions,
  onSuccess,
}: JobFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      status: "open",
      ...defaultValues,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = jobId
      ? await updateJob(jobId, values)
      : await createJob(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(jobId ? "Commessa aggiornata." : "Commessa creata.");
    if (onSuccess) {
      onSuccess(result.data.id);
    } else {
      router.push(`/app/commesse/${result.data.id}`);
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormGrid>
        <TextField
          control={form.control}
          name="title"
          label="Titolo"
          required
        />
        <SelectField
          control={form.control}
          name="status"
          label="Stato"
          options={statusOptions}
          required
        />
        <EntitySelectField
          control={form.control}
          name="clientId"
          label="Cliente"
          options={clientOptions}
          placeholder="Seleziona il cliente…"
          quickCreateLabel="Nuovo cliente"
          quickCreate={({ close, onCreated, initialQuery }) => (
            <ContactQuickCreateDialog
              initialName={initialQuery}
              kind="client"
              onCreated={onCreated}
              onClose={close}
            />
          )}
        />
        <SelectField
          control={form.control}
          name="managerId"
          label="Responsabile"
          options={memberOptions}
          placeholder="Seleziona il responsabile…"
        />
        <DateField control={form.control} name="startDate" label="Data inizio" />
        <DateField control={form.control} name="endDate" label="Data fine" />
        <NumberField
          control={form.control}
          name="budgetAmount"
          label="Budget (€)"
          min={0}
        />
        <NumberField
          control={form.control}
          name="estimatedHours"
          label="Ore stimate"
          min={0}
        />
      </FormGrid>
      <TextareaField
        control={form.control}
        name="description"
        label="Descrizione"
      />
      <TextareaField control={form.control} name="notes" label="Note" />

      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner className="size-4" />}
          {jobId ? "Salva modifiche" : "Crea commessa"}
        </Button>
      </div>
    </form>
  );
}
