"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AppDialog,
  Button,
  FieldLegend,
  FieldSet,
  FormError,
  FormGrid,
  SelectField,
  Spinner,
  TextField,
  TextareaField,
  DateField,
  NumberField,
} from "@/components/shared";
import { createEmployee, updateEmployee } from "../actions";
import {
  CONTRACT_TYPES,
  EMPLOYEE_STATUSES,
  employeeSchema,
  type EmployeeInput,
} from "../schema";

type EmployeeDialogData = Readonly<{ id: string } & EmployeeInput>;

type EmployeeFormDialogProps = Readonly<{
  trigger: ReactNode;
  /** Se presente si è in modifica, altrimenti in creazione. */
  employee?: EmployeeDialogData;
}>;

const emptyValues: EmployeeInput = {
  firstName: "",
  lastName: "",
  fiscalCode: "",
  email: "",
  phone: "",
  birthDate: "",
  birthPlace: "",
  address: "",
  city: "",
  zipCode: "",
  province: "",
  jobTitle: "",
  department: "",
  contractType: "",
  hiredAt: "",
  terminatedAt: "",
  status: "active",
  hourlyCost: "",
  annualLeaveDays: "",
  notes: "",
};

/** Dialog di creazione/modifica dipendente. */
export function EmployeeFormDialog({
  trigger,
  employee,
}: EmployeeFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ?? emptyValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = employee
        ? await updateEmployee(employee.id, values)
        : await createEmployee(values);
      if (result.ok) {
        toast.success(employee ? "Dipendente aggiornato." : "Dipendente creato.");
        setOpen(false);
        form.reset(employee ? values : emptyValues);
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
      title={employee ? "Modifica dipendente" : "Nuovo dipendente"}
      description="Anagrafica e rapporto di lavoro del dipendente."
      size="xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <FieldSet>
          <FieldLegend>Anagrafica</FieldLegend>
          <FormGrid>
            <TextField control={form.control} name="firstName" label="Nome" required />
            <TextField control={form.control} name="lastName" label="Cognome" required />
            <TextField control={form.control} name="fiscalCode" label="Codice fiscale" />
            <DateField control={form.control} name="birthDate" label="Data di nascita" />
            <TextField control={form.control} name="birthPlace" label="Luogo di nascita" />
          </FormGrid>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Contatti e residenza</FieldLegend>
          <FormGrid>
            <TextField control={form.control} name="email" label="Email" type="email" />
            <TextField control={form.control} name="phone" label="Telefono" />
            <TextField control={form.control} name="address" label="Indirizzo" />
            <TextField control={form.control} name="city" label="Città" />
            <TextField control={form.control} name="zipCode" label="CAP" />
            <TextField control={form.control} name="province" label="Provincia" />
          </FormGrid>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Rapporto di lavoro</FieldLegend>
          <FormGrid>
            <TextField control={form.control} name="jobTitle" label="Mansione" />
            <TextField control={form.control} name="department" label="Reparto" />
            <SelectField
              control={form.control}
              name="contractType"
              label="Tipo contratto"
              options={CONTRACT_TYPES.map((c) => ({ value: c, label: c }))}
            />
            <SelectField
              control={form.control}
              name="status"
              label="Stato"
              required
              options={EMPLOYEE_STATUSES.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
            />
            <DateField control={form.control} name="hiredAt" label="Data assunzione" />
            <DateField control={form.control} name="terminatedAt" label="Data cessazione" />
            <NumberField
              control={form.control}
              name="hourlyCost"
              label="Costo orario (€)"
              min={0}
            />
            <NumberField
              control={form.control}
              name="annualLeaveDays"
              label="Giorni ferie annui"
              min={0}
            />
          </FormGrid>
          <TextareaField control={form.control} name="notes" label="Note" />
        </FieldSet>

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
            {employee ? "Salva modifiche" : "Crea dipendente"}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
