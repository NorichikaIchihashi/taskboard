"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import {
  EMPTY_BOARD_FILTER,
  addTask as addTaskToList,
  collectAssignees,
  createTask,
  filterTasks,
  groupByStatus,
  isValidDraft,
  moveTask as moveTaskInList,
  removeTask as removeTaskFromList,
  sortTasks,
  type BoardFilter,
  type TasksByStatus,
} from "@/lib/board";
import { createTaskStore } from "@/lib/task-store";
import type { Task, TaskDraft, TaskStatus } from "@/types/task";

export type UseBoardResult = {
  /** 絞り込み前の全タスク。追加順のまま。 */
  tasks: Task[];
  /** 絞り込みを適用したうえで列ごとに仕分けしたタスク。 */
  columns: TasksByStatus;
  /** 絞り込みを通ったタスクの件数。 */
  visibleCount: number;
  /** 絞り込みの選択肢に使う担当者の一覧（絞り込み前の全タスクから作る）。 */
  assignees: string[];
  filter: BoardFilter;
  /** 指定した項目だけを差し替える。他の条件は残る。 */
  setFilter: (patch: Partial<BoardFilter>) => void;
  clearFilter: () => void;
  /** 追加できたら true。タイトルが空の場合は追加せず false を返す。 */
  addTask: (draft: TaskDraft) => boolean;
  moveTask: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
};

/**
 * ボードの状態と操作をまとめる。純粋なロジックは @/lib/board に置いてある。
 *
 * タスクの実体は localStorage を裏に持つ外部ストア（@/lib/task-store）で、
 * useSyncExternalStore 越しに読む。useToday と同じ理由で useEffect + setState は使わない
 * （Board はサーバー側でもプリレンダリングされるため、描画中に localStorage を
 * 読むとハイドレーション不一致になる。getServerSnapshot が initialTasks を返すので
 * サーバーとクライアント初回描画のマークアップは必ず一致する）。
 */
export function useBoard(initialTasks: Task[] = []): UseBoardResult {
  // ストアは初回だけ作る。initialTasks の後の変化は初期値なので無視してよい。
  const [store] = useState(() => createTaskStore(initialTasks));
  const tasks = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  // 絞り込みは表示だけの都合なので、保存せず通常の state で持つ。
  const [filter, setFilterState] = useState<BoardFilter>(EMPTY_BOARD_FILTER);

  const addTask = useCallback(
    (draft: TaskDraft) => {
      if (!isValidDraft(draft)) {
        return false;
      }
      store.update((current) => addTaskToList(current, createTask(draft)));
      return true;
    },
    [store],
  );

  const moveTask = useCallback(
    (taskId: string, status: TaskStatus) => {
      store.update((current) => moveTaskInList(current, taskId, status));
    },
    [store],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      store.update((current) => removeTaskFromList(current, taskId));
    },
    [store],
  );

  const setFilter = useCallback((patch: Partial<BoardFilter>) => {
    setFilterState((current) => ({ ...current, ...patch }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilterState(EMPTY_BOARD_FILTER);
  }, []);

  // 選択肢は絞り込み前の全タスクから作る（絞り込むと選択肢が消える、を防ぐ）。
  const assignees = useMemo(() => collectAssignees(tasks), [tasks]);

  const visibleTasks = useMemo(
    () => filterTasks(tasks, filter),
    [tasks, filter],
  );

  // 並び替えは表示のためだけのもの。tasks は追加順のまま保ち、
  // moveTask の「移動先の列の末尾に入る」振る舞いには影響させない。
  const columns = useMemo(
    () => groupByStatus(sortTasks(visibleTasks)),
    [visibleTasks],
  );

  return {
    tasks,
    columns,
    visibleCount: visibleTasks.length,
    assignees,
    filter,
    setFilter,
    clearFilter,
    addTask,
    moveTask,
    deleteTask,
  };
}
