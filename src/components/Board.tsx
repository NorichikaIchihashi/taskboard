"use client";

import { AddTaskForm } from "@/components/AddTaskForm";
import { BoardColumn } from "@/components/BoardColumn";
import { BoardFilterBar } from "@/components/BoardFilterBar";
import { useBoard } from "@/hooks/useBoard";
import { useToday } from "@/hooks/useToday";
import { isFilterActive } from "@/lib/board";
import { TASK_STATUSES, type Task } from "@/types/task";

type BoardProps = {
  initialTasks?: Task[];
  /** 期限の判定に使う「今日」。省略するとマウント後に実際の今日を使う。 */
  today?: string;
};

/** ボード全体の組み立て。状態は useBoard に、表示は各コンポーネントに委ねる。 */
export function Board({ initialTasks = [], today }: BoardProps) {
  const {
    tasks,
    columns,
    visibleCount,
    assignees,
    filter,
    setFilter,
    clearFilter,
    addTask,
    moveTask,
    deleteTask,
  } = useBoard(initialTasks);
  const mountedToday = useToday();
  const effectiveToday = today ?? mountedToday;
  const filtering = isFilterActive(filter);

  return (
    <div className="flex flex-col gap-6">
      <AddTaskForm onAdd={addTask} />

      <BoardFilterBar
        filter={filter}
        assignees={assignees}
        totalCount={tasks.length}
        visibleCount={visibleCount}
        onFilterChange={setFilter}
        onClear={clearFilter}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={columns[status]}
            today={effectiveToday}
            isFiltering={filtering}
            onMoveTask={moveTask}
            onDeleteTask={deleteTask}
          />
        ))}
      </div>
    </div>
  );
}
