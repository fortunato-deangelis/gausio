"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/shared/toast";
import {
  Button,
  FormError,
  FormGrid,
  Spinner,
  TextField,
} from "@/components/shared";
import {
  updateWorkspaceSchema,
  type UpdateWorkspaceInput,
} from "../schema";
import { updateWorkspace } from "../actions";

type WorkspaceProfile = UpdateWorkspaceInput;

/** Form del profilo aziendale (impostazioni). */
export function WorkspaceProfileForm({
  initialValues,
  readOnly,
}: Readonly<{ initialValues: WorkspaceProfile; readOnly?: boolean }>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: initialValues,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = await updateWorkspace(values);
    if (result.ok) {
      toast.success("Profilo aziendale aggiornato.");
      router.refresh();
    } else {
      setError(result.error);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormGrid>
        <TextField
          control={form.control}
          name="name"
          label="Ragione sociale"
          required
          disabled={readOnly}
        />
        <TextField control={form.control} name="vatNumber" label="Partita IVA" disabled={readOnly} />
        <TextField control={form.control} name="fiscalCode" label="Codice fiscale" disabled={readOnly} />
        <TextField control={form.control} name="email" label="Email" type="email" disabled={readOnly} />
        <TextField control={form.control} name="phone" label="Telefono" disabled={readOnly} />
        <TextField control={form.control} name="pec" label="PEC" type="email" disabled={readOnly} />
        <TextField control={form.control} name="sdiCode" label="Codice SDI" disabled={readOnly} />
        <TextField control={form.control} name="address" label="Indirizzo" disabled={readOnly} />
        <TextField control={form.control} name="city" label="Città" disabled={readOnly} />
        <TextField control={form.control} name="zipCode" label="CAP" disabled={readOnly} />
        <TextField control={form.control} name="province" label="Provincia" disabled={readOnly} />
      </FormGrid>
      <FormError message={error} />
      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner className="size-4" />}
            Salva modifiche
          </Button>
        </div>
      )}
    </form>
  );
}
