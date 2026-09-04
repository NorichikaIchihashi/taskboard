#!/usr/bin/env bash
# PostToolUse（Write|Edit）用 — 編集されたファイルが TypeScript のときだけ lint とテストを走らせる。
#
# 終了コードの意味（PostToolUse フックの規約）:
#   0 … 問題なし。何も出力しない
#   2 … ブロッキングエラー。stderr の内容が Claude に返るので、そのまま修正に入れる
#
# lint 約 8 秒 + test 約 7 秒 = 1 回あたり約 15 秒かかる。TypeScript 以外は
# 即 exit 0 で抜けるので、Markdown や JSON の編集では待たされない。
set -uo pipefail

# CLAUDE_PROJECT_DIR が無い場合はスクリプト位置（.claude/hooks/）から 2 つ上を辿る
readonly PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# --- 1. stdin のフック JSON から編集対象のパスを取り出す ----------------------
# このマシンに jq が無いので node で読む（Next.js プロジェクトなので node は必ずある）。
# Write は tool_response.filePath、Edit は tool_input.file_path に入るため両方見る。
file_path=$(node -e '
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const j = JSON.parse(raw);
    process.stdout.write(j.tool_response?.filePath ?? j.tool_input?.file_path ?? "");
  } catch {
    process.stdout.write("");
  }
});
' 2>/dev/null)

[[ -n "$file_path" ]] || exit 0

# --- 2. TypeScript 以外、およびプロジェクト外の編集は何もしない ----------------
case "$file_path" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  "$PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac

cd "$PROJECT_DIR" || exit 0

# --- 3. lint → test の順に走らせ、最初に落ちた時点で止める --------------------
# lint を先にするのは、import 漏れや未使用変数をテストより速く弾けるため。
if ! output=$(npm run lint 2>&1); then
  printf '%s を編集した後の `npm run lint` が失敗しました:\n\n%s\n' "$file_path" "$output" >&2
  exit 2
fi

if ! output=$(npm test 2>&1); then
  printf '%s を編集した後の `npm test` が失敗しました:\n\n%s\n' "$file_path" "$output" >&2
  exit 2
fi

exit 0
