import { normalizeDueDate } from "@/lib/due-date";
import { createId } from "@/lib/id";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
} from "@/types/task";

/** 状態ごとに仕分けしたタスク。全ての状態のキーが必ず存在する。 */
export type TasksByStatus = Record<TaskStatus, Task[]>;

export type CreateTaskOptions = {
  id?: string;
  status?: TaskStatus;
};

/** タイトルが空（空白のみを含む）の下書きは登録できない。 */
export function isValidDraft(draft: TaskDraft): boolean {
  return draft.title.trim().length > 0;
}

export function createTask(
  draft: TaskDraft,
  { id = createId(), status = "todo" }: CreateTaskOptions = {},
): Task {
  return {
    id,
    title: draft.title.trim(),
    description: draft.description.trim(),
    status,
    assignee: draft.assignee.trim(),
    priority: draft.priority,
    // 期限として成立しない値はエラーにせず未設定に倒す。
    dueDate: normalizeDueDate(draft.dueDate),
  };
}

export function addTask(tasks: Task[], task: Task): Task[] {
  return [...tasks, task];
}

/**
 * タスクを別の列へ移す。移動先の列の末尾に入る。
 * 対象が存在しない場合と、既に移動先の列にいる場合は元の配列をそのまま返す
 * （参照が変わらないので、呼び出し側の再描画を無駄に誘発しない）。
 */
export function moveTask(
  tasks: Task[],
  taskId: string,
  status: TaskStatus,
): Task[] {
  const target = tasks.find((task) => task.id === taskId);
  if (!target || target.status === status) {
    return tasks;
  }
  return [...tasks.filter((task) => task.id !== taskId), { ...target, status }];
}

/**
 * タスクを取り除く。moveTask と同じく、該当が無ければ元の配列をそのまま返す
 * （参照が変わらないので、保存も再描画も無駄に走らない）。
 */
export function removeTask(tasks: Task[], taskId: string): Task[] {
  const filtered = tasks.filter((task) => task.id !== taskId);
  return filtered.length === tasks.length ? tasks : filtered;
}

/** 期限が近い順。未設定（""）は常に後ろへ。 */
function compareDueDate(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  // "YYYY-MM-DD" は辞書順がそのまま日付順になる。
  return a < b ? -1 : 1;
}

/**
 * 優先度が高い順 → 期限が近い順に並べる。元の配列は変更しない。
 * 優先度の順位は TASK_PRIORITIES の並び順そのもの（順序の情報源を 1 か所に保つ）。
 * sort は安定なので、どちらも同じタスクは元の順序＝追加順を保つ。
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      TASK_PRIORITIES.indexOf(a.priority) -
        TASK_PRIORITIES.indexOf(b.priority) ||
      compareDueDate(a.dueDate, b.dueDate),
  );
}

export function filterByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task) => task.status === status);
}

export function groupByStatus(tasks: Task[]): TasksByStatus {
  const grouped = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, [] as Task[]]),
  ) as TasksByStatus;

  for (const task of tasks) {
    grouped[task.status].push(task);
  }
  return grouped;
}

/**
 * 表示するタスクの絞り込み条件。どの項目も "" が「指定なし（すべて）」を意味する。
 * 表示だけの都合なので保存はしない（リロードで解除される）。
 */
export type BoardFilter = {
  /** タイトルと説明を対象にしたキーワード。 */
  query: string;
  assignee: string;
  priority: TaskPriority | "";
};

export const EMPTY_BOARD_FILTER: BoardFilter = {
  query: "",
  assignee: "",
  priority: "",
};

/** 1 つでも条件が指定されているか。空白だけのキーワードは指定とみなさない。 */
export function isFilterActive(filter: BoardFilter): boolean {
  return Boolean(
    filter.query.trim() || filter.assignee || filter.priority,
  );
}

/** 全ての条件を満たすか（AND）。英字の大文字・小文字は区別しない。 */
export function matchesFilter(task: Task, filter: BoardFilter): boolean {
  const query = filter.query.trim().toLocaleLowerCase();
  if (query) {
    const haystack = `${task.title}\n${task.description}`.toLocaleLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }
  if (filter.assignee && task.assignee !== filter.assignee) {
    return false;
  }
  return !filter.priority || task.priority === filter.priority;
}

/** 条件が空なら元の配列をそのまま返す（useMemo の下流を無駄に再計算させない）。 */
export function filterTasks(tasks: Task[], filter: BoardFilter): Task[] {
  if (!isFilterActive(filter)) {
    return tasks;
  }
  return tasks.filter((task) => matchesFilter(task, filter));
}

/** 絞り込みの選択肢に使う担当者の一覧。重複と未設定（""）を除いて並べる。 */
export function collectAssignees(tasks: Task[]): string[] {
  const assignees = new Set(
    tasks.map((task) => task.assignee).filter(Boolean),
  );
  return Array.from(assignees).sort((a, b) => a.localeCompare(b, "ja"));
}
