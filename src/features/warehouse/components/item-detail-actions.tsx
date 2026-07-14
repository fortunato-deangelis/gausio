"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AppDialog,
  Button,
  ConfirmDialog,
  type EntityOption,
} from "@/components/shared";
import { deleteItem } from "../actions";
import type { ItemInput, MovementType } from "../schema";
import { ItemForm } from "./item-form";
import { MovementFormDialog } from "./movement-form-dialog";

type ItemDetailActionsProps = Readonly<{
  itemId: string;
  itemName: string;
  initialValues: ItemInput;
  itemOptions: readonly EntityOption[];
  supplierOptions: readonly EntityOption[];
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}>;

export function ItemDetailActions({
  itemId,
  itemName,
  initialValues,
  itemOptions,
  supplierOptions,
  contactOptions,
  jobOptions,
  canCreate,
  canEdit,
  canDelete,
}: ItemDetailActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [movement, setMovement] = useState<{
    open: boolean;
    type?: MovementType;
  }>({ open: false });

  return (
    <>
      {canCreate && (
        <>
          <Button
            variant="outline"
            className="text-success hover:text-success"
            onClick={() => setMovement({ open: true, type: "in" })}
          >
            <ArrowDownToLine className="size-4" />
            Carico
          </Button>
          <Button
            variant="outline"
            className="text-warning hover:text-warning"
            onClick={() => setMovement({ open: true, type: "out" })}
          >
            <ArrowUpFromLine className="size-4" />
            Scarico
          </Button>
        </>
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
          title="Eliminare l'articolo?"
          description={`"${itemName}" verrà eliminato. Gli articoli con movimenti non possono essere eliminati.`}
          confirmLabel="Elimina"
          onConfirm={async () => {
            const result = await deleteItem(itemId);
            if (result.ok) {
              toast.success("Articolo eliminato.");
              router.push("/app/magazzino");
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
        title={`Modifica ${itemName}`}
        size="lg"
      >
        <ItemForm
          itemId={itemId}
          initialValues={initialValues}
          supplierOptions={supplierOptions}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </AppDialog>

      <MovementFormDialog
        open={movement.open}
        onOpenChange={(open) => setMovement((m) => ({ ...m, open }))}
        itemOptions={itemOptions}
        contactOptions={contactOptions}
        jobOptions={jobOptions}
        presetItemId={itemId}
        presetType={movement.type}
      />
    </>
  );
}
