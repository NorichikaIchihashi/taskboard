/**
 * 期限（"YYYY-MM-DD" 文字列）の判定と表示をこのモジュールに閉じ込める。
 * この形式は辞書順の比較がそのまま日付の前後の比較になるので、
 * 比較のために Date へ変換する必要がなく、タイムゾーンの影響を受けない。
 */

/** 期限の状態。「今日」に依存する判定なので、today は必ず引数で受け取る。 */
export type DueDateTone = "overdue" | "today" | "soon" | "upcoming";

/** 強調が要らない upcoming だけ空文字。日付の後ろに添える文字。 */
export const DUE_DATE_TONE_LABELS: Record<DueDateTone, string> = {
  overdue: "期限切れ",
  today: "今日",
  soon: "まもなく",
  upcoming: "",
};

/** 今日から何日後までを soon（まもなく期限）とみなすか。 */
export const DUE_SOON_DAYS = 3;

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

/**
 * "YYYY-MM-DD" に日数を足した "YYYY-MM-DD" を返す。日付として成立しない値は ""。
 * normalizeDueDate と同じく UTC で組むので、実行環境のタイムゾーンに左右されない。
 */
export function addDays(dueDate: string, days: number): string {
  const normalized = normalizeDueDate(dueDate);
  if (!normalized) {
    return "";
  }

  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
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
  if (dueDate === today) {
    return "today";
  }

  // しきい日そのものを "YYYY-MM-DD" で作れば、判定は辞書順の比較のままで済む。
  // today が壊れた値なら soonLimit は "" になり、強調しない upcoming に倒れる。
  const soonLimit = addDays(today, DUE_SOON_DAYS);
  return soonLimit && dueDate <= soonLimit ? "soon" : "upcoming";
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
