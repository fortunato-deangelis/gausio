"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "./primitives";

type DismissibleAlertProps = Readonly<{
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  role?: ComponentProps<typeof Alert>["role"];
  title?: ReactNode;
  variant?: ComponentProps<typeof Alert>["variant"];
}>;

/** Alert chiudibile per messaggi inline generati da pagine server. */
export function DismissibleAlert({
  children,
  className,
  closeLabel,
  role,
  title,
  variant,
}: DismissibleAlertProps) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <Alert
      className={className}
      closeLabel={closeLabel}
      onClose={() => setOpen(false)}
      role={role}
      variant={variant}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
