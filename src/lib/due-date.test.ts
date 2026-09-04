import { describe, expect, it } from "vitest";

import {
  DUE_DATE_TONE_LABELS,
  formatDueDate,
  getDueDateTone,
  normalizeDueDate,
  todayString,
} from "@/lib/due-date";

describe("normalizeDueDate", () => {
  it("YYYY-MM-DD 形式の実在する日付はそのまま返す", () => {
    expect(normalizeDueDate("2026-08-25")).toBe("2026-08-25");
    expect(normalizeDueDate("2024-02-29")).toBe("2024-02-29");
  });

  it("前後の空白を取り除く", () => {
    expect(normalizeDueDate("  2026-08-25  ")).toBe("2026-08-25");
  });

  it("未設定は空文字のまま", () => {
    expect(normalizeDueDate("")).toBe("");
    expect(normalizeDueDate("   ")).toBe("");
  });

  it("形式が違う値は空文字にする", () => {
    expect(normalizeDueDate("2026/08/25")).toBe("");
    expect(normalizeDueDate("26-08-25")).toBe("");
    expect(normalizeDueDate("きょう")).toBe("");
  });

  it("形式は合っていても存在しない日付は空文字にする", () => {
    expect(normalizeDueDate("2026-13-01")).toBe("");
    expect(normalizeDueDate("2026-02-31")).toBe("");
    expect(normalizeDueDate("2026-00-10")).toBe("");
    expect(normalizeDueDate("2025-02-29")).toBe("");
  });
});

describe("getDueDateTone", () => {
  const today = "2026-08-23";

  it("今日より前なら期限切れ", () => {
    expect(getDueDateTone("2026-08-22", today)).toBe("overdue");
    expect(getDueDateTone("2025-12-31", today)).toBe("overdue");
  });

  it("今日と同じ日なら today", () => {
    expect(getDueDateTone(today, today)).toBe("today");
  });

  it("今日より後なら upcoming", () => {
    expect(getDueDateTone("2026-08-24", today)).toBe("upcoming");
    expect(getDueDateTone("2027-01-01", today)).toBe("upcoming");
  });

  it("期限が無い、または今日が分からないときは判定しない", () => {
    expect(getDueDateTone("", today)).toBeNull();
    expect(getDueDateTone("2026-08-22", "")).toBeNull();
  });
});

describe("DUE_DATE_TONE_LABELS", () => {
  it("強調する状態にだけ表示用の文字を持つ", () => {
    expect(DUE_DATE_TONE_LABELS.overdue).toBe("期限切れ");
    expect(DUE_DATE_TONE_LABELS.today).toBe("今日");
    expect(DUE_DATE_TONE_LABELS.upcoming).toBe("");
  });
});

describe("formatDueDate", () => {
  it("今日と同じ年なら月日だけを出す", () => {
    expect(formatDueDate("2026-08-25", "2026-08-23")).toBe("08/25");
  });

  it("年が違えば年から出す", () => {
    expect(formatDueDate("2027-01-05", "2026-08-23")).toBe("2027/01/05");
  });

  it("今日が分からないときは年から出す", () => {
    expect(formatDueDate("2026-08-25", "")).toBe("2026/08/25");
  });

  it("期限が無ければ空文字", () => {
    expect(formatDueDate("", "2026-08-23")).toBe("");
  });
});

describe("todayString", () => {
  it("渡された日時をローカルの YYYY-MM-DD にする", () => {
    expect(todayString(new Date(2026, 7, 23, 13, 45))).toBe("2026-08-23");
  });

  it("月日を 2 桁にゼロ埋めする", () => {
    expect(todayString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("引数を省略すると現在の日付を返す", () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
