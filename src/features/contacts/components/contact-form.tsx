"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/shared/toast";
import {
  Button,
  DateField,
  FieldLegend,
  FieldSet,
  FormError,
  FormGrid,
  SelectField,
  Spinner,
  TextField,
  TextareaField,
} from "@/components/shared";
import { createContact, updateContact } from "../actions";
import {
  CONTACT_KIND_LABELS,
  QUALIFICATION_LABELS,
  contactKinds,
  contactSchema,
  supplierQualifications,
  type ContactInput,
} from "../schema";

type ContactFormProps = Readonly<{
  /** Se presente, il form aggiorna il contatto esistente. */
  contactId?: string;
  defaultValues?: Partial<ContactInput>;
  /** Callback post-salvataggio (dialog); in sua assenza naviga al dettaglio. */
  onSuccess?: (id: string) => void;
}>;

const kindOptions = contactKinds.map((k) => ({
  value: k,
  label: CONTACT_KIND_LABELS[k],
}));

const qualificationOptions = supplierQualifications.map((q) => ({
  value: q,
  label: QUALIFICATION_LABELS[q],
}));

export function ContactForm({
  contactId,
  defaultValues,
  onSuccess,
}: ContactFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      businessName: "",
      kind: "client",
      ...defaultValues,
    },
  });

  const kind = form.watch("kind");
  const isSupplier = kind === "supplier" || kind === "both";

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = contactId
      ? await updateContact(contactId, values)
      : await createContact(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(contactId ? "Contatto aggiornato." : "Contatto creato.");
    if (onSuccess) {
      onSuccess(result.data.id);
    } else {
      router.push(`/app/contatti/${result.data.id}`);
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormGrid>
        <TextField
          control={form.control}
          name="businessName"
          label="Ragione sociale"
          required
        />
        <SelectField
          control={form.control}
          name="kind"
          label="Tipo"
          options={kindOptions}
          required
        />
        <TextField control={form.control} name="vatNumber" label="Partita IVA" />
        <TextField
          control={form.control}
          name="fiscalCode"
          label="Codice fiscale"
        />
        <TextField control={form.control} name="email" label="Email" type="email" />
        <TextField control={form.control} name="pec" label="PEC" type="email" />
        <TextField control={form.control} name="phone" label="Telefono" />
        <TextField control={form.control} name="website" label="Sito web" />
        <TextField control={form.control} name="address" label="Indirizzo" />
        <TextField control={form.control} name="city" label="Città" />
        <TextField control={form.control} name="zipCode" label="CAP" />
        <TextField control={form.control} name="province" label="Provincia" />
        <TextField control={form.control} name="sdiCode" label="Codice SDI" />
        <TextField control={form.control} name="iban" label="IBAN" />
        <TextField
          control={form.control}
          name="paymentTerms"
          label="Termini di pagamento"
          placeholder="Es. Bonifico 30 gg d.f."
        />
      </FormGrid>

      {isSupplier && (
        <FieldSet>
          <FieldLegend>Qualifica fornitore</FieldLegend>
          <FormGrid>
            <SelectField
              control={form.control}
              name="qualification"
              label="Stato qualifica"
              options={qualificationOptions}
            />
            <DateField
              control={form.control}
              name="qualificationDate"
              label="Data qualifica"
            />
            <DateField
              control={form.control}
              name="qualificationExpiry"
              label="Scadenza qualifica"
            />
            <TextareaField
              control={form.control}
              name="qualificationNotes"
              label="Note qualifica"
            />
          </FormGrid>
        </FieldSet>
      )}

      <TextareaField control={form.control} name="notes" label="Note" />

      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner className="size-4" />}
          {contactId ? "Salva modifiche" : "Crea contatto"}
        </Button>
      </div>
    </form>
  );
}
