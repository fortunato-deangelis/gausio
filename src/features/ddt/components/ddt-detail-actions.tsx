"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  AppDialog,
  Button,
  ConfirmDialog,
  type EntityOption,
} from "@/components/shared";
import { deleteDdt, generateDdtMovements } from "../actions";
import type { DdtInput } from "../schema";
import { DdtForm } from "./ddt-form";
import type { DdtItemInfo } from "./ddt-lines-editor";

type DdtDetailActionsProps = Readonly<{
  ddtId: string;
  code: string;
  direction: "issued" | "received";
  initialValues: DdtInput;
  contactOptions: readonly EntityOption[];
  jobOptions: readonly EntityOption[];
  itemOptions: readonly EntityOption[];
  itemInfos: readonly DdtItemInfo[];
  movementsGenerated: boolean;
  hasLinkedItems: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canGenerateMovements: boolean;
}>;

export function DdtDetailActions({
  ddtId,
  code,
  direction,
  initialValues,
  contactOptions,
  jobOptions,
  itemOptions,
  itemInfos,
  movementsGenerated,
  hasLinkedItems,
  canEdit,
  canDelete,
  canGenerateMovements,
}: DdtDetailActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  return (
    <>
      {canGenerateMovements && hasLinkedItems && (
        <ConfirmDialog
          trigger={
            <Button variant="outline" disabled={movementsGenerated}>
              <PackageCheck className="size-4" />
              {movementsGenerated
                ? "Movimenti già generati"
                : "Genera movimenti di magazzino"}
            </Button>
          }
          title="Generare i movimenti di magazzino?"
          description={
            direction === "issued"
              ? "Verrà registrato uno scarico per ogni riga collegata a un articolo."
              : "Verrà registrato un carico per ogni riga collegata a un articolo."
          }
          confirmLabel="Genera"
          destructive={false}
          onConfirm={async () => {
            const result = await generateDdtMovements(ddtId);
            if (result.ok) {
              toast.success(`${result.data.created} movimenti generati.`);
              router.refresh();
            } else {
              toast.error(result.error);
            }
          }}
        />
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
          title="Eliminare il DDT?"
          description={`Il documento ${code} verrà eliminato definitivamente.`}
          confirmLabel="Elimina"
          onConfirm={async () => {
            const result = await deleteDdt(ddtId);
            if (result.ok) {
              toast.success("DDT eliminato.");
              router.push("/app/logistica/ddt");
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
        title={`Modifica DDT ${code}`}
        size="xl"
      >
        <DdtForm
          direction={direction}
          ddtId={ddtId}
          initialValues={initialValues}
          contactOptions={contactOptions}
          jobOptions={jobOptions}
          itemOptions={itemOptions}
          itemInfos={itemInfos}
          onSaved={() => setEditing(false)}
        />
      </AppDialog>
    </>
  );
}
