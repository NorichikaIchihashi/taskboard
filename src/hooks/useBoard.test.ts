import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useBoard } from "@/hooks/useBoard";
import { EMPTY_BOARD_FILTER } from "@/lib/board";
import { readStoredTasks, writeStoredTasks } from "@/lib/task-storage";
import { createTestDraft, createTestTask } from "@/test/task";
import type { Task } from "@/types/task";

const initialTasks: Task[] = [createTestTask({ id: "t1", title: "設計" })];

describe("useBoard", () => {
  it("初期タスクを列ごとに配る", () => {
    const { result } = renderHook(() => useBoard(initialTasks));

    expect(result.current.columns.todo.map((t) => t.id)).toEqual(["t1"]);
    expect(result.current.columns["in-progress"]).toEqual([]);
    expect(result.current.columns["on-hold"]).toEqual([]);
    expect(result.current.columns.done).toEqual([]);
  });

  it("追加したタスクは未着手の列に入り、true を返す", () => {
    const { result } = renderHook(() => useBoard());

    let added = false;
    act(() => {
      added = result.current.addTask(
        createTestDraft({ title: "実装", description: "本体" }),
      );
    });

    expect(added).toBe(true);
    expect(result.current.columns.todo).toHaveLength(1);
    expect(result.current.columns.todo[0]).toMatchObject({
      title: "実装",
      description: "本体",
    });
  });

  it("担当者・優先度・期限も保持する", () => {
    const { result } = renderHook(() => useBoard());

    act(() => {
      result.current.addTask(
        createTestDraft({
          title: "実装",
          assignee: "田中",
          priority: "high",
          dueDate: "2026-08-25",
        }),
      );
    });

    expect(result.current.columns.todo[0]).toMatchObject({
      assignee: "田中",
      priority: "high",
      dueDate: "2026-08-25",
    });
  });

  it("タイトルが空なら追加せず false を返す", () => {
    const { result } = renderHook(() => useBoard());

    let added = true;
    act(() => {
      added = result.current.addTask(createTestDraft({ title: "  " }));
    });

    expect(added).toBe(false);
    expect(result.current.tasks).toEqual([]);
  });

  it("列の中では優先度が高い順・期限が近い順に並ぶ", () => {
    const { result } = renderHook(() =>
      useBoard([
        createTestTask({ id: "low", priority: "low" }),
        createTestTask({ id: "high-late", priority: "high", dueDate: "2027-01-01" }),
        createTestTask({ id: "high-soon", priority: "high", dueDate: "2026-08-24" }),
      ]),
    );

    expect(result.current.columns.todo.map((t) => t.id)).toEqual([
      "high-soon",
      "high-late",
      "low",
    ]);
  });

  it("並び替えは表示だけで、tasks は追加順のまま保つ", () => {
    const { result } = renderHook(() =>
      useBoard([createTestTask({ id: "low", priority: "low" })]),
    );

    act(() => {
      result.current.addTask(createTestDraft({ title: "急ぎ", priority: "high" }));
    });

    expect(result.current.tasks.map((t) => t.title)).toEqual([
      "設計する",
      "急ぎ",
    ]);
    expect(result.current.columns.todo.map((t) => t.title)).toEqual([
      "急ぎ",
      "設計する",
    ]);
  });

  it("タスクを別の列へ移せる", () => {
    const { result } = renderHook(() => useBoard(initialTasks));

    act(() => {
      result.current.moveTask("t1", "done");
    });

    expect(result.current.columns.todo).toEqual([]);
    expect(result.current.columns.done.map((t) => t.id)).toEqual(["t1"]);
  });

  it("存在しないタスクの移動は何も変えない", () => {
    const { result } = renderHook(() => useBoard(initialTasks));
    const before = result.current.tasks;

    act(() => {
      result.current.moveTask("unknown", "done");
    });

    expect(result.current.tasks).toBe(before);
  });
});

