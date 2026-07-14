"use client";

import {
  Controller,
  useFieldArray,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  EntitySelect,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type EntityOption,
} from "@/components/shared";
import { ItemQuickCreateDialog } from "@/features/warehouse/components/item-quick-create";
import { EMPTY_DDT_LINE, type DdtLineInput } from "../schema";

/**
 * Editor righe DDT: ogni riga può essere collegata a un articolo di
 * magazzino (con quick-create); alla selezione descrizione e unità vengono
 * precompilate.
 */

export type DdtLinesValues = { lines: DdtLineInput[] };
export type DdtLinesControl = Control<DdtLinesValues>;
export type DdtLinesSetValue = UseFormSetValue<DdtLinesValues>;

export type DdtItemInfo = Readonly<{
  id: string;
  sku: string;
  name: string;
  unit: string;
}>;

type DdtLinesEditorProps = Readonly<{
  control: DdtLinesControl;
  setValue: DdtLinesSetValue;
  itemOptions: readonly EntityOption[];
  itemInfos: readonly DdtItemInfo[];
}>;

export function DdtLinesEditor({
  control,
  setValue,
  itemOptions,
  itemInfos,
}: DdtLinesEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  const onItemSelected = (index: number, itemId: string | null) => {
    setValue(`lines.${index}.itemId`, itemId);
    if (itemId) {
      const info = itemInfos.find((i) => i.id === itemId);
      if (info) {
        setValue(`lines.${index}.description`, info.name);
        setValue(`lines.${index}.unit`, info.unit);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-52">Articolo (opzionale)</TableHead>
              <TableHead className="min-w-56">Descrizione</TableHead>
              <TableHead className="w-24">Q.tà</TableHead>
              <TableHead className="w-20">Unità</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Controller
                    control={control}
                    name={`lines.${index}.itemId`}
                    render={({ field: f }) => (
                      <EntitySelect
                        value={f.value ?? null}
                        onChange={(value) => onItemSelected(index, value)}
                        options={itemOptions}
                        placeholder="Riga libera"
                        quickCreateLabel="Nuovo articolo"
                        quickCreate={({ close, onCreated, initialQuery }) => (
                          <ItemQuickCreateDialog
                            initialName={initialQuery}
                            onClose={close}
                            onCreated={(option) => {
                              onCreated(option);
                            }}
                          />
                        )}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    control={control}
                    name={`lines.${index}.description`}
                    render={({ field: f, fieldState }) => (
                      <Input
                        {...f}
                        value={f.value ?? ""}
                        placeholder="Descrizione merce"
                        aria-label={`Descrizione riga ${index + 1}`}
                        aria-invalid={fieldState.invalid}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    control={control}
                    name={`lines.${index}.quantity`}
                    render={({ field: f, fieldState }) => (
                      <Input
                        {...f}
                        value={f.value ?? ""}
                        type="number"
                        step="any"
                        min={0}
                        aria-label={`Quantità riga ${index + 1}`}
                        aria-invalid={fieldState.invalid}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    control={control}
                    name={`lines.${index}.unit`}
                    render={({ field: f }) => (
                      <Input
                        {...f}
                        value={f.value ?? ""}
                        aria-label={`Unità riga ${index + 1}`}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Rimuovi riga ${index + 1}`}
                    className="text-destructive hover:text-destructive"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ ...EMPTY_DDT_LINE })}
      >
        <Plus className="size-4" />
        Aggiungi riga
      </Button>
    </div>
  );
}
