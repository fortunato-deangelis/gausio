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
  TimeField,
  type EntityOption,
} from "@/components/shared";
import { createTimeEntry, updateTimeEntry } from "../actions";
import { timeEntrySchema, type TimeEntryInput } from "../schema";

type TimeEntryFormDialogProps = Readonly<{
  trigger: ReactNode;
  employees: EntityOption[];
  entry?: Readonly<{ id: string } & TimeEntryInput>;
}>;

const emptyValues: TimeEntryInput = {
  employeeId: "",
  date: "",
  clockIn: "",
  clockOut: "",
  breakMinutes: "0",
  notes: "",
};

/** Dialog di registrazione/modifica timbratura. */
export function TimeEntryFormDialog({
  trigger,
  employees,
  entry,
}: TimeEntryFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TimeEntryInput>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: entry ?? emptyValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = entry
        ? await updateTimeEntry(entry.id, values)
        : await createTimeEntry(values);
      if (result.ok) {
        toast.success(entry ? "Timbratura aggiornata." : "Timbratura registrata.");
        setOpen(false);
        form.reset(entry ? values : emptyValues);
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
      title={entry ? "Modifica timbratura" : "Nuova timbratura"}
      description="Entrata, uscita e pausa della giornata."
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
          <DateField control={form.control} name="date" label="Data" required />
          <TimeField control={form.control} name="clockIn" label="Entrata" required />
          <TimeField control={form.control} name="clockOut" label="Uscita" />
          <NumberField
            control={form.control}
            name="breakMinutes"
            label="Pausa (minuti)"
            min={0}
            step="1"
          />
        </FormGrid>
        <TextareaField control={form.control} name="notes" label="Note" />
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
            {entry ? "Salva modifiche" : "Registra timbratura"}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
