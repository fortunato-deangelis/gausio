"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Button,
  EntitySelectField,
  FormError,
  FormGrid,
  SelectField,
  Spinner,
  TextareaField,
  DateField,
  type EntityOption,
} from "@/components/shared";
import {
  LineItemsEditor,
  type LinesControl,
} from "@/features/documents-shared/components/line-items-editor";
import { EMPTY_DOCUMENT_LINE } from "@/features/documents-shared/line-schema";
import { ContactQuickCreateDialog } from "@/features/contacts/components/contact-quick-create";
import { JobQuickCreateDialog } from "@/features/jobs/components/job-quick-create";
import { createOrder, updateOrder } from "../actions";
import { ORDER_STATUS_OPTIONS, orderSchema, type OrderInput } from "../schema";

type OrderFormProps = Readonly<{
  direction: "issued" | "received";
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  /** Presente in modifica. */
  orderId?: string;
  initialValues?: OrderInput;
  onSaved?: () => void;
}>;

export function OrderForm({
  direction,
  contactOptions,
  jobOptions,
  orderId,
  initialValues,
  onSaved,
}: OrderFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const contactLabel = direction === "issued" ? "Cliente" : "Fornitore";
  const listPath =
    direction === "issued" ? "/app/vendite/ordini" : "/app/acquisti/ordini";

  const form = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: initialValues ?? {
      contactId: "",
      jobId: null,
      date: new Date().toISOString().slice(0, 10),
      expectedDate: "",
      status: "draft",
      currency: "EUR",
      notes: "",
      lines: [{ ...EMPTY_DOCUMENT_LINE }],
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = orderId
      ? await updateOrder(orderId, values)
      : await createOrder(direction, values);
    if (result.ok) {
      toast.success(orderId ? "Ordine aggiornato." : "Ordine creato.");
      onSaved?.();
      router.push(`${listPath}/${result.data.id}`);
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
          quickCreateLabel={`Nuovo ${contactLabel.toLowerCase()}`}
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
        <DateField
          control={form.control}
          name="expectedDate"
          label="Data prevista"
        />
        <SelectField
          control={form.control}
          name="status"
          label="Stato"
          options={ORDER_STATUS_OPTIONS}
        />
      </FormGrid>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Righe</h2>
        <LineItemsEditor control={form.control as unknown as LinesControl} />
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
          onClick={() => (onSaved ? onSaved() : router.push(listPath))}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner className="size-4" />}
          {orderId ? "Salva modifiche" : "Crea ordine"}
        </Button>
      </div>
    </form>
  );
}
