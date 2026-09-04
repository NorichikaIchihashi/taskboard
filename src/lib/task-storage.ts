/**
 * localStorage への保存と復元をこのモジュールに閉じ込める。
 * lib/dnd.ts が DataTransfer のキー名を閉じ込めているのと同じ立ち位置で、
 * hook とコンポーネントはキー名や JSON の形を知らなくてよい。
 *
 * Storage は due-date.ts の todayString(now = new Date()) と同じく既定引数で受け取る。
 * こうしておけばテストから差し替えられるし、lib が暗黙にグローバルを読むこともない。
 */

import { normalizeDueDate } from "@/lib/due-date";
import {
  DEFAULT_TASK_PRIORITY,
  TASK_STATUSES,
  isTaskPriority,
  isTaskStatus,
  type Task,
} from "@/types/task";

/** 保存形式を変えるときはここを上げる（古い保存値は読まれずサンプルに戻る）。 */
export const TASKS_STORAGE_KEY = "taskboard.tasks.v1";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * 保存値 1 件を Task に戻す。id と title を欠くものだけ捨て、
 * それ以外の壊れた値は normalizeDueDate と同じ考え方でエラーにせず既定値に倒す。
 */
function toTask(value: unknown): Task | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const id = asString(record.id);
  const title = asString(record.title);
  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    description: asString(record.description),
    // 定義に無い列名は先頭の列（未着手）に倒す。列名の情報源は TASK_STATUSES だけ。
    status: isTaskStatus(record.status) ? record.status : TASK_STATUSES[0],
    assignee: asString(record.assignee),
    priority: isTaskPriority(record.priority)
      ? record.priority
      : DEFAULT_TASK_PRIORITY,
    dueDate: normalizeDueDate(asString(record.dueDate)),
  };
}

export function serializeTasks(tasks: Task[]): string {
  return JSON.stringify(tasks);
}

/**
 * 保存文字列を Task[] に戻す。読めないときは null（＝「保存が無い」）。
 * 空配列は「全部消した」という有効な保存値なので、null と区別して [] を返す。
 */
export function parseStoredTasks(raw: string | null): Task[] | null {
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) {
    return null;
  }

  return parsed
    .map(toTask)
    .filter((task): task is Task => task !== null);
}

/** localStorage は環境によって存在しない・触れるだけで例外を投げることがある。 */
function getLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readStoredTasks(
  storage: Storage | null = getLocalStorage(),
): Task[] | null {
  if (!storage) {
    return null;
  }
  try {
    return parseStoredTasks(storage.getItem(TASKS_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredTasks(
  tasks: Task[],
  storage: Storage | null = getLocalStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(TASKS_STORAGE_KEY, serializeTasks(tasks));
  } catch {
    // 容量超過やプライベートモードでは保存できない。
    // 表示は続けられるので、保存の失敗でアプリを止めない。
  }
}
