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
import { ProjectForm } from "./project-form";
import type { ProjectInput } from "../schema";

type ProjectEditDialogProps = Readonly<{
  projectId: string;
  defaultValues: Partial<ProjectInput>;
  clientOptions: EntityOption[];
  jobOptions: EntityOption[];
  memberOptions: SelectOption[];
  initialOpen?: boolean;
}>;

/** Bottone "Modifica" + dialog con il form progetto precompilato. */
export function ProjectEditDialog({
  projectId,
  defaultValues,
  clientOptions,
  jobOptions,
  memberOptions,
  initialOpen = false,
}: ProjectEditDialogProps) {
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
        title="Modifica progetto"
        size="xl"
      >
        <ProjectForm
          projectId={projectId}
          defaultValues={defaultValues}
          clientOptions={clientOptions}
          jobOptions={jobOptions}
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
