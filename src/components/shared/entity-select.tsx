"use client";

import { useState, type ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Select ricercabile di entità collegate (cliente, fornitore, commessa…)
 * con "quick create" integrato: se l'entità non esiste ancora, la si crea
 * senza lasciare il form corrente. È il mattone dei collegamenti
 * incrociati tra moduli.
 */

export type EntityOption = Readonly<{
  value: string;
  label: string;
  description?: string;
}>;

type QuickCreateRender = (args: {
  /** Chiudere il dialog di quick-create. */
  close: () => void;
  /** Notificare la creazione: seleziona la nuova entità nel campo. */
  onCreated: (option: EntityOption) => void;
  /** Testo digitato nella ricerca, utile come valore iniziale. */
  initialQuery: string;
}) => ReactNode;

type EntitySelectProps = Readonly<{
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: readonly EntityOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  clearable?: boolean;
  /** Etichetta dell'azione di creazione rapida, es. "Nuovo cliente". */
  quickCreateLabel?: string;
  /** Contenuto del dialog di creazione rapida. */
  quickCreate?: QuickCreateRender;
  id?: string;
  "aria-invalid"?: boolean;
}>;

export function EntitySelect({
  value,
  onChange,
  options,
  placeholder = "Seleziona…",
  searchPlaceholder = "Cerca…",
  emptyMessage = "Nessun risultato.",
  disabled,
  clearable = true,
  quickCreateLabel = "Crea nuovo",
  quickCreate,
  id,
  "aria-invalid": ariaInvalid,
}: EntitySelectProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  // Opzioni create al volo, non ancora presenti nei dati del server.
  const [extraOptions, setExtraOptions] = useState<EntityOption[]>([]);

  const allOptions = [
    ...extraOptions.filter((e) => !options.some((o) => o.value === e.value)),
    ...options,
  ];
  const selected = allOptions.find((o) => o.value === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className={cn(!selected && "text-muted-foreground", "truncate")}>
              {selected?.label ?? placeholder}
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] min-w-64 p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {allOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.description ?? ""}`}
                    onSelect={() => {
                      onChange(
                        clearable && option.value === value ? null : option.value
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      aria-hidden
                      className={cn(
                        "size-4",
                        option.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {quickCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup forceMount>
                    <CommandItem
                      forceMount
                      value={`__create__ ${query}`}
                      onSelect={() => {
                        setOpen(false);
                        setCreating(true);
                      }}
                    >
                      <Plus aria-hidden className="size-4" />
                      {quickCreateLabel}
                      {query && (
                        <span className="text-muted-foreground">
                          “{query}”
                        </span>
                      )}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {quickCreate &&
        creating &&
        quickCreate({
          close: () => setCreating(false),
          onCreated: (option) => {
            setExtraOptions((prev) => [option, ...prev]);
            onChange(option.value);
            setCreating(false);
          },
          initialQuery: query,
        })}
    </>
  );
}

type EntitySelectFieldProps<T extends FieldValues> = Readonly<{
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  required?: boolean;
}> &
  Omit<EntitySelectProps, "value" | "onChange" | "id" | "aria-invalid">;

/** Variante integrata con react-hook-form. */
export function EntitySelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  ...selectProps
}: EntitySelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {required && <span aria-hidden> *</span>}
          </FieldLabel>
          <EntitySelect
            {...selectProps}
            id={field.name}
            value={field.value ?? null}
            onChange={field.onChange}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </Field>
      )}
    />
  );
}
