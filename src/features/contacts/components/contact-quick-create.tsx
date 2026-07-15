"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/shared/toast";
import {
  AppDialog,
  Button,
  FormError,
  SelectField,
  Spinner,
  TextField,
} from "@/components/shared";
import type { EntityOption } from "@/components/shared";
import { quickCreateContact } from "../actions";
import {
  CONTACT_KIND_LABELS,
  contactKinds,
  quickCreateContactSchema,
  type ContactKind,
  type QuickCreateContactInput,
} from "../schema";

type ContactQuickCreateDialogProps = Readonly<{
  initialName: string;
  kind: ContactKind;
  onCreated: (option: EntityOption) => void;
  onClose: () => void;
}>;

const kindOptions = contactKinds.map((k) => ({
  value: k,
  label: CONTACT_KIND_LABELS[k],
}));

/**
 * Creazione rapida di un contatto senza lasciare il form corrente
 * (collegamenti incrociati tra moduli). Contratto documentato in AGENTS.md.
 */
export function ContactQuickCreateDialog({
  initialName,
  kind,
  onCreated,
  onClose,
}: ContactQuickCreateDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<QuickCreateContactInput>({
    resolver: zodResolver(quickCreateContactSchema),
    defaultValues: { businessName: initialName, kind },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = await quickCreateContact(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Contatto creato.");
    onCreated({ value: result.data.id, label: result.data.businessName });
  });

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Nuovo contatto"
      description="Crea il contatto al volo: potrai completare l'anagrafica in seguito."
      size="sm"
    >
      <form
        onSubmit={(event) => {
          // Evita il submit del form esterno quando il dialog è annidato.
          event.stopPropagation();
          onSubmit(event);
        }}
        className="flex flex-col gap-4"
      >
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
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner className="size-4" />}
            Crea contatto
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
