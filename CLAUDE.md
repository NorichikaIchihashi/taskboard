# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

TaskBoard — `未着手 / 進行中 / 保留 / 完了` の 4 列で管理するカンバンボード。
Next.js 16（App Router）+ TypeScript + Tailwind CSS v4、テストは Vitest。
タスクは担当者・優先度・期限を持ち、列の中では優先度と期限で自動的に並ぶ。

上の `@AGENTS.md` は `next dev` が管理する Next.js 16 のエージェント向け規約を読み込む
（「訓練データではなく `node_modules/next/dist/docs/` を読め」という指示）。この行は消さないこと。

## コマンド

```bash
npm run dev          # 開発サーバー（http://localhost:3000）
npm run build        # 本番ビルド
npm test             # テストを一度だけ実行（vitest run）
npm run test:watch   # ウォッチモード
npm run lint         # ESLint
npx tsc --noEmit     # 型チェック（lint とは別に必要）
```

単一テストの実行:

```bash
npx vitest run src/lib/board.test.ts     # ファイル指定
npx vitest run -t "moveTask"             # describe / it 名で絞り込み
```

変更を入れたら `npx tsc --noEmit` → `npm run lint` → `npm test` → `npm run build` の順で確認する。
`npm run lint` は型エラーを見ないので、型チェックを省略しない。

## アーキテクチャ

### 列は `TASK_STATUSES` が唯一の情報源

`src/types/task.ts` の `TASK_STATUSES` 配列が**そのまま画面上の列の並び順**になる。
列の追加・削除・並べ替えは、この配列と `TASK_STATUS_LABELS` を編集するだけで完了する:

| 追従するもの | 理由 |
|---|---|
| `lib/board.ts` の `groupByStatus` | `TASK_STATUSES` から全キーを生成 |
| `components/Board.tsx` の列描画 | `TASK_STATUSES.map(...)` |
| `components/TaskMoveControls.tsx` | `TASK_STATUSES.indexOf` の前後を隣の列とみなす |
| `components/BoardColumn.tsx` / `ColumnHeader.tsx` | `TASK_STATUS_LABELS` を引くだけ |

`TASK_STATUS_LABELS` は `Record<TaskStatus, string>` なのでラベルの追加漏れは `tsc` が捕まえる。
**列を直接ハードコードする実装を新たに足さないこと。**

なお `data-testid` は `column-<status>` 形式（例: `column-on-hold`）で、テストはこの id と
`aria-label`（＝日本語の列名）で列を特定している。

### 優先度も同じ「配列が順序の情報源」パターン

`TASK_PRIORITIES`（`["high", "medium", "low"]`）の**並び順がそのまま「優先度の高い順」**で、
`lib/board.ts` の `sortTasks` は `TASK_PRIORITIES.indexOf(...)` で順位を求めている
（`TaskMoveControls` が `TASK_STATUSES.indexOf` で隣の列を求めているのと同じ考え方）。
優先度を増やす・並べ替えるときは `TASK_PRIORITIES` と `TASK_PRIORITY_LABELS` を直すだけでよく、
**比較関数に順位表をハードコードしないこと。**

### 期限と「今日」

期限は `Date` ではなく `"YYYY-MM-DD"` 文字列で持つ。この形式は**辞書順の比較が
そのまま日付の前後の比較**になるので、比較のために `Date` へ変換する必要がない。
未設定は `null` ではなく `""`（`description` と同じ扱い）。

期限まわりの判断は `src/lib/due-date.ts` に閉じ込めてある。

- **`lib` の中で現在時刻を読まない。** `getDueDateTone(dueDate, today)` のように「今日」は
  必ず引数で受け取る。現在時刻に触れるのは `todayString(now = new Date())` だけで、
  既定引数のおかげでテストから固定の `Date` を渡せる
