"use client";

import { useState, type DragEvent } from "react";

import { ColumnHeader } from "@/components/ColumnHeader";
import { TaskCard } from "@/components/TaskCard";
import { getDragTaskId, hasTaskPayload } from "@/lib/dnd";
import { TASK_STATUS_LABELS, type Task, type TaskStatus } from "@/types/task";

type BoardColumnProps = {
  status: TaskStatus;
  tasks: Task[];
  /** 期限の判定に使う「今日」。そのまま各カードへ渡す。 */
  today: string;
  /** 絞り込み中かどうか。空のときの文言を出し分けるためだけに使う。 */
  isFiltering: boolean;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
};

/** 1 つの列の表示と、ドロップ先としての振る舞いを受け持つ。 */
export function BoardColumn({
  status,
  tasks,
  today,
  isFiltering,
  onMoveTask,
  onDeleteTask,
}: BoardColumnProps) {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!hasTaskPayload(event.dataTransfer)) {
      return;
    }
    // preventDefault を呼んだ要素だけがドロップを受け付ける。
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    // 列の内側（カード間）を移動しただけの dragleave は無視する。
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsOver(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsOver(false);
    const taskId = getDragTaskId(event.dataTransfer);
    if (taskId) {
      onMoveTask(taskId, status);
    }
  }

  return (
    <section
      aria-label={TASK_STATUS_LABELS[status]}
      data-testid={`column-${status}`}
      data-drop-active={isOver ? "true" : "false"}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex min-h-64 flex-col gap-3 rounded-xl border p-3 transition
        ${
          isOver
            ? "border-blue-500 bg-blue-500/5"
            : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
        }`}
    >
      <ColumnHeader status={status} count={tasks.length} />

      <ul className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard
              task={task}
              today={today}
              onMove={onMoveTask}
              onDelete={onDeleteTask}
            />
          </li>
        ))}
      </ul>

      {tasks.length === 0 && (
        <p className="px-1 pb-2 text-xs text-black/40 dark:text-white/40">
          {isFiltering ? "該当するタスクはありません" : "ここにタスクをドロップ"}
        </p>
      )}
    </section>
  );
}
