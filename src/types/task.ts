/** カンバンの列と 1:1 で対応するタスクの状態。配列の順序がそのまま列の並び順になる。 */
export const TASK_STATUSES = [
  "todo",
  "in-progress",
  "on-hold",
  "done",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/** タスクの優先度。配列の順序がそのまま「優先度の高い順」＝並び替えの順序になる。 */
export const TASK_PRIORITIES = ["high", "medium", "low"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** 優先度を指定しなかったときの既定値。 */
export const DEFAULT_TASK_PRIORITY: TaskPriority = "medium";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  /** 担当者。未設定は ""（description と同じ扱い）。 */
  assignee: string;
  priority: TaskPriority;
  /** 期限。"YYYY-MM-DD" 形式で、未設定は ""。@/lib/due-date を参照。 */
  dueDate: string;
};

/** 入力フォームが扱う、まだ id と status を持たないタスク。 */
export type TaskDraft = {
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  "in-progress": "進行中",
  "on-hold": "保留",
  done: "完了",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority);
}
