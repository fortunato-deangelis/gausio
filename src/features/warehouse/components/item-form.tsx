"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Button,
  EntitySelectField,
  FormError,
  FormGrid,
  NumberField,
  Spinner,
  TextField,
  TextareaField,
  type EntityOption,
} from "@/components/shared";
import { ContactQuickCreateDialog } from "@/features/contacts/components/contact-quick-create";
import { createItem, updateItem } from "../actions";
import { itemSchema, type ItemInput } from "../schema";

type ItemFormProps = Readonly<{
  supplierOptions: readonly EntityOption[];
  itemId?: string;
  initialValues?: ItemInput;
  onSaved?: () => void;
}>;

export function ItemForm({
  supplierOptions,
  itemId,
  initialValues,
  onSaved,
}: ItemFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: initialValues ?? {
      sku: "",
      name: "",
      description: "",
      category: "",
      unit: "pz",
      location: "",
      minStock: "",
      unitCost: "",
      unitPrice: "",
      supplierId: null,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = itemId
      ? await updateItem(itemId, values)
      : await createItem(values);
    if (result.ok) {
      toast.success(itemId ? "Articolo aggiornato." : "Articolo creato.");
      onSaved?.();
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormGrid>
        <TextField
          control={form.control}
          name="name"
          label="Nome"
          required
          placeholder="Nome articolo"
        />
        <TextField
          control={form.control}
          name="sku"
          label="SKU"
          description="Lascia vuoto per generarlo automaticamente."
        />
        <TextField control={form.control} name="category" label="Categoria" />
        <TextField
          control={form.control}
          name="unit"
          label="Unità di misura"
          required
        />
        <TextField
          control={form.control}
          name="location"
          label="Ubicazione"
          placeholder="Es. Scaffale A3"
        />
        <NumberField
          control={form.control}
          name="minStock"
          label="Scorta minima"
          min={0}
        />
        <NumberField
          control={form.control}
          name="unitCost"
          label="Costo unitario (€)"
          min={0}
        />
        <NumberField
          control={form.control}
          name="unitPrice"
          label="Prezzo di vendita (€)"
          min={0}
        />
        <EntitySelectField
          control={form.control}
          name="supplierId"
          label="Fornitore abituale"
          options={supplierOptions}
          placeholder="Nessun fornitore"
          quickCreateLabel="Nuovo fornitore"
          quickCreate={({ close, onCreated, initialQuery }) => (
            <ContactQuickCreateDialog
              initialName={initialQuery}
              kind="supplier"
              onCreated={onCreated}
              onClose={close}
            />
          )}
        />
      </FormGrid>
      <TextareaField control={form.control} name="description" label="Descrizione" />
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner className="size-4" />}
          {itemId ? "Salva modifiche" : "Crea articolo"}
        </Button>
      </div>
    </form>
  );
}
