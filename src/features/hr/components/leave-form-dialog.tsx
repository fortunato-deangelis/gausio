"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/shared/toast";
import {
  AppDialog,
  Button,
  DateField,
  EntitySelectField,
  FormError,
  FormGrid,
  SelectField,
  Spinner,
  TextField,
  TextareaField,
  TimeField,
  type EntityOption,
} from "@/components/shared";
import { createLeaveRequest, updateLeaveRequest } from "../actions";
import { LEAVE_TYPES, leaveSchema, type LeaveInput } from "../schema";

type LeaveFormDialogProps = Readonly<{
  trigger: ReactNode;
  employees: EntityOption[];
  leave?: Readonly<{ id: string } & LeaveInput>;
}>;

const emptyValues: LeaveInput = {
  employeeId: "",
  type: "ferie",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  reason: "",
  protocolNumber: "",
};

/** Dialog di richiesta/modifica assenza (ferie, permesso, malattia). */
export function LeaveFormDialog({
  trigger,
  employees,
  leave,
}: LeaveFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LeaveInput>({
    resolver: zodResolver(leaveSchema),
    defaultValues: leave ?? emptyValues,
  });
  const type = useWatch({ control: form.control, name: "type" });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = leave
        ? await updateLeaveRequest(leave.id, values)
        : await createLeaveRequest(values);
      if (result.ok) {
        toast.success(leave ? "Richiesta aggiornata." : "Richiesta registrata.");
        setOpen(false);
        form.reset(leave ? values : emptyValues);
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
      title={leave ? "Modifica richiesta" : "Nuova richiesta di assenza"}
      description="Ferie, permessi orari o malattia."
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
          <SelectField
            control={form.control}
            name="type"
            label="Tipo"
            required
            options={LEAVE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
          <DateField control={form.control} name="startDate" label="Dal" required />
          <DateField control={form.control} name="endDate" label="Al" required />
          {type === "permesso" && (
            <>
              <TimeField control={form.control} name="startTime" label="Dalle ore" />
              <TimeField control={form.control} name="endTime" label="Alle ore" />
            </>
          )}
          {type === "malattia" && (
            <TextField
              control={form.control}
              name="protocolNumber"
              label="N. protocollo certificato"
              description="Numero di protocollo del certificato medico INPS."
            />
          )}
        </FormGrid>
        <TextareaField control={form.control} name="reason" label="Motivazione" />
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
            {leave ? "Salva modifiche" : "Registra richiesta"}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
