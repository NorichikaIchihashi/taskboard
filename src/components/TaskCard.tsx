"use client";

import { useState, type DragEvent } from "react";

import { TaskMoveControls } from "@/components/TaskMoveControls";
import { setDragTaskId } from "@/lib/dnd";
import {
  DUE_DATE_TONE_LABELS,
  formatDueDate,
  getDueDateTone,
  type DueDateTone,
} from "@/lib/due-date";
import {
  TASK_PRIORITY_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/types/task";

type TaskCardProps = {
  task: Task;
  /** 期限の判定に使う「今日」。マウント前は ""（＝強調しない）。 */
  today: string;
  onMove: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
};

const priorityBadgeClass: Record<TaskPriority, string> = {
  high: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  medium:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  low: "border-black/10 bg-black/5 text-black/50 dark:border-white/15 dark:bg-white/10 dark:text-white/50",
};

const dueDateToneClass: Record<DueDateTone, string> = {
  overdue: "font-medium text-red-600 dark:text-red-400",
  today: "font-medium text-amber-600 dark:text-amber-400",
  soon: "text-yellow-700 dark:text-yellow-400",
  upcoming: "text-black/60 dark:text-white/60",
};

/** 1 件のタスクの表示と、ドラッグ元としての振る舞いを受け持つ。 */
export function TaskCard({ task, today, onMove, onDelete }: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart(event: DragEvent<HTMLElement>) {
    setDragTaskId(event.dataTransfer, task.id);
    setIsDragging(true);
  }

  const dueDateTone = getDueDateTone(task.dueDate, today);
  const dueDateToneLabel = dueDateTone ? DUE_DATE_TONE_LABELS[dueDateTone] : "";

  return (
    <article
      draggable
      data-testid={`task-${task.id}`}
      aria-roledescription="ドラッグして列を移動できるタスク"
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      className={`cursor-grab rounded-lg border border-black/10 bg-white p-3 shadow-sm
        transition active:cursor-grabbing dark:border-white/10 dark:bg-white/5
        ${isDragging ? "opacity-40" : "opacity-100"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold break-words">{task.title}</h3>
        <span
          data-priority={task.priority}
          aria-label={`優先度: ${TASK_PRIORITY_LABELS[task.priority]}`}
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium
            ${priorityBadgeClass[task.priority]}`}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="mt-1 text-xs break-words text-black/60 dark:text-white/60">
          {task.description}
        </p>
      )}

      {(task.assignee || task.dueDate) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {task.assignee && (
            <span
              aria-label={`担当者: ${task.assignee}`}
              className="break-all text-black/60 dark:text-white/60"
            >
              👤 {task.assignee}
            </span>
          )}
          {task.dueDate && (
            <time
              dateTime={task.dueDate}
              data-due-tone={dueDateTone ?? "none"}
              aria-label={`期限: ${task.dueDate}${
                dueDateToneLabel ? `（${dueDateToneLabel}）` : ""
              }`}
              className={
                dueDateTone
                  ? dueDateToneClass[dueDateTone]
                  : dueDateToneClass.upcoming
              }
            >
              📅 {formatDueDate(task.dueDate, today)}
              {dueDateToneLabel && ` ${dueDateToneLabel}`}
            </time>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={`「${task.title}」を削除`}
          onClick={() => onDelete(task.id)}
          className="rounded-md border border-transparent px-2 py-1 text-xs font-medium text-black/40
            transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600
            dark:text-white/40 dark:hover:text-red-400"
        >
          削除
        </button>
        <TaskMoveControls task={task} onMove={onMove} />
      </div>
    </article>
  );
}
