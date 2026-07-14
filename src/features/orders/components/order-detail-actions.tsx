"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AppDialog,
  Button,
  ConfirmDialog,
  type EntityOption,
} from "@/components/shared";
import { deleteOrder } from "../actions";
import type { OrderInput } from "../schema";
import { OrderForm } from "./order-form";

type OrderDetailActionsProps = Readonly<{
  orderId: string;
  code: string;
  direction: "issued" | "received";
  initialValues: OrderInput;
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  canEdit: boolean;
  canDelete: boolean;
}>;

/** Azioni della pagina di dettaglio ordine: modifica (dialog) ed elimina. */
export function OrderDetailActions({
  orderId,
  code,
  direction,
  initialValues,
  contactOptions,
  jobOptions,
  canEdit,
  canDelete,
}: OrderDetailActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const listPath =
    direction === "issued" ? "/app/vendite/ordini" : "/app/acquisti/ordini";

  return (
    <>
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
          title="Eliminare l'ordine?"
          description={`L'ordine ${code} e le sue righe verranno eliminati definitivamente.`}
          confirmLabel="Elimina"
          onConfirm={async () => {
            const result = await deleteOrder(orderId);
            if (result.ok) {
              toast.success("Ordine eliminato.");
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
        title={`Modifica ordine ${code}`}
        size="xl"
      >
        <OrderForm
          direction={direction}
          orderId={orderId}
          initialValues={initialValues}
          contactOptions={contactOptions}
          jobOptions={jobOptions}
          onSaved={() => setEditing(false)}
        />
      </AppDialog>
    </>
  );
}
