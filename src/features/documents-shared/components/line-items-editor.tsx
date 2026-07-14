"use client";

import { Controller, useFieldArray, useWatch, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared";
import { formatCurrency } from "@/lib/format";
import {
  EMPTY_DOCUMENT_LINE,
  type DocumentLineInput,
} from "../line-schema";
import { computeLineTotal, computeTotals, VAT_RATE_OPTIONS } from "../totals";

/**
 * Editor righe riusabile per ordini e fatture. Il form padre deve avere un
 * campo `lines: DocumentLineInput[]` e passare il proprio `control`
 * (castato a `LinesControl`).
 */

export type DocumentWithLines = { lines: DocumentLineInput[] };
export type LinesControl = Control<DocumentWithLines>;

export function LineItemsEditor({ control }: Readonly<{ control: LinesControl }>) {
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = useWatch({ control, name: "lines" }) ?? [];
  const totals = computeTotals(lines);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-56">Descrizione</TableHead>
              <TableHead className="w-24">Q.tà</TableHead>
              <TableHead className="w-20">Unità</TableHead>
              <TableHead className="w-32">Prezzo unit.</TableHead>
              <TableHead className="w-24">IVA</TableHead>
              <TableHead className="w-24">Sconto %</TableHead>
              <TableHead className="w-28 text-right">Totale</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Controller
                    control={control}
                    name={`lines.${index}.description`}
                    render={({ field: f, fieldState }) => (
                      <Input
                        {...f}
                        value={f.value ?? ""}
                        placeholder="Descrizione articolo o servizio"
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
                  <Controller
                    control={control}
                    name={`lines.${index}.unitPrice`}
                    render={({ field: f, fieldState }) => (
                      <Input
                        {...f}
                        value={f.value ?? ""}
                        type="number"
                        step="any"
                        min={0}
                        aria-label={`Prezzo unitario riga ${index + 1}`}
                        aria-invalid={fieldState.invalid}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    control={control}
                    name={`lines.${index}.vatRate`}
                    render={({ field: f }) => (
                      <Select value={f.value ?? "22"} onValueChange={f.onChange}>
                        <SelectTrigger
                          aria-label={`Aliquota IVA riga ${index + 1}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VAT_RATE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    control={control}
                    name={`lines.${index}.discount`}
                    render={({ field: f, fieldState }) => (
                      <Input
                        {...f}
                        value={f.value ?? ""}
                        type="number"
                        step="any"
                        min={0}
                        max={100}
                        aria-label={`Sconto riga ${index + 1}`}
                        aria-invalid={fieldState.invalid}
                      />
                    )}
                  />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(computeLineTotal(lines[index] ?? EMPTY_DOCUMENT_LINE))}
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

      <div className="flex flex-wrap items-start justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...EMPTY_DOCUMENT_LINE })}
        >
          <Plus className="size-4" />
          Aggiungi riga
        </Button>

        <dl className="ml-auto grid w-full max-w-56 gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Imponibile</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(totals.subtotal)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">IVA</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(totals.vatAmount)}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-1 text-base">
            <dt className="font-semibold">Totale</dt>
            <dd className="font-semibold tabular-nums">
              {formatCurrency(totals.total)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
