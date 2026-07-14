"use client";

import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Campi form controllati (react-hook-form + primitivi shadcn "field").
 * Ogni campo gestisce label, descrizione ed errore in modo uniforme.
 */

type BaseFieldProps<T extends FieldValues> = Readonly<{
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}>;

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  type = "text",
}: BaseFieldProps<T> & { type?: string }) {
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
          <Input
            {...field}
            id={field.name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            value={field.value ?? ""}
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

export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  step = "any",
  min,
}: BaseFieldProps<T> & { step?: string; min?: number }) {
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
          <Input
            {...field}
            id={field.name}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            placeholder={placeholder}
            disabled={disabled}
            value={field.value ?? ""}
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

export function DateField<T extends FieldValues>(props: BaseFieldProps<T>) {
  return <TextField {...props} type="date" />;
}

export function TimeField<T extends FieldValues>(props: BaseFieldProps<T>) {
  return <TextField {...props} type="time" />;
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  rows = 3,
}: BaseFieldProps<T> & { rows?: number }) {
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
          <Textarea
            {...field}
            id={field.name}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            value={field.value ?? ""}
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

export type SelectOption = Readonly<{ value: string; label: string }>;

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder = "Seleziona…",
  disabled,
  required,
  options,
}: BaseFieldProps<T> & { options: readonly SelectOption[] }) {
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
          <Select
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </Field>
      )}
    />
  );
}

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: BaseFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          orientation="horizontal"
          data-invalid={fieldState.invalid || undefined}
        >
          <Checkbox
            id={field.name}
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
          <FieldLabel htmlFor={field.name} className="font-normal">
            {label}
          </FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </Field>
      )}
    />
  );
}

export function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: BaseFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal">
          <Switch
            id={field.name}
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
          <FieldLabel htmlFor={field.name} className="font-normal">
            {label}
          </FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
        </Field>
      )}
    />
  );
}

/** Contenitore per errori generici di submit. */
export function FormError({ message }: Readonly<{ message?: string | null }>) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

/** Griglia responsive standard per i form (1 → 2 colonne). */
export function FormGrid({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
