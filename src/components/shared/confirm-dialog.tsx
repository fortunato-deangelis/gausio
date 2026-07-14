"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type ConfirmDialogProps = Readonly<{
  trigger: ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Eseguita alla conferma; il dialog resta aperto finché non termina. */
  onConfirm: () => void | Promise<void>;
}>;

/** Conferma per azioni irreversibili (default: tono distruttivo). */
export function ConfirmDialog({
  trigger,
  title = "Sei sicuro?",
  description = "Questa azione non può essere annullata.",
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  destructive = true,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={cn(
              destructive &&
                buttonVariants({ variant: "destructive" })
            )}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                await onConfirm();
                setOpen(false);
              });
            }}
          >
            {pending && <Spinner className="size-4" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
