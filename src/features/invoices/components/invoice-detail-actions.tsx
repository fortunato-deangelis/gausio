"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AppDialog,
  Button,
  ConfirmDialog,
  type EntityOption,
} from "@/components/shared";
import { deleteInvoice, markInvoiceAsPaid } from "../actions";
import type { InvoiceInput } from "../schema";
import { InvoiceForm } from "./invoice-form";

type InvoiceDetailActionsProps = Readonly<{
  invoiceId: string;
  code: string;
  status: string;
  direction: "issued" | "received";
  initialValues: InvoiceInput;
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  canEdit: boolean;
  canDelete: boolean;
}>;

export function InvoiceDetailActions({
  invoiceId,
  code,
  status,
  direction,
  initialValues,
  contactOptions,
  jobOptions,
  canEdit,
  canDelete,
}: InvoiceDetailActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const listPath =
    direction === "issued" ? "/app/vendite/fatture" : "/app/acquisti/fatture";

  return (
    <>
      {canEdit && status !== "paid" && (
        <Button
          variant="outline"
          className="text-success hover:text-success"
          onClick={async () => {
            const result = await markInvoiceAsPaid(invoiceId);
            if (result.ok) {
              toast.success("Fattura segnata come pagata.");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          }}
        >
          <CheckCircle2 className="size-4" />
          Segna come pagata
        </Button>
      )}
      {canEdit && (
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
          Modifica
        </Button>
      )}
      {canDelete && (
        <ConfirmDialog
          trigger={
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Elimina
            </Button>
          }
          title="Eliminare la fattura?"
          description={`La fattura ${code} e le sue righe verranno eliminate definitivamente.`}
          confirmLabel="Elimina"
          onConfirm={async () => {
            const result = await deleteInvoice(invoiceId);
            if (result.ok) {
              toast.success("Fattura eliminata.");
              router.push(listPath);
              router.refresh();
            } else {
              toast.error(result.error);
            }
          }}
        />
      )}
      <AppDialog
        open={editing}
        onOpenChange={setEditing}
        title={`Modifica fattura ${code}`}
        size="xl"
      >
        <InvoiceForm
          direction={direction}
          invoiceId={invoiceId}
          initialValues={initialValues}
          contactOptions={contactOptions}
          jobOptions={jobOptions}
          onSaved={() => setEditing(false)}
        />
      </AppDialog>
    </>
  );
}
