"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AppDialog,
  Button,
  FormError,
  Spinner,
  TextField,
} from "@/components/shared";
import type { EntityOption } from "@/components/shared";
import { quickCreateJob } from "../actions";
import { quickCreateJobSchema, type QuickCreateJobInput } from "../schema";

type JobQuickCreateDialogProps = Readonly<{
  initialTitle: string;
  onCreated: (option: EntityOption) => void;
  onClose: () => void;
}>;

/**
 * Creazione rapida di una commessa senza lasciare il form corrente.
 * Contratto documentato in AGENTS.md.
 */
export function JobQuickCreateDialog({
  initialTitle,
  onCreated,
  onClose,
}: JobQuickCreateDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<QuickCreateJobInput>({
    resolver: zodResolver(quickCreateJobSchema),
    defaultValues: { title: initialTitle },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = await quickCreateJob(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(`Commessa ${result.data.code} creata.`);
    onCreated({
      value: result.data.id,
      label: `${result.data.code} — ${result.data.title}`,
    });
  });

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Nuova commessa"
      description="Crea la commessa al volo: potrai completarla in seguito."
      size="sm"
    >
      <form
        onSubmit={(event) => {
          event.stopPropagation();
          onSubmit(event);
        }}
        className="flex flex-col gap-4"
      >
        <TextField
          control={form.control}
          name="title"
          label="Titolo"
          required
        />
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner className="size-4" />}
            Crea commessa
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
