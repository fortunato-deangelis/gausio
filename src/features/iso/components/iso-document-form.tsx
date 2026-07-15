"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
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
import { createIsoDocument, updateIsoDocument } from "../actions";
import {
  ISO_STANDARDS,
  ISO_STATUSES,
  ISO_TYPES,
  isoDocumentSchema,
  type IsoDocumentInput,
} from "../schema";

type IsoDocumentFormProps = Readonly<{
  members: EntityOption[];
  /** Se presente si è in modifica. */
  document?: Readonly<{ id: string } & IsoDocumentInput>;
  onDone?: () => void;
}>;

const emptyValues: IsoDocumentInput = {
  code: "",
  title: "",
  standard: "iso9001",
  type: "procedura",
  status: "draft",
  content: "",
  issueDate: "",
  reviewDate: "",
  ownerId: "",
  notes: "",
  changeDescription: "",
};

/** Form documento/procedura ISO con storico revisioni sul contenuto. */
export function IsoDocumentForm({
  members,
  document,
  onDone,
}: IsoDocumentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<IsoDocumentInput>({
    resolver: zodResolver(isoDocumentSchema),
    defaultValues: document ?? emptyValues,
  });
  const content = useWatch({ control: form.control, name: "content" });
  const contentChanged = Boolean(
    document && (document.content ?? "") !== (content ?? "")
  );

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = document
        ? await updateIsoDocument(document.id, values)
        : await createIsoDocument(values);
      if (result.ok) {
        toast.success(document ? "Documento aggiornato." : "Documento creato.");
        if (onDone) {
          onDone();
        } else if (!document && "data" in result && result.data) {
          router.push(`/app/iso/${result.data.id}`);
        }
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormGrid>
        <TextField
          control={form.control}
          name="code"
          label="Codice"
          placeholder="PRO-01"
          required
        />
        <TextField control={form.control} name="title" label="Titolo" required />
        <SelectField
          control={form.control}
          name="standard"
          label="Norma"
          required
          options={ISO_STANDARDS.map((s) => ({ value: s.value, label: s.label }))}
        />
        <SelectField
          control={form.control}
          name="type"
          label="Tipo documento"
          required
          options={ISO_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
        <SelectField
          control={form.control}
          name="status"
          label="Stato"
          required
          options={ISO_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        />
        <EntitySelectField
          control={form.control}
          name="ownerId"
          label="Responsabile"
          options={members}
          placeholder="Seleziona responsabile…"
        />
        <DateField control={form.control} name="issueDate" label="Data emissione" />
        <DateField control={form.control} name="reviewDate" label="Prossimo riesame" />
      </FormGrid>

      <TextareaField
        control={form.control}
        name="content"
        label="Contenuto"
        description="Testo della procedura/documento. Supporta Markdown."
        rows={14}
      />
      {contentChanged && (
        <TextareaField
          control={form.control}
          name="changeDescription"
          label="Descrizione della modifica"
          description="Obbligatoria: verrà registrata nello storico revisioni e la revisione sarà incrementata."
          required
        />
      )}
      <TextareaField control={form.control} name="notes" label="Note" />

      <FormError message={error} />
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={pending}
          >
            Annulla
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending && <Spinner className="size-4" />}
          {document ? "Salva modifiche" : "Crea documento"}
        </Button>
      </div>
    </form>
  );
}
