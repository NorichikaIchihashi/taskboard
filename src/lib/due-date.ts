/**
 * 期限（"YYYY-MM-DD" 文字列）の判定と表示をこのモジュールに閉じ込める。
 * この形式は辞書順の比較がそのまま日付の前後の比較になるので、
 * 比較のために Date へ変換する必要がなく、タイムゾーンの影響を受けない。
 */

/** 期限の状態。「今日」に依存する判定なので、today は必ず引数で受け取る。 */
export type DueDateTone = "overdue" | "today" | "upcoming";

/** 強調が要らない upcoming だけ空文字。日付の後ろに添える文字。 */
export const DUE_DATE_TONE_LABELS: Record<DueDateTone, string> = {
  overdue: "期限切れ",
  today: "今日",
  upcoming: "",
};

const DUE_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "YYYY-MM-DD" として実在する日付なら正規化して返す。そうでなければ ""（未設定）。 */
export function normalizeDueDate(value: string): string {
  const trimmed = value.trim();
  const matched = DUE_DATE_PATTERN.exec(trimmed);
  if (!matched) {
    return "";
  }

  const [, year, month, day] = matched.map(Number);
  // 2026-02-31 のように桁は合っていても存在しない日付は、組み直すと別の日にずれる。
  // UTC で組むので実行環境のタイムゾーンに左右されない。
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isRealDate ? trimmed : "";
}

/** 期限が無いか、今日が分からない（マウント前）ときは判定しない。 */
export function getDueDateTone(
  dueDate: string,
  today: string,
): DueDateTone | null {
  if (!dueDate || !today) {
    return null;
  }
  if (dueDate < today) {
    return "overdue";
  }
  return dueDate === today ? "today" : "upcoming";
}

/** 今日と同じ年なら "08/25"、違う年や今日が不明なら "2027/01/05"。 */
export function formatDueDate(dueDate: string, today: string): string {
  if (!dueDate) {
    return "";
  }
  const [year, month, day] = dueDate.split("-");
  return today.startsWith(`${year}-`)
    ? `${month}/${day}`
    : `${year}/${month}/${day}`;
}

/** ローカルの今日を "YYYY-MM-DD" で返す。現在時刻に触れるのはここだけ。 */
export function todayString(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