- **`useToday` は `useSyncExternalStore` を使う。** `Board` はサーバー側でもプリレンダリング
  されるため、描画中に現在時刻を読むとハイドレーション不一致になる。`getServerSnapshot` が
  `""` を返し、`getDueDateTone` は `today === ""` のとき `null`（＝強調なし）を返すので、
  サーバーとクライアント初回描画のマークアップが必ず一致する。
  `useEffect` + `setState` で書き直さないこと（`react-hooks/set-state-in-effect` に弾かれる）
- `Board` の `today` プロップは、統合テストが固定日を注入するための入口。`app/page.tsx` は渡さない
- `initial-tasks.ts` の期限を「今日からの相対日付」にしないこと。`app/page.tsx` は静的
  レンダリングされるため、`new Date()` はビルド時刻に焼き付いて `dev` でしか正しく見えない

### 3 層構造

```
lib/      React に依存しない純粋関数（並び替え・バリデーション・仕分け）
hooks/    状態と操作（useBoard）
components/  表示と DOM イベント
```

新しい判断ロジックは `lib/` の純粋関数として書き、hook とコンポーネントからは呼ぶだけにする。
`app/page.tsx` は Server Component で、`Board` 以下が Client Component（境界は `Board.tsx` の `"use client"`）。

### localStorage 永続化

タスクの実体は `src/lib/task-store.ts` の外部ストアで、`useBoard` が `useSyncExternalStore`
越しに読む。保存が無いときだけ `initial-tasks.ts` のサンプルが出る。

- **`useEffect` + `setState` で復元しないこと。** `react-hooks/set-state-in-effect` に弾かれるし、
  `Board` はサーバー側でもプリレンダリングされるので描画中に localStorage を読むと
  ハイドレーション不一致になる。`useToday` と全く同じ理由・同じ手段（`getServerSnapshot`）
- **`getSnapshot` は毎回同じ参照を返すこと。** 読むたび `JSON.parse` すると毎回新しい配列になり、
  React が無限ループとして検出してエラーになる。`task-store.ts` は一度読んだ結果をキャッシュしている
- **`store.update` は更新関数が同じ参照を返したら何もしない。** `moveTask` / `removeTask` の
  「変化が無ければ同じ配列」がそのまま「無駄な保存と再描画をしない」に効く
- localStorage アクセスは `src/lib/task-storage.ts` に閉じ込め、`Storage` は
  `todayString(now = new Date())` と同じく既定引数で受け取る（`lib` が暗黙にグローバルを読まない）
- 保存値が壊れていてもエラーにせず既定値に倒す（`normalizeDueDate` と同じ思想）。
  ただし `id` / `title` を欠く要素だけは捨てる。キーが無い・JSON が壊れている場合は `null` を返し、
  **空配列 `[]`（＝全部消した）と区別する**
- 保存形式を変えるときは `TASKS_STORAGE_KEY` の `v1` を上げる

### 検索と絞り込み

`BoardFilter`（`query` / `assignee` / `priority`、どれも `""` が「すべて」）を `useBoard` が
通常の state で持ち、`filterTasks` を通してから `sortTasks` → `groupByStatus` に渡す。

- **絞り込みは保存しない。** 条件を掛けたままリロードすると「タスクが消えた」と誤解されるため
- 担当者の選択肢（`collectAssignees`）は**絞り込み前**の全タスクから作る（選択肢が消えないように）
- `BoardFilterBar` のラベルは「担当者で絞り込む」「優先度で絞り込む」。
  `AddTaskForm` の「担当者」「優先度」と同じ名前にすると `getByLabelText` が曖昧になる
- `BoardFilterBar` の外側は `section` ではなく `search` 要素。名前付きの `section` は
  `role="region"` になり、列を数えている `getAllByRole("region")` に混ざる

### 意図的な設計判断

- **`moveTask` は変化がないとき同じ配列参照を返す**（対象が無い / 既に移動先の列にいる）。
  無駄な再描画を避けるためで、テストが `toBe` で参照の同一性を検証している。壊さないこと。
  `removeTask` と `filterTasks`（条件が空のとき）も同じ約束に揃えてある。
