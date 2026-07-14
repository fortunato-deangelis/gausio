"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { AppDialog, Button } from "@/components/shared";
import { ContactForm } from "./contact-form";
import type { ContactInput } from "../schema";

type ContactEditDialogProps = Readonly<{
  contactId: string;
  defaultValues: Partial<ContactInput>;
  /** Apre il dialog al mount (es. arrivo con ?edit=1). */
  initialOpen?: boolean;
}>;

/** Bottone "Modifica" + dialog con il form contatto precompilato. */
export function ContactEditDialog({
  contactId,
  defaultValues,
  initialOpen = false,
}: ContactEditDialogProps) {
  const [open, setOpen] = useState(initialOpen);
  const router = useRouter();

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
        Modifica
      </Button>
      <AppDialog
        open={open}
        onOpenChange={setOpen}
        title="Modifica contatto"
        size="xl"
      >
        <ContactForm
          contactId={contactId}
          defaultValues={defaultValues}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </AppDialog>
    </>
  );
}
