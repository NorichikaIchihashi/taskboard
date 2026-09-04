import { DEFAULT_TASK_PRIORITY, type Task, type TaskDraft } from "@/types/task";

/**
 * テスト用のタスクを組み立てる。Task にフィールドが増えても、
 * 既定値をここだけ直せば各テストのリテラルを書き換えずに済む。
 */
export function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "設計する",
    description: "",
    status: "todo",
    assignee: "",
    priority: DEFAULT_TASK_PRIORITY,
    dueDate: "",
    ...overrides,
  };
}

/** 入力フォームが渡す下書き。createTestTask と同じ役割。 */
export function createTestDraft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: "設計する",
    description: "",
    assignee: "",
    priority: DEFAULT_TASK_PRIORITY,
    dueDate: "",
    ...overrides,
  };
}
