/**
 * useSyncExternalStore に渡すための、React に依存しないタスクの外部ストア。
 *
 * localStorage を「読むたびに JSON.parse する」実装にすると getSnapshot が毎回
 * 新しい配列を返してしまい、React が無限ループとして検出してエラーになる。
 * そのため一度読んだ結果をキャッシュし、変わっていない間は同じ参照を返す。
 */

import { readStoredTasks, writeStoredTasks } from "@/lib/task-storage";
import type { Task } from "@/types/task";

export type TaskStore = {
  subscribe(listener: () => void): () => void;
  /** localStorage の内容（無ければ initialTasks）。同じ内容なら常に同じ参照。 */
  getSnapshot(): Task[];
  /** サーバー描画とハイドレーションで使う値。localStorage は読まない。 */
  getServerSnapshot(): Task[];
  update(updater: (current: Task[]) => Task[]): void;
};

/**
 * ストアはモジュール共有ではなく呼び出しごとに作る。
 * こうするとテストは localStorage を空にするだけで隔離でき、
 * ストア用のリセット関数を用意せずに済む。
 */
export function createTaskStore(initialTasks: Task[]): TaskStore {
  const listeners = new Set<() => void>();
  // null は「まだ localStorage を読んでいない」。読んだ後は必ず同じ参照を返す。
  let snapshot: Task[] | null = null;

  function getSnapshot(): Task[] {
    if (snapshot === null) {
      snapshot = readStoredTasks() ?? initialTasks;
    }
    return snapshot;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot,

    getServerSnapshot() {
      return initialTasks;
    },

    update(updater) {
      const current = getSnapshot();
      const next = updater(current);
      // moveTask などが「変化が無ければ同じ配列を返す」ので、
      // その最適化がそのまま「無駄な保存と再描画をしない」に効く。
      if (next === current) {
        return;
      }
      snapshot = next;
      writeStoredTasks(next);
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
