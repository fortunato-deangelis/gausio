"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  AppDialog,
  Button,
  type EntityOption,
  type SelectOption,
} from "@/components/shared";
import { JobForm } from "./job-form";
import type { JobInput } from "../schema";

type JobEditDialogProps = Readonly<{
  jobId: string;
  defaultValues: Partial<JobInput>;
  clientOptions: EntityOption[];
  memberOptions: SelectOption[];
  initialOpen?: boolean;
}>;

/** Bottone "Modifica" + dialog con il form commessa precompilato. */
export function JobEditDialog({
  jobId,
  defaultValues,
  clientOptions,
  memberOptions,
  initialOpen = false,
}: JobEditDialogProps) {
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
        title="Modifica commessa"
        size="xl"
      >
        <JobForm
          jobId={jobId}
          defaultValues={defaultValues}
          clientOptions={clientOptions}
          memberOptions={memberOptions}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </AppDialog>
    </>
  );
}
