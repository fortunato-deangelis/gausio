"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AppDialog,
  Button,
  DateField,
  FormError,
  FormGrid,
  NumberField,
  SelectField,
  Spinner,
  TextField,
  TextareaField,
  type SelectOption,
} from "@/components/shared";
import { createTask, updateTask } from "../actions";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  taskPriorities,
  taskSchema,
  taskStatuses,
  type TaskInput,
} from "../schema";

type TaskFormDialogProps = Readonly<{
  projectId: string;
  /** Se presente, il dialog modifica la task esistente. */
  taskId?: string;
  defaultValues?: Partial<TaskInput>;
  memberOptions: SelectOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

const statusOptions = taskStatuses.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));

const priorityOptions = taskPriorities.map((p) => ({
  value: p,
  label: TASK_PRIORITY_LABELS[p],
}));

export function TaskFormDialog({
  projectId,
  taskId,
  defaultValues,
  memberOptions,
  open,
  onOpenChange,
}: TaskFormDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      status: "todo",
      priority: "medium",
      ...defaultValues,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = taskId
      ? await updateTask(taskId, values)
      : await createTask(projectId, values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(taskId ? "Attività aggiornata." : "Attività creata.");
    onOpenChange(false);
    form.reset();
    router.refresh();
  });

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={taskId ? "Modifica attività" : "Nuova attività"}
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField control={form.control} name="title" label="Titolo" required />
        <FormGrid>
          <SelectField
            control={form.control}
            name="status"
            label="Stato"
            options={statusOptions}
            required
          />
          <SelectField
            control={form.control}
            name="priority"
            label="Priorità"
            options={priorityOptions}
            required
          />
          <SelectField
            control={form.control}
            name="assigneeId"
            label="Assegnatario"
            options={memberOptions}
            placeholder="Assegna a…"
          />
          <DateField control={form.control} name="dueDate" label="Scadenza" />
          <NumberField
            control={form.control}
            name="estimatedHours"
            label="Ore stimate"
            min={0}
          />
        </FormGrid>
        <TextareaField
          control={form.control}
          name="description"
          label="Descrizione"
        />
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner className="size-4" />}
            {taskId ? "Salva" : "Crea attività"}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
