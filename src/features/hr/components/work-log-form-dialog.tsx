"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/shared/toast";
import {
  AppDialog,
  Button,
  DateField,
  EntitySelectField,
  FormError,
  FormGrid,
  NumberField,
  Spinner,
  TextareaField,
  type EntityOption,
} from "@/components/shared";
import { JobQuickCreateDialog } from "@/features/jobs/components/job-quick-create";
import { createWorkLog, updateWorkLog } from "../actions";
import { workLogSchema, type WorkLogInput } from "../schema";

type WorkLogFormDialogProps = Readonly<{
  trigger: ReactNode;
  employees: EntityOption[];
  jobs: EntityOption[];
  log?: Readonly<{ id: string } & WorkLogInput>;
}>;

const emptyValues: WorkLogInput = {
  employeeId: "",
  jobId: "",
  date: "",
  hours: "",
  description: "",
};

/** Dialog scheda lavoro: ore di un dipendente imputate a una commessa. */
export function WorkLogFormDialog({
  trigger,
  employees,
  jobs,
  log,
}: WorkLogFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<WorkLogInput>({
    resolver: zodResolver(workLogSchema),
    defaultValues: log ?? emptyValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = log
        ? await updateWorkLog(log.id, values)
        : await createWorkLog(values);
      if (result.ok) {
        toast.success(log ? "Scheda aggiornata." : "Scheda registrata.");
        setOpen(false);
        form.reset(log ? values : emptyValues);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  });

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
      trigger={trigger}
      title={log ? "Modifica scheda lavoro" : "Nuova scheda lavoro"}
      description="Ore lavorate su una commessa."
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormGrid>
          <EntitySelectField
            control={form.control}
            name="employeeId"
            label="Dipendente"
            required
            options={employees}
            placeholder="Seleziona dipendente…"
            clearable={false}
          />
          <EntitySelectField
            control={form.control}
            name="jobId"
            label="Commessa"
            required
            options={jobs}
            placeholder="Seleziona commessa…"
            clearable={false}
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
          <NumberField
            control={form.control}
            name="hours"
            label="Ore"
            required
            min={0}
            step="0.5"
          />
        </FormGrid>
        <TextareaField
          control={form.control}
          name="description"
          label="Descrizione attività"
        />
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner className="size-4" />}
            {log ? "Salva modifiche" : "Registra scheda"}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
