"use client";

import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "@/types/task";

type TaskMoveControlsProps = {
  task: Task;
  onMove: (taskId: string, status: TaskStatus) => void;
};

const buttonClass =
  "rounded-md border border-black/10 px-2 py-1 text-xs font-medium text-black/70 " +
  "transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30 " +
  "dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10";

/**
 * ドラッグ＆ドロップはキーボードとタッチ環境で使えないため、
 * 隣の列へ移すためのボタンを同じ操作の代替手段として置く。
 */
export function TaskMoveControls({ task, onMove }: TaskMoveControlsProps) {
  const index = TASK_STATUSES.indexOf(task.status);
  const previous: TaskStatus | undefined = TASK_STATUSES[index - 1];
  const next: TaskStatus | undefined = TASK_STATUSES[index + 1];

  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        className={buttonClass}
        disabled={!previous}
        onClick={() => previous && onMove(task.id, previous)}
        aria-label={
          previous
            ? `「${task.title}」を${TASK_STATUS_LABELS[previous]}へ移動`
            : "これ以上左へは移動できません"
        }
      >
        ←
      </button>
      <button
        type="button"
        className={buttonClass}
        disabled={!next}
        onClick={() => next && onMove(task.id, next)}
        aria-label={
          next
            ? `「${task.title}」を${TASK_STATUS_LABELS[next]}へ移動`
            : "これ以上右へは移動できません"
        }
      >
        →
      </button>
    </div>
  );
}