describe("useBoard の永続化", () => {
  it("追加したタスクを localStorage に保存する", () => {
    const { result } = renderHook(() => useBoard());

    act(() => {
      result.current.addTask(createTestDraft({ title: "保存される" }));
    });

    expect(readStoredTasks()?.map((t) => t.title)).toEqual(["保存される"]);
  });

  it("移動と削除も保存に反映される", () => {
    const { result } = renderHook(() => useBoard(initialTasks));

    act(() => {
      result.current.moveTask("t1", "done");
    });
    expect(readStoredTasks()?.[0].status).toBe("done");

    act(() => {
      result.current.deleteTask("t1");
    });
    expect(readStoredTasks()).toEqual([]);
  });

  it("保存済みタスクがあれば initialTasks より優先する", () => {
    writeStoredTasks([createTestTask({ id: "saved", title: "保存済み" })]);

    const { result } = renderHook(() => useBoard(initialTasks));

    expect(result.current.tasks.map((t) => t.id)).toEqual(["saved"]);
  });

  it("再マウントしても保存内容から復元する（リロード相当）", () => {
    const first = renderHook(() => useBoard(initialTasks));
    act(() => {
      first.result.current.addTask(createTestDraft({ title: "残るタスク" }));
    });
    first.unmount();

    const second = renderHook(() => useBoard(initialTasks));

    expect(second.result.current.tasks.map((t) => t.title)).toEqual([
      "設計",
      "残るタスク",
    ]);
  });
});

describe("useBoard の削除", () => {
  it("タスクを取り除く", () => {
    const { result } = renderHook(() => useBoard(initialTasks));

    act(() => {
      result.current.deleteTask("t1");
    });

    expect(result.current.columns.todo).toEqual([]);
  });

  it("存在しないタスクの削除は何も変えない", () => {
    const { result } = renderHook(() => useBoard(initialTasks));
    const before = result.current.tasks;

    act(() => {
      result.current.deleteTask("unknown");
    });

    expect(result.current.tasks).toBe(before);
  });
});

describe("useBoard の絞り込み", () => {
  const filterTasksFixture: Task[] = [
    createTestTask({
      id: "t1",
      title: "ログイン画面",
      description: "認証を実装",
      assignee: "田中",
      priority: "high",
    }),
    createTestTask({
      id: "t2",
      title: "設定画面",
      assignee: "佐藤",
      priority: "low",
      status: "done",
    }),
  ];

  it("既定では絞り込んでいない", () => {
    const { result } = renderHook(() => useBoard(filterTasksFixture));

    expect(result.current.filter).toEqual(EMPTY_BOARD_FILTER);
    expect(result.current.visibleCount).toBe(2);
  });

  it("キーワードで列の中身が絞られる", () => {
    const { result } = renderHook(() => useBoard(filterTasksFixture));

    act(() => {
      result.current.setFilter({ query: "認証" });
    });

    expect(result.current.columns.todo.map((t) => t.id)).toEqual(["t1"]);
    expect(result.current.columns.done).toEqual([]);
    expect(result.current.visibleCount).toBe(1);
  });

  it("担当者と優先度でも絞れる", () => {
    const { result } = renderHook(() => useBoard(filterTasksFixture));

    act(() => {
      result.current.setFilter({ assignee: "佐藤" });
    });
    expect(result.current.visibleCount).toBe(1);

    act(() => {
      result.current.setFilter({ priority: "high" });
    });
    // 条件は積み重なる（担当者 佐藤 かつ 優先度 高 は 0 件）。
    expect(result.current.visibleCount).toBe(0);
  });

  it("絞り込んでも tasks は全件のまま保つ", () => {
    const { result } = renderHook(() => useBoard(filterTasksFixture));

    act(() => {
      result.current.setFilter({ query: "認証" });
    });

    expect(result.current.tasks).toHaveLength(2);
  });

  it("担当者の選択肢は絞り込み前の全タスクから作る", () => {
    const { result } = renderHook(() => useBoard(filterTasksFixture));

    act(() => {
      result.current.setFilter({ assignee: "田中" });
    });

    expect(result.current.assignees).toEqual(["佐藤", "田中"]);
  });

  it("絞り込みを解除すると全件に戻る", () => {
    const { result } = renderHook(() => useBoard(filterTasksFixture));

    act(() => {
      result.current.setFilter({ query: "認証", priority: "high" });
    });
    act(() => {
      result.current.clearFilter();
    });

    expect(result.current.filter).toEqual(EMPTY_BOARD_FILTER);
    expect(result.current.visibleCount).toBe(2);
  });
});
