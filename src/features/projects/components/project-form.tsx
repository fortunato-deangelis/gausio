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
import { JobQuickCreateDialog } from "@/features/jobs/components/job-quick-create";
import { createProject, updateProject } from "../actions";
import {
  PROJECT_STATUS_LABELS,
  projectSchema,
  projectStatuses,
  type ProjectInput,
} from "../schema";

type ProjectFormProps = Readonly<{
  projectId?: string;
  defaultValues?: Partial<ProjectInput>;
  clientOptions: EntityOption[];
  jobOptions: EntityOption[];
  memberOptions: SelectOption[];
  onSuccess?: (id: string) => void;
}>;

const statusOptions = projectStatuses.map((s) => ({
  value: s,
  label: PROJECT_STATUS_LABELS[s],
}));

export function ProjectForm({
  projectId,
  defaultValues,
  clientOptions,
  jobOptions,
  memberOptions,
  onSuccess,
}: ProjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      status: "planned",
      ...defaultValues,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = projectId
      ? await updateProject(projectId, values)
      : await createProject(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(projectId ? "Progetto aggiornato." : "Progetto creato.");
    if (onSuccess) {
      onSuccess(result.data.id);
    } else {
      router.push(`/app/progetti/${result.data.id}`);
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormGrid>
        <TextField control={form.control} name="name" label="Nome" required />
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
        <EntitySelectField
          control={form.control}
          name="jobId"
          label="Commessa"
          options={jobOptions}
          placeholder="Collega una commessa…"
          quickCreateLabel="Nuova commessa"
          quickCreate={({ close, onCreated, initialQuery }) => (
            <JobQuickCreateDialog
              initialTitle={initialQuery}
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
        <NumberField
          control={form.control}
          name="budgetHours"
          label="Budget ore"
          min={0}
        />
        <DateField control={form.control} name="startDate" label="Data inizio" />
        <DateField control={form.control} name="endDate" label="Data fine" />
      </FormGrid>
      <TextareaField
        control={form.control}
        name="description"
        label="Descrizione"
      />

      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner className="size-4" />}
          {projectId ? "Salva modifiche" : "Crea progetto"}
        </Button>
      </div>
    </form>
  );
}
