"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, BadgeCheck, Pencil } from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  AppDialog,
  Button,
  ConfirmDialog,
  type EntityOption,
} from "@/components/shared";
import { approveIsoDocument, obsoleteIsoDocument } from "../actions";
import type { IsoDocumentInput } from "../schema";
import { IsoDocumentForm } from "./iso-document-form";

type IsoDetailActionsProps = Readonly<{
  document: Readonly<{ id: string } & IsoDocumentInput>;
  status: string;
  members: EntityOption[];
  canEdit: boolean;
}>;

/** Azioni della pagina di dettaglio: modifica, approvazione, obsolescenza. */
export function IsoDetailActions({
  document,
  status,
  members,
  canEdit,
}: IsoDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  if (!canEdit) return null;

  return (
    <>
      {status !== "approved" && (
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="text-success">
              <BadgeCheck className="size-4" />
              Approva
            </Button>
          }
          title="Approvare il documento?"
          description="Il documento passerà allo stato Approvato con data e firmatario registrati."
          confirmLabel="Approva"
          destructive={false}
          onConfirm={async () => {
            const result = await approveIsoDocument(document.id);
            if (result.ok) {
              toast.success("Documento approvato.");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          }}
        />
      )}
      {status !== "obsolete" && (
        <ConfirmDialog
          trigger={
            <Button variant="outline">
              <Archive className="size-4" />
              Rendi obsoleto
            </Button>
          }
          title="Rendere obsoleto il documento?"
          description="Il documento non sarà più valido per il sistema di gestione."
          confirmLabel="Rendi obsoleto"
          onConfirm={async () => {
            const result = await obsoleteIsoDocument(document.id);
            if (result.ok) {
              toast.success("Documento reso obsoleto.");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          }}
        />
      )}
      <AppDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        trigger={
          <Button>
            <Pencil className="size-4" />
            Modifica
          </Button>
        }
        title="Modifica documento"
        description="Se modifichi il contenuto la revisione verrà incrementata."
        size="xl"
      >
        <IsoDocumentForm
          members={members}
          document={document}
          onDone={() => setEditOpen(false)}
        />
      </AppDialog>
    </>
  );
}
