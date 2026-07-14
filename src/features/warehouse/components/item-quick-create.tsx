"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AppDialog,
  Button,
  Field,
  FieldLabel,
  Input,
  Spinner,
  type EntityOption,
} from "@/components/shared";
import { quickCreateItem } from "../actions";

type ItemQuickCreateDialogProps = Readonly<{
  initialName: string;
  onCreated: (option: EntityOption) => void;
  onClose: () => void;
}>;

/**
 * Quick-create articolo di magazzino: crea l'articolo con la sola
 * denominazione (SKU generato) senza lasciare il form corrente.
 */
export function ItemQuickCreateDialog({
  initialName,
  onCreated,
  onClose,
}: ItemQuickCreateDialogProps) {
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Inserisci il nome dell'articolo.");
      return;
    }
    setPending(true);
    const result = await quickCreateItem({ name: name.trim() });
    setPending(false);
    if (result.ok) {
      toast.success("Articolo creato.");
      onCreated({
        value: result.data.id,
        label: `${result.data.sku} — ${result.data.name}`,
      });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Nuovo articolo"
      description="Crea rapidamente un articolo di magazzino; potrai completarne i dettagli in seguito."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Annulla
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Spinner className="size-4" />}
            Crea articolo
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="quick-item-name">Nome articolo</FieldLabel>
        <Input
          id="quick-item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Es. Vite M6x20"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </Field>
    </AppDialog>
  );
}
