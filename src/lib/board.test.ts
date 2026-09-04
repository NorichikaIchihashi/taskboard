import { describe, expect, it } from "vitest";

import {
  EMPTY_BOARD_FILTER,
  addTask,
  collectAssignees,
  createTask,
  filterByStatus,
  filterTasks,
  groupByStatus,
  isFilterActive,
  isValidDraft,
  matchesFilter,
  moveTask,
  removeTask,
  sortTasks,
} from "@/lib/board";
import { createTestDraft, createTestTask } from "@/test/task";
import { TASK_STATUSES, type Task } from "@/types/task";

function task(id: string, status: Task["status"], title = id): Task {
  return createTestTask({ id, title, status });
}

describe("isValidDraft", () => {
  it("タイトルがあれば有効", () => {
    expect(isValidDraft(createTestDraft({ title: "実装する" }))).toBe(true);
  });

  it("タイトルが空、または空白のみなら無効", () => {
    expect(isValidDraft(createTestDraft({ title: "" }))).toBe(false);
    expect(isValidDraft(createTestDraft({ title: "   " }))).toBe(false);
  });
});

describe("createTask", () => {
  it("既定では未着手の列に入る", () => {
    const created = createTask(
      createTestDraft({ title: "設計", description: "画面設計" }),
    );

    expect(created).toMatchObject({
      title: "設計",
      description: "画面設計",
      status: "todo",
    });
    expect(created.id).toEqual(expect.any(String));
    expect(created.id).not.toBe("");
  });

  it("タイトル・説明・担当者の前後の空白を取り除く", () => {
    expect(
      createTask(
        createTestDraft({
          title: "  設計  ",
          description: "  画面設計  ",
          assignee: "  田中  ",
        }),
      ),
    ).toMatchObject({ title: "設計", description: "画面設計", assignee: "田中" });
  });

  it("優先度と期限をそのまま持つ", () => {
    expect(
      createTask(createTestDraft({ priority: "high", dueDate: "2026-08-25" })),
    ).toMatchObject({ priority: "high", dueDate: "2026-08-25" });
  });

  it("期限として成立しない値は未設定にする", () => {
    expect(
      createTask(createTestDraft({ dueDate: "2026-02-31" })).dueDate,
    ).toBe("");
  });

  it("id と status を指定できる", () => {
    expect(
      createTask(createTestDraft({ title: "設計" }), {
        id: "t1",
        status: "done",
      }),
    ).toEqual({
      id: "t1",
      title: "設計",
      description: "",
      status: "done",
      assignee: "",
      priority: "medium",
      dueDate: "",
    });
  });

  it("呼び出しごとに異なる id を振る", () => {
    const a = createTask(createTestDraft({ title: "a" }));
    const b = createTask(createTestDraft({ title: "b" }));

    expect(a.id).not.toBe(b.id);
  });
});

describe("addTask", () => {
  it("末尾に追加した新しい配列を返し、元の配列は変更しない", () => {
    const tasks = [task("t1", "todo")];
    const added = task("t2", "todo");

    const result = addTask(tasks, added);

    expect(result).toEqual([tasks[0], added]);
    expect(tasks).toHaveLength(1);
  });
});

describe("moveTask", () => {
  it("指定したタスクの status を書き換える", () => {
    const tasks = [task("t1", "todo"), task("t2", "todo")];

    const result = moveTask(tasks, "t1", "in-progress");

    expect(result.find((t) => t.id === "t1")?.status).toBe("in-progress");
    expect(result.find((t) => t.id === "t2")?.status).toBe("todo");
  });

  it("移動先の列の末尾に入る", () => {
    const tasks = [
      task("t1", "todo"),
      task("t2", "done"),
      task("t3", "done"),
    ];

    const result = moveTask(tasks, "t1", "done");

    expect(filterByStatus(result, "done").map((t) => t.id)).toEqual([
      "t2",
      "t3",
      "t1",
    ]);
  });

  it("元の配列を変更しない", () => {
    const tasks = [task("t1", "todo")];

    moveTask(tasks, "t1", "done");

    expect(tasks[0].status).toBe("todo");
  });

  it("存在しない id なら元の配列をそのまま返す", () => {
    const tasks = [task("t1", "todo")];

    expect(moveTask(tasks, "unknown", "done")).toBe(tasks);
  });

  it("既に移動先の列にいるなら元の配列をそのまま返す", () => {
    const tasks = [task("t1", "todo")];

    expect(moveTask(tasks, "t1", "todo")).toBe(tasks);
  });
});

