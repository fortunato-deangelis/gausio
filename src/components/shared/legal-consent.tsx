"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FieldDescription, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type LegalConsentProps = Readonly<{
  id: string;
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  description?: ReactNode;
  error?: string;
  className?: string;
}>;

/** Consenso legale riutilizzabile con lo switch rettangolare condiviso. */
export function LegalConsent({
  id,
  name = "termsAccepted",
  checked,
  defaultChecked,
  onCheckedChange,
  required = false,
  disabled = false,
  description,
  error,
  className,
}: LegalConsentProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      data-invalid={Boolean(error) || undefined}
      className={cn("grid grid-cols-[40px_1fr] items-start gap-x-3 gap-y-2", className)}
    >
      <Switch
        id={id}
        name={name}
        value="accepted"
        shape="rectangular"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor={id} className="block cursor-pointer text-base leading-relaxed">
          Accetto i{" "}
          <Link
            href="/termini-e-condizioni"
            className="underline underline-offset-4 hover:text-primary"
          >
            Termini e condizioni
          </Link>{" "}
          e dichiaro di aver letto la{" "}
          <Link
            href="/privacy-policy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          {required && <span aria-hidden> *</span>}
        </Label>
        {description && (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        )}
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    </div>
  );
}
