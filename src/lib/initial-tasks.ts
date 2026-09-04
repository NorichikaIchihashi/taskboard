import type { Task } from "@/types/task";

/**
 * 初回表示用のサンプル。空にすれば何もないボードから始まる。
 * 期限は固定の日付にしてある（相対日付にすると、静的レンダリングされる
 * app/page.tsx ではビルド時刻に焼き付いてしまうため）。
 */
export const INITIAL_TASKS: Task[] = [
  {
    id: "sample-1",
    title: "要件をまとめる",
    description: "カンバンに必要な機能を洗い出す",
    status: "todo",
    assignee: "田中",
    priority: "high",
    dueDate: "2026-08-20",
  },
  {
    id: "sample-2",
    title: "テストを追加する",
    description: "",
    status: "todo",
    assignee: "",
    priority: "low",
    dueDate: "",
  },
  {
    id: "sample-3",
    title: "カンバンボードを実装する",
    description: "未着手・進行中・保留・完了の 4 列",
    status: "in-progress",
    assignee: "佐藤",
    priority: "high",
    dueDate: "2027-03-31",
  },
  {
    id: "sample-4",
    title: "デザインの方針を決める",
    description: "配色をレビュー待ち",
    status: "on-hold",
    assignee: "鈴木",
    priority: "medium",
    dueDate: "",
  },
  {
    id: "sample-5",
    title: "プロジェクトを作成する",
    description: "create-next-app で雛形を用意",
    status: "done",
    assignee: "田中",
    priority: "low",
    dueDate: "2026-08-01",
  },
];