describe("filterByStatus", () => {
  it("指定した status のタスクだけを順序どおりに返す", () => {
    const tasks = [
      task("t1", "todo"),
      task("t2", "done"),
      task("t3", "todo"),
    ];

    expect(filterByStatus(tasks, "todo").map((t) => t.id)).toEqual([
      "t1",
      "t3",
    ]);
  });
});

describe("sortTasks", () => {
  it("優先度が高い順に並べる", () => {
    const tasks = [
      createTestTask({ id: "low", priority: "low" }),
      createTestTask({ id: "high", priority: "high" }),
      createTestTask({ id: "medium", priority: "medium" }),
    ];

    expect(sortTasks(tasks).map((t) => t.id)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("優先度が同じなら期限が近い順に並べる", () => {
    const tasks = [
      createTestTask({ id: "late", priority: "high", dueDate: "2026-09-01" }),
      createTestTask({ id: "soon", priority: "high", dueDate: "2026-08-24" }),
    ];

    expect(sortTasks(tasks).map((t) => t.id)).toEqual(["soon", "late"]);
  });

  it("期限が無いタスクは同じ優先度の中で最後に置く", () => {
    const tasks = [
      createTestTask({ id: "none", priority: "medium", dueDate: "" }),
      createTestTask({ id: "dated", priority: "medium", dueDate: "2027-01-01" }),
    ];

    expect(sortTasks(tasks).map((t) => t.id)).toEqual(["dated", "none"]);
  });

  it("優先度の低いタスクは、期限が近くても後ろに置く", () => {
    const tasks = [
      createTestTask({ id: "low", priority: "low", dueDate: "2026-08-01" }),
      createTestTask({ id: "high", priority: "high", dueDate: "2027-12-31" }),
    ];

    expect(sortTasks(tasks).map((t) => t.id)).toEqual(["high", "low"]);
  });

  it("優先度も期限も同じなら元の順序を保つ", () => {
    const tasks = [
      createTestTask({ id: "t1", dueDate: "2026-08-25" }),
      createTestTask({ id: "t2", dueDate: "2026-08-25" }),
      createTestTask({ id: "t3", dueDate: "2026-08-25" }),
    ];

    expect(sortTasks(tasks).map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
  });

  it("元の配列を変更しない", () => {
    const tasks = [
      createTestTask({ id: "low", priority: "low" }),
      createTestTask({ id: "high", priority: "high" }),
    ];

    sortTasks(tasks);

    expect(tasks.map((t) => t.id)).toEqual(["low", "high"]);
  });
});

describe("groupByStatus", () => {
  it("3 つの列すべてのキーを必ず持つ", () => {
    expect(Object.keys(groupByStatus([]))).toEqual([...TASK_STATUSES]);
  });

  it("タスクを status ごとに、元の順序を保って仕分ける", () => {
    const tasks = [
      task("t1", "todo"),
      task("t2", "in-progress"),
      task("t3", "todo"),
      task("t4", "done"),
      task("t5", "on-hold"),
    ];

    const grouped = groupByStatus(tasks);

    expect(grouped.todo.map((t) => t.id)).toEqual(["t1", "t3"]);
    expect(grouped["in-progress"].map((t) => t.id)).toEqual(["t2"]);
    expect(grouped["on-hold"].map((t) => t.id)).toEqual(["t5"]);
    expect(grouped.done.map((t) => t.id)).toEqual(["t4"]);
  });
});

describe("removeTask", () => {
  it("指定したタスクを取り除く", () => {
    const tasks = [task("t1", "todo"), task("t2", "done")];

    expect(removeTask(tasks, "t1").map((t) => t.id)).toEqual(["t2"]);
  });

  it("該当が無ければ元の配列をそのまま返す", () => {
    const tasks = [task("t1", "todo")];

    expect(removeTask(tasks, "unknown")).toBe(tasks);
  });
});

describe("matchesFilter", () => {
  const target = createTestTask({
    id: "t1",
    title: "ログイン画面を実装する",
    description: "Google 認証に対応",
    assignee: "田中",
    priority: "high",
  });

  it("条件が空なら全て通す", () => {
    expect(matchesFilter(target, EMPTY_BOARD_FILTER)).toBe(true);
  });

  it("タイトルに含まれるキーワードで絞れる", () => {
    expect(
      matchesFilter(target, { ...EMPTY_BOARD_FILTER, query: "ログイン" }),
    ).toBe(true);
  });

  it("説明に含まれるキーワードでも絞れる", () => {
    expect(matchesFilter(target, { ...EMPTY_BOARD_FILTER, query: "認証" })).toBe(
      true,
    );
  });

  it("担当者や期限はキーワード検索の対象にしない", () => {
    expect(matchesFilter(target, { ...EMPTY_BOARD_FILTER, query: "田中" })).toBe(
      false,
    );
  });

  it("英字の大文字・小文字は無視する", () => {
    expect(matchesFilter(target, { ...EMPTY_BOARD_FILTER, query: "google" })).toBe(
      true,
    );
  });

  it("キーワードの前後の空白は無視する", () => {
    expect(
      matchesFilter(target, { ...EMPTY_BOARD_FILTER, query: "  ログイン  " }),
    ).toBe(true);
  });

  it("担当者が一致するものだけ通す", () => {
    expect(
      matchesFilter(target, { ...EMPTY_BOARD_FILTER, assignee: "田中" }),
    ).toBe(true);
    expect(
      matchesFilter(target, { ...EMPTY_BOARD_FILTER, assignee: "佐藤" }),
    ).toBe(false);
  });

  it("優先度が一致するものだけ通す", () => {
    expect(
      matchesFilter(target, { ...EMPTY_BOARD_FILTER, priority: "high" }),
    ).toBe(true);
    expect(
      matchesFilter(target, { ...EMPTY_BOARD_FILTER, priority: "low" }),
    ).toBe(false);
  });

  it("複数の条件は全て満たすものだけ通す（AND）", () => {
    expect(
      matchesFilter(target, {
        query: "ログイン",
        assignee: "田中",
        priority: "low",
      }),
    ).toBe(false);
  });
});

describe("filterTasks", () => {
  const tasks = [
    createTestTask({ id: "t1", title: "設計", assignee: "田中", priority: "high" }),
    createTestTask({ id: "t2", title: "実装", assignee: "佐藤", priority: "low" }),
  ];

  it("条件が空なら元の配列をそのまま返す", () => {
    expect(filterTasks(tasks, EMPTY_BOARD_FILTER)).toBe(tasks);
  });

  it("条件に合うタスクだけを残す", () => {
    expect(
      filterTasks(tasks, { ...EMPTY_BOARD_FILTER, assignee: "佐藤" }).map(
        (t) => t.id,
      ),
    ).toEqual(["t2"]);
  });
});

describe("isFilterActive", () => {
  it("何も指定していなければ false", () => {
    expect(isFilterActive(EMPTY_BOARD_FILTER)).toBe(false);
  });

  it("空白だけのキーワードは条件とみなさない", () => {
    expect(isFilterActive({ ...EMPTY_BOARD_FILTER, query: "   " })).toBe(false);
  });

  it("どれか 1 つでも指定されていれば true", () => {
    expect(isFilterActive({ ...EMPTY_BOARD_FILTER, query: "設計" })).toBe(true);
    expect(isFilterActive({ ...EMPTY_BOARD_FILTER, assignee: "田中" })).toBe(true);
    expect(isFilterActive({ ...EMPTY_BOARD_FILTER, priority: "high" })).toBe(true);
  });
});

describe("collectAssignees", () => {
  it("重複を除いた担当者を返す", () => {
    const assignees = collectAssignees([
      createTestTask({ id: "t1", assignee: "田中" }),
      createTestTask({ id: "t2", assignee: "佐藤" }),
      createTestTask({ id: "t3", assignee: "田中" }),
    ]);

    expect(assignees).toEqual(["佐藤", "田中"]);
  });

  it("未設定（空文字）は選択肢に含めない", () => {
    expect(
      collectAssignees([
        createTestTask({ id: "t1", assignee: "" }),
        createTestTask({ id: "t2", assignee: "鈴木" }),
      ]),
    ).toEqual(["鈴木"]);
  });
});