- **タスクは移動先の列の末尾に入る。** フラットな `Task[]` を `groupByStatus` で仕分ける構造のため、
  `moveTask` は対象を配列から取り除いて末尾に付け直している。
- **並び替えは表示だけの都合。** `useBoard` は `groupByStatus(sortTasks(tasks))` を `useMemo` の
  中で組み立てており、`tasks`（フラットな配列）は追加順のまま。画面上は優先度順に見えるが、
  上の「末尾に入る」振る舞いと `moveTask` の参照同一性の最適化はそのまま生きている。
  `sortTasks` は毎回新しい配列を返すが、`useMemo` の中でしか呼ばないので再描画は増えない。
- **`← / →` ボタンは D&D の代替手段。** HTML5 D&D はキーボードとタッチで動かないため、
  `TaskMoveControls` が同じ `onMove` を呼ぶ。両者の経路は `TASK_STATUSES` 順で一致させる。

### ドラッグ＆ドロップ

ライブラリを使わず HTML5 ネイティブ D&D。`DataTransfer` の扱いは `src/lib/dnd.ts` に閉じ込めてあり、
コンポーネントは MIME タイプやフォールバックを知らない。

- ドラッグ中は `getData` が読めない（ブラウザの保護モード）。
  `dragover` では `types` だけを見る `hasTaskPayload` で判定し、`drop` で初めて `getDragTaskId` を呼ぶ
- 独自 MIME `application/x-taskboard-task` と `text/plain` の両方に書き込む（読み取りは前者優先）
- 列の内側でカード間を移動しただけの `dragleave` は `currentTarget.contains(relatedTarget)` で無視する

## テスト

テストはソースと同じ場所に `*.test.ts(x)` として置く（`src/**/*.test.{ts,tsx}` のみ拾う設定）。

`Task` / `TaskDraft` のリテラルは `src/test/task.ts` の `createTestTask` / `createTestDraft` で
組み立てる。フィールドが増えたときに直すのがこの 1 ファイルで済む。

カードの状態は色ではなく **data 属性**で検証する（列の `data-drop-active` と同じ方針）。

jsdom には実物の `localStorage` があるのでモックは不要。後片付けは `src/test/setup.ts` の
`afterEach` にある `localStorage.clear()` にまとめてある（ストアは `useBoard` の中で
呼び出しごとに作られるので、これだけでテストは隔離される）。
「リロードしても残る」は `render` の戻り値の `unmount()` → 再 `render()` で表現する。

| 属性 | 値 |
|---|---|
| `data-priority` | `high` / `medium` / `low` |
| `data-due-tone` | `overdue` / `today` / `soon` / `upcoming` / `none`（`none` は「今日」が未確定） |

担当者・優先度・期限は `aria-label`（`担当者: 田中` / `優先度: 高` / `期限: 2026-08-20（期限切れ）`）
でも引ける。

jsdom に `DataTransfer` が無いため、`src/test/dnd.ts` のスタブを
`fireEvent.dragStart / dragOver / drop` の第 2 引数に渡して、実際のイベント経路ごと検証している。
testing-library が `dataTransfer` キーを特別扱いしてイベントに載せる仕組みに乗っている。

## 環境まわりの注意

- **Turbopack は Next.js 16 の既定バンドラ。** `package.json` の `dev` / `build` に `--turbopack` を
  明示しているのは要件を可視化するためで、外しても挙動は同じ（Webpack を使う場合は `--webpack`）。
- **`next.config.ts` の `turbopack.root` は消さない。** ホームディレクトリの `package-lock.json` を
  ワークスペース候補として誤検出し、ビルドのたびに警告が出る。
- Vitest のパス解決は Vite 8 ネイティブの `resolve.tsconfigPaths: true` を使う。
  `vite-tsconfig-paths` プラグインは不要（導入すると非推奨警告が出る）。
