"use client";

import { useId } from "react";

import { isFilterActive, type BoardFilter } from "@/lib/board";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  isTaskPriority,
} from "@/types/task";

type BoardFilterBarProps = {
  filter: BoardFilter;
  /** 担当者の選択肢。絞り込み前の全タスクから作られたもの。 */
  assignees: string[];
  totalCount: number;
  visibleCount: number;
  /** 指定した項目だけを差し替える。 */
  onFilterChange: (patch: Partial<BoardFilter>) => void;
  onClear: () => void;
};

const fieldClass =
  "rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none " +
  "focus:border-blue-500 dark:border-white/15 dark:bg-white/5";

const labelClass = "text-xs font-medium";

/**
 * 検索と絞り込みの入力を受け持つ。条件は自分では持たず、すべて親（useBoard）に返す。
 *
 * ラベルは AddTaskForm の「担当者」「優先度」と重ならない名前にしてある
 * （同じ名前だと getByLabelText がどちらを指すか決められなくなる）。
 *
 * 外側は section ではなく search 要素。section は名前を付けると role="region" になり、
 * 列を数えている getAllByRole("region") に混ざってしまう（意味としても検索領域が正しい）。
 */
export function BoardFilterBar({
  filter,
  assignees,
  totalCount,
  visibleCount,
  onFilterChange,
  onClear,
}: BoardFilterBarProps) {
  const queryId = useId();
  const assigneeId = useId();
  const priorityId = useId();

  const filtering = isFilterActive(filter);

  return (
    <search
      aria-label="タスクの絞り込み"
      data-testid="board-filter"
      className="flex flex-col gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor={queryId} className={labelClass}>
            検索
          </label>
          <input
            id={queryId}
            type="search"
            value={filter.query}
            onChange={(event) => onFilterChange({ query: event.target.value })}
            placeholder="タイトル・説明で絞り込む"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={assigneeId} className={labelClass}>
            担当者で絞り込む
          </label>
          <select
            id={assigneeId}
            value={filter.assignee}
            onChange={(event) =>
              onFilterChange({ assignee: event.target.value })
            }
            className={fieldClass}
          >
            <option value="">すべて</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={priorityId} className={labelClass}>
            優先度で絞り込む
          </label>
          <select
            id={priorityId}
            value={filter.priority}
            onChange={(event) =>
              // select の値は string なので、型ガードで TaskPriority か "" に絞る。
              onFilterChange({
                priority: isTaskPriority(event.target.value)
                  ? event.target.value
                  : "",
              })
            }
            className={fieldClass}
          >
            <option value="">すべて</option>
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {TASK_PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtering && (
        <div className="flex items-center justify-between gap-3">
          <p
            data-testid="filter-summary"
            aria-live="polite"
            className="text-xs tabular-nums text-black/60 dark:text-white/60"
          >
            {totalCount} 件中 {visibleCount} 件を表示
          </p>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-black/10 px-3 py-1 text-xs font-medium text-black/70 transition hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            絞り込みを解除
          </button>
        </div>
      )}
    </search>
  );
}
