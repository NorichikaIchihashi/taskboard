"use client";

import { useId, useState, type FormEvent } from "react";

import {
  DEFAULT_TASK_PRIORITY,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  isTaskPriority,
  type TaskDraft,
  type TaskPriority,
} from "@/types/task";

type AddTaskFormProps = {
  /** 追加できたら true を返す。false のときはフォームを保持してエラーを出す。 */
  onAdd: (draft: TaskDraft) => boolean;
};

const fieldClass =
  "rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none " +
  "focus:border-blue-500 dark:border-white/15 dark:bg-white/5";

const labelClass = "text-xs font-medium";

/** 新しいタスクの入力を受け持つ。追加後は入力欄を初期状態に戻す。 */
export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const titleId = useId();
  const descriptionId = useId();
  const assigneeId = useId();
  const priorityId = useId();
  const dueDateId = useId();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(DEFAULT_TASK_PRIORITY);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onAdd({ title, description, assignee, priority, dueDate })) {
      setError("タイトルを入力してください");
      return;
    }

    setTitle("");
    setDescription("");
    setAssignee("");
    setPriority(DEFAULT_TASK_PRIORITY);
    setDueDate("");
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="タスクを追加"
      className="flex flex-col gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={titleId} className={labelClass}>
            タイトル
          </label>
          <input
            id={titleId}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例: ログイン画面を実装する"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor={descriptionId} className={labelClass}>
            説明
          </label>
          <input
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="任意"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor={assigneeId} className={labelClass}>
            担当者
          </label>
          <input
            id={assigneeId}
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder="任意"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={priorityId} className={labelClass}>
            優先度
          </label>
          <select
            id={priorityId}
            value={priority}
            onChange={(event) =>
              // select の値は string なので、型ガードで TaskPriority に絞る。
              setPriority(
                isTaskPriority(event.target.value)
                  ? event.target.value
                  : DEFAULT_TASK_PRIORITY,
              )
            }
            className={fieldClass}
          >
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {TASK_PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={dueDateId} className={labelClass}>
            期限
          </label>
          <input
            id={dueDateId}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          追加
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
