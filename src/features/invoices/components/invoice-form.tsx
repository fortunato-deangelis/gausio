"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/shared/toast";
import {
  Button,
  DateField,
  EntitySelectField,
  FormError,
  FormGrid,
  SelectField,
  Spinner,
  TextField,
  TextareaField,
  type EntityOption,
} from "@/components/shared";
import {
  LineItemsEditor,
  type LinesControl,
} from "@/features/documents-shared/components/line-items-editor";
import { EMPTY_DOCUMENT_LINE } from "@/features/documents-shared/line-schema";
import { ContactQuickCreateDialog } from "@/features/contacts/components/contact-quick-create";
import { JobQuickCreateDialog } from "@/features/jobs/components/job-quick-create";
import { createInvoice, updateInvoice } from "../actions";
import {
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  invoiceSchema,
  type InvoiceInput,
} from "../schema";

type InvoiceFormProps = Readonly<{
  direction: "issued" | "received";
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  invoiceId?: string;
  initialValues?: InvoiceInput;
  onSaved?: () => void;
}>;

/** Editor fattura: testata + righe con totali live. */
export function InvoiceForm({
  direction,
  contactOptions,
  jobOptions,
  invoiceId,
  initialValues,
  onSaved,
}: InvoiceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const contactLabel = direction === "issued" ? "Cliente" : "Fornitore";
  const listPath =
    direction === "issued" ? "/app/vendite/fatture" : "/app/acquisti/fatture";

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialValues ?? {
      contactId: "",
      jobId: null,
      orderId: null,
      date: new Date().toISOString().slice(0, 10),
      dueDate: "",
      status: "draft",
      currency: "EUR",
      paymentMethod: "",
      paymentTerms: "",
      externalReference: "",
      notes: "",
      lines: [{ ...EMPTY_DOCUMENT_LINE }],
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = invoiceId
      ? await updateInvoice(invoiceId, values)
      : await createInvoice(direction, values);
    if (result.ok) {
      toast.success(invoiceId ? "Fattura aggiornata." : "Fattura creata.");
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
        <DateField control={form.control} name="dueDate" label="Scadenza" />
        <SelectField
          control={form.control}
          name="status"
          label="Stato"
          options={INVOICE_STATUS_OPTIONS}
        />
        <SelectField
          control={form.control}
          name="paymentMethod"
          label="Metodo di pagamento"
          options={PAYMENT_METHOD_OPTIONS}
          placeholder="Seleziona…"
        />
        <TextField
          control={form.control}
          name="paymentTerms"
          label="Condizioni di pagamento"
          placeholder="Es. 30 gg data fattura"
        />
        {direction === "received" && (
          <TextField
            control={form.control}
            name="externalReference"
            label="Riferimento fornitore"
            placeholder="Numero fattura del fornitore"
          />
        )}
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
          {invoiceId ? "Salva modifiche" : "Crea fattura"}
        </Button>
      </div>
    </form>
  );
}
