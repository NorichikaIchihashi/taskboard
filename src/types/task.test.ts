import { describe, expect, it } from "vitest";

import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  isTaskPriority,
} from "@/types/task";

describe("isTaskPriority", () => {
  it("定義済みの優先度なら true", () => {
    for (const priority of TASK_PRIORITIES) {
      expect(isTaskPriority(priority)).toBe(true);
    }
  });

  it("定義に無い値なら false", () => {
    expect(isTaskPriority("urgent")).toBe(false);
    expect(isTaskPriority("")).toBe(false);
    expect(isTaskPriority(undefined)).toBe(false);
  });
});

describe("TASK_PRIORITY_LABELS", () => {
  it("高い順に並んだ全ての優先度のラベルを持つ", () => {
    expect(TASK_PRIORITIES.map((p) => TASK_PRIORITY_LABELS[p])).toEqual([
      "高",
      "中",
      "低",
    ]);
  });
});
