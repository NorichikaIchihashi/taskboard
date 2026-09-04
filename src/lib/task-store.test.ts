import { describe, expect, it, vi } from "vitest";

import { createTaskStore } from "@/lib/task-store";
import { TASKS_STORAGE_KEY, writeStoredTasks } from "@/lib/task-storage";
import { createTestTask } from "@/test/task";
import type { Task } from "@/types/task";

const initialTasks: Task[] = [createTestTask({ id: "sample", title: "見本" })];

describe("createTaskStore の読み取り", () => {
  it("保存が無ければ initialTasks を返す", () => {
    const store = createTaskStore(initialTasks);

    expect(store.getSnapshot()).toEqual(initialTasks);
  });

  it("保存があればそちらを優先する", () => {
    writeStoredTasks([createTestTask({ id: "saved", title: "保存済み" })]);
    const store = createTaskStore(initialTasks);

    expect(store.getSnapshot().map((task) => task.id)).toEqual(["saved"]);
  });

  it("保存が空配列なら、空のボードとして復元する", () => {
    writeStoredTasks([]);
    const store = createTaskStore(initialTasks);

    expect(store.getSnapshot()).toEqual([]);
  });

  it("何度呼んでも同じ参照を返す（useSyncExternalStore の無限ループを避ける）", () => {
    writeStoredTasks([createTestTask({ id: "saved" })]);
    const store = createTaskStore(initialTasks);

    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("getServerSnapshot は保存を読まず、常に initialTasks を返す", () => {
    writeStoredTasks([createTestTask({ id: "saved" })]);
    const store = createTaskStore(initialTasks);

    expect(store.getServerSnapshot()).toBe(initialTasks);
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
  });
});

describe("createTaskStore の更新", () => {
  it("更新すると新しい内容が localStorage に書かれる", () => {
    const store = createTaskStore(initialTasks);
    const added = createTestTask({ id: "t2", title: "追加" });

    store.update((current) => [...current, added]);

    expect(store.getSnapshot().map((task) => task.id)).toEqual([
      "sample",
      "t2",
    ]);
    expect(createTaskStore([]).getSnapshot().map((task) => task.id)).toEqual([
      "sample",
      "t2",
    ]);
  });

  it("更新するとリスナーが呼ばれる", () => {
    const store = createTaskStore(initialTasks);
    const listener = vi.fn();
    store.subscribe(listener);

    store.update((current) => [...current]);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("更新関数が同じ参照を返したら、書き込みもリスナーの呼び出しもしない", () => {
    const store = createTaskStore(initialTasks);
    const listener = vi.fn();
    store.subscribe(listener);

    store.update((current) => current);

    expect(listener).not.toHaveBeenCalled();
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBeNull();
  });

  it("解除したリスナーは呼ばれない", () => {
    const store = createTaskStore(initialTasks);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.update((current) => [...current]);

    expect(listener).not.toHaveBeenCalled();
  });

  it("ストアごとに独立している（テスト間で状態が漏れない）", () => {
    const first = createTaskStore(initialTasks);
    first.update(() => [createTestTask({ id: "t9" })]);

    // 別のストアは自分で localStorage を読み直す。
    expect(createTaskStore([]).getSnapshot().map((task) => task.id)).toEqual([
      "t9",
    ]);
  });
});
