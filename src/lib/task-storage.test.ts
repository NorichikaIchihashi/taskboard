import { describe, expect, it, onTestFinished, vi } from "vitest";

import {
  TASKS_STORAGE_KEY,
  parseStoredTasks,
  readStoredTasks,
  serializeTasks,
  writeStoredTasks,
} from "@/lib/task-storage";
import { createTestTask } from "@/test/task";
import { DEFAULT_TASK_PRIORITY } from "@/types/task";

/** 保存値を直接組み立てるためのヘルパー（型を外して壊れた値も書けるようにする）。 */
function store(value: unknown): string {
  return JSON.stringify(value);
}

describe("serializeTasks / parseStoredTasks", () => {
  it("保存して読み直すと同じ内容に戻る", () => {
    const tasks = [
      createTestTask({
        id: "t1",
        title: "設計する",
        description: "画面構成",
        status: "in-progress",
        assignee: "田中",
        priority: "high",
        dueDate: "2026-08-25",
      }),
      createTestTask({ id: "t2", title: "実装する" }),
    ];

    expect(parseStoredTasks(serializeTasks(tasks))).toEqual(tasks);
  });

  it("保存が無ければ null（＝サンプルを使う）", () => {
    expect(parseStoredTasks(null)).toBeNull();
  });

  it("JSON として壊れていれば null", () => {
    expect(parseStoredTasks("{ではない")).toBeNull();
  });

  it("配列でなければ null", () => {
    expect(parseStoredTasks(store({ tasks: [] }))).toBeNull();
  });

  it("空配列は「全部消した」という有効な保存値なので null にしない", () => {
    expect(parseStoredTasks(store([]))).toEqual([]);
  });
});

describe("parseStoredTasks の復元", () => {
  it("定義に無い status は未着手に倒す", () => {
    const parsed = parseStoredTasks(
      store([{ ...createTestTask({ id: "t1" }), status: "archived" }]),
    );

    expect(parsed?.[0].status).toBe("todo");
  });

  it("定義に無い priority は既定値に倒す", () => {
    const parsed = parseStoredTasks(
      store([{ ...createTestTask({ id: "t1" }), priority: "urgent" }]),
    );

    expect(parsed?.[0].priority).toBe(DEFAULT_TASK_PRIORITY);
  });

  it("期限として成立しない値は未設定に倒す", () => {
    const parsed = parseStoredTasks(
      store([{ ...createTestTask({ id: "t1" }), dueDate: "2026-02-31" }]),
    );

    expect(parsed?.[0].dueDate).toBe("");
  });

  it("欠けている文字列フィールドは空文字で埋める", () => {
    const parsed = parseStoredTasks(store([{ id: "t1", title: "設計する" }]));

    expect(parsed?.[0]).toEqual({
      id: "t1",
      title: "設計する",
      description: "",
      status: "todo",
      assignee: "",
      priority: DEFAULT_TASK_PRIORITY,
      dueDate: "",
    });
  });

  it("id と title を欠く要素だけを捨てて、残りは復元する", () => {
    const parsed = parseStoredTasks(
      store([
        { title: "id が無い" },
        createTestTask({ id: "t2", title: "無事" }),
        null,
        "文字列",
      ]),
    );

    expect(parsed?.map((task) => task.id)).toEqual(["t2"]);
  });
});

describe("readStoredTasks / writeStoredTasks", () => {
  it("書き込んだ内容をそのまま読み戻せる", () => {
    const tasks = [createTestTask({ id: "t1", assignee: "佐藤" })];

    writeStoredTasks(tasks);

    expect(localStorage.getItem(TASKS_STORAGE_KEY)).not.toBeNull();
    expect(readStoredTasks()).toEqual(tasks);
  });

  it("何も保存されていなければ null", () => {
    expect(readStoredTasks()).toBeNull();
  });

  it("storage が使えなくても例外を投げない（サーバー側・プライベートモード）", () => {
    expect(() => writeStoredTasks([createTestTask()], null)).not.toThrow();
    expect(readStoredTasks(null)).toBeNull();
  });

  it("書き込みが拒否されても例外を投げない", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });
    // アサーションが落ちてもスパイを確実に戻す。
    onTestFinished(() => setItem.mockRestore());

    expect(() => writeStoredTasks([createTestTask()])).not.toThrow();
    expect(setItem).toHaveBeenCalled();
  });
});
