"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  AppCard,
  AppDropdown,
  Button,
  ConfirmDialog,
  StatusBadge,
  type SelectOption,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import { deleteTask, moveTask } from "../actions";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONES,
  TASK_STATUS_LABELS,
  taskStatuses,
  type TaskStatus,
} from "../schema";
import type { TaskWithAssignee } from "../queries";
import { TaskFormDialog } from "./task-form-dialog";

type ProjectBoardProps = Readonly<{
  projectId: string;
  tasks: TaskWithAssignee[];
  memberOptions: SelectOption[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}>;

/** Board kanban: una colonna per stato, spostamento con frecce. */
export function ProjectBoard({
  projectId,
  tasks,
  memberOptions,
  canCreate,
  canEdit,
  canDelete,
}: ProjectBoardProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");
  const [editTask, setEditTask] = useState<TaskWithAssignee | null>(null);

  const move = async (taskId: string, status: TaskStatus) => {
    const result = await moveTask(taskId, status);
    if (result.ok) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatuses.map((status, columnIndex) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <AppCard
              key={status}
              title={
                <span className="flex items-center justify-between gap-2 text-sm">
                  {TASK_STATUS_LABELS[status]}
                  <span className="text-xs font-normal text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </span>
              }
              className="bg-muted/40"
              contentClassName="flex flex-col gap-3"
            >
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{task.title}</p>
                    {(canEdit || canDelete) && (
                      <AppDropdown
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Azioni ${task.title}`}
                          >
                            <MoreVertical />
                          </Button>
                        }
                        items={[
                          ...(canEdit
                            ? [
                                {
                                  label: "Modifica",
                                  icon: Pencil,
                                  onSelect: () => setEditTask(task),
                                },
                              ]
                            : []),
                        ]}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={TASK_PRIORITY_LABELS[task.priority]}
                      tone={TASK_PRIORITY_TONES[task.priority]}
                    />
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays aria-hidden className="size-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                  {task.assigneeName && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User aria-hidden className="size-3" />
                      {task.assigneeName}
                    </span>
                  )}
                  {canEdit && (
                    <div className="flex items-center justify-between border-t pt-2">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Sposta indietro"
                        disabled={columnIndex === 0}
                        onClick={() =>
                          move(task.id, taskStatuses[columnIndex - 1])
                        }
                      >
                        <ArrowLeft />
                      </Button>
                      {canDelete && (
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Elimina ${task.title}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          }
                          title="Eliminare l'attività?"
                          description={`"${task.title}" verrà eliminata definitivamente.`}
                          confirmLabel="Elimina"
                          onConfirm={async () => {
                            const result = await deleteTask(task.id);
                            if (result.ok) {
                              toast.success("Attività eliminata.");
                              router.refresh();
                            } else {
                              toast.error(result.error);
                            }
                          }}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Sposta avanti"
                        disabled={columnIndex === taskStatuses.length - 1}
                        onClick={() =>
                          move(task.id, taskStatuses[columnIndex + 1])
                        }
                      >
                        <ArrowRight />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {canCreate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-muted-foreground"
                  onClick={() => {
                    setCreateStatus(status);
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Aggiungi attività
                </Button>
              )}
            </AppCard>
          );
        })}
      </div>

      {createOpen && (
        <TaskFormDialog
          projectId={projectId}
          memberOptions={memberOptions}
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultValues={{ status: createStatus }}
        />
      )}
      {editTask && (
        <TaskFormDialog
          projectId={projectId}
          taskId={editTask.id}
          memberOptions={memberOptions}
          open
          onOpenChange={(open) => {
            if (!open) setEditTask(null);
          }}
          defaultValues={{
            title: editTask.title,
            description: editTask.description ?? "",
            status: editTask.status,
            priority: editTask.priority,
            assigneeId: editTask.assigneeId ?? "",
            dueDate: editTask.dueDate ?? "",
            estimatedHours: editTask.estimatedHours ?? "",
          }}
        />
      )}
    </>
  );
}
