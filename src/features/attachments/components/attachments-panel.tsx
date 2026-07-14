"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AppCard,
  Button,
  ConfirmDialog,
  EmptyState,
  Spinner,
} from "@/components/shared";
import {
  deleteAttachment,
  listAttachments,
  uploadAttachment,
  type AttachmentDto,
  type AttachmentEntity,
} from "../actions";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type AttachmentsPanelProps = Readonly<{
  entityType: AttachmentEntity;
  entityId: string;
  title?: string;
}>;

/**
 * Pannello allegati riusabile: elenco, upload e cancellazione per qualsiasi
 * entità (contatti, ordini, fatture, commesse, dipendenti, documenti ISO…).
 */
export function AttachmentsPanel({
  entityType,
  entityId,
  title = "Allegati",
}: AttachmentsPanelProps) {
  const [items, setItems] = useState<AttachmentDto[] | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    listAttachments(entityType, entityId).then((rows) => {
      if (!cancelled) setItems(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  const onUpload = (file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("entityType", entityType);
    formData.set("entityId", entityId);
    startTransition(async () => {
      const result = await uploadAttachment(formData);
      if (result.ok) {
        setItems((prev) => [result.data, ...(prev ?? [])]);
        toast.success("Allegato caricato.");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <AppCard
      title={
        <span className="flex items-center gap-2">
          <Paperclip aria-hidden className="size-4" />
          {title}
        </span>
      }
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            aria-label="Carica allegato"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? <Spinner className="size-4" /> : <Upload className="size-4" />}
            Carica
          </Button>
        </>
      }
    >
      {items === null ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-5" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="Nessun allegato"
          description="Carica documenti, immagini o file collegati a questo elemento."
        />
      ) : (
        <ul className="flex flex-col divide-y">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(item.sizeBytes)} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString("it-IT")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button asChild variant="ghost" size="icon-sm" aria-label={`Scarica ${item.fileName}`}>
                  <a href={`/api/attachments/${item.id}`} download>
                    <Download />
                  </a>
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Elimina ${item.fileName}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  }
                  title="Eliminare l'allegato?"
                  description={`"${item.fileName}" verrà rimosso definitivamente.`}
                  confirmLabel="Elimina"
                  onConfirm={async () => {
                    const result = await deleteAttachment(item.id);
                    if (result.ok) {
                      setItems((prev) =>
                        (prev ?? []).filter((i) => i.id !== item.id)
                      );
                      toast.success("Allegato eliminato.");
                    } else {
                      toast.error(result.error);
                    }
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}
