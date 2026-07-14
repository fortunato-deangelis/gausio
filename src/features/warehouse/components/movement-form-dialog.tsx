"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AppDialog,
  Button,
  DateField,
  EntitySelectField,
  FormError,
  FormGrid,
  NumberField,
  SelectField,
  Spinner,
  TextField,
  type EntityOption,
} from "@/components/shared";
import { ContactQuickCreateDialog } from "@/features/contacts/components/contact-quick-create";
import { JobQuickCreateDialog } from "@/features/jobs/components/job-quick-create";
import { createMovement } from "../actions";
import {
  MOVEMENT_TYPE_OPTIONS,
  movementSchema,
  type MovementInput,
  type MovementType,
} from "../schema";
import { ItemQuickCreateDialog } from "./item-quick-create";

type MovementFormDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemOptions: readonly EntityOption[];
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  presetItemId?: string;
  presetType?: MovementType;
}>;

/** Dialog di registrazione movimento (carico/scarico/rettifica). */
export function MovementFormDialog({
  open,
  onOpenChange,
  itemOptions,
  contactOptions,
  jobOptions,
  presetItemId,
  presetType,
}: MovementFormDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MovementInput>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      itemId: presetItemId ?? "",
      type: presetType ?? "in",
      quantity: "",
      date: new Date().toISOString().slice(0, 10),
      reason: "",
      contactId: null,
      jobId: null,
    },
  });

  // Riallinea i preset quando il dialog viene riaperto per un'altra riga.
  useEffect(() => {
    if (open) {
      form.reset({
        itemId: presetItemId ?? "",
        type: presetType ?? "in",
        quantity: "",
        date: new Date().toISOString().slice(0, 10),
        reason: "",
        contactId: null,
        jobId: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetItemId, presetType]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = await createMovement(values);
    if (result.ok) {
      toast.success("Movimento registrato.");
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  });

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
      title="Nuovo movimento di magazzino"
      description="Carico, scarico o rettifica della giacenza."
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormGrid>
          <EntitySelectField
            control={form.control}
            name="itemId"
            label="Articolo"
            required
            clearable={false}
            options={itemOptions}
            placeholder="Seleziona articolo…"
            quickCreateLabel="Nuovo articolo"
            quickCreate={({ close, onCreated, initialQuery }) => (
              <ItemQuickCreateDialog
                initialName={initialQuery}
                onCreated={onCreated}
                onClose={close}
              />
            )}
          />
          <SelectField
            control={form.control}
            name="type"
            label="Tipo movimento"
            options={MOVEMENT_TYPE_OPTIONS}
          />
          <NumberField
            control={form.control}
            name="quantity"
            label="Quantità"
            required
            min={0}
            description="Per le rettifiche indica la nuova giacenza totale."
          />
          <DateField control={form.control} name="date" label="Data" required />
          <TextField
            control={form.control}
            name="reason"
            label="Causale"
            placeholder="Es. acquisto, reso, inventario…"
          />
          <EntitySelectField
            control={form.control}
            name="contactId"
            label="Contatto collegato"
            options={contactOptions}
            placeholder="Nessun contatto"
            quickCreateLabel="Nuovo contatto"
            quickCreate={({ close, onCreated, initialQuery }) => (
              <ContactQuickCreateDialog
                initialName={initialQuery}
                kind="both"
                onCreated={onCreated}
                onClose={close}
              />
            )}
          />
          <EntitySelectField
            control={form.control}
            name="jobId"
            label="Commessa collegata"
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
        </FormGrid>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner className="size-4" />}
            Registra movimento
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
