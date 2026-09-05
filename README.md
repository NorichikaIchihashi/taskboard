# TaskBoard

未着手 / 進行中 / 保留 / 完了 の 4 列で管理する、小さなカンバンボードです。

- Next.js 16（App Router）+ TypeScript + Tailwind CSS v4
- バンドラは Turbopack（`dev` / `build` とも）
- テストは Vitest + React Testing Library
- ソースはすべて `src/` 配下

## 使い方

```bash
npm run dev        # 開発サーバー（http://localhost:3000）
npm run build      # 本番ビルド
npm start          # ビルド結果を起動
npm test           # ユニットテストを一度だけ実行
npm run test:watch # ウォッチモード
npm run lint       # ESLint
```

## 機能

- タイトル・説明・担当者・優先度・期限を入力してタスクを追加（追加先は「未着手」）
- 列の中のカードは **優先度が高い順 → 期限が近い順** に自動で並ぶ
- 期限切れ・今日が期限のカードは期限を強調表示（判定は表示している端末の「今日」で行う）
- カードをドラッグして列をまたいで移動
- カード上の `←` / `→` ボタンでも移動できる（キーボード・タッチ環境向けの代替手段）
- カード上の「削除」ボタンでタスクを取り除く
- 列ごとのタスク件数を表示（絞り込み中は表示されている件数）
- **検索**: キーワードでタイトルと説明を絞り込む
- **絞り込み**: 担当者と優先度で絞り込む（担当者の選択肢は既存タスクから自動で集まる）

タスクはブラウザの localStorage（キー `taskboard.tasks.v1`）に保存され、リロードしても残ります。
何も保存されていないときだけ `src/lib/initial-tasks.ts` のサンプルが表示されます。
検索と絞り込みの条件は表示だけの都合なので保存しません（リロードで解除されます）。

## 構成

```
src/
  app/                 ルーティングとレイアウト
    page.tsx           Server Component。Board にサンプルデータを渡すだけ
    layout.tsx
  components/          表示の責務ごとに分割
    Board.tsx          全体の組み立て（Client Component）
    BoardColumn.tsx    1 列の表示 + ドロップ先としての振る舞い
    ColumnHeader.tsx   列名と件数バッジ
    TaskCard.tsx       1 件のタスク + ドラッグ元としての振る舞い
    TaskMoveControls.tsx  隣の列へ移す ← / → ボタン
    AddTaskForm.tsx    タスク追加フォーム
    BoardFilterBar.tsx 検索と絞り込みの入力
  hooks/
    useBoard.ts        ボードの状態と操作（追加・移動・削除・並び替え・絞り込み）
    useToday.ts        期限の判定に使う「今日」を返す
  lib/
    board.ts           純粋なドメインロジック（createTask / moveTask / removeTask / sortTasks / filterTasks …）
    due-date.ts        期限の正規化・期限切れ判定・表示整形
    dnd.ts             DataTransfer の読み書きを閉じ込めるヘルパー
    task-storage.ts    localStorage の読み書きと保存値の検証
    task-store.ts      useSyncExternalStore に渡すタスクの外部ストア
    id.ts              id 採番
    initial-tasks.ts   保存が無いときに表示するサンプルデータ
  types/
    task.ts            Task / TaskStatus / TaskPriority と列・優先度の定義
  test/
    setup.ts           Vitest のセットアップ
    dnd.ts             jsdom 用の DataTransfer スタブ
    task.ts            テスト用のタスク・下書きのファクトリ
```

React に依存しない判断（並び替え・バリデーション・仕分け）はすべて `lib/` の純粋関数に置き、
`hooks/useBoard.ts` が状態を、`components/` が表示と DOM イベントを担当します。

各構成要素の責務と、その形になっている理由は [ARCHITECTURE.md](ARCHITECTURE.md) にまとめています。

## テスト

テストはソースと同じ場所に `*.test.ts(x)` として置いています。

```bash
npm test
```

ドラッグ＆ドロップは jsdom に `DataTransfer` が無いため、`src/test/dnd.ts` のスタブを
`fireEvent.dragStart` / `dragOver` / `drop` に渡して、実際のイベント経路ごと検証しています。

期限まわりは「今日」を必ず引数・プロップで受け取る形にしてあるので、現在時刻に依存せず
決定的にテストできます（`Board` の `today` プロップに固定日を渡す）。

永続化は jsdom の実物の `localStorage` を使って検証しています。テストごとの後片付けは
`src/test/setup.ts` の `localStorage.clear()` にまとめてあり、「リロードしても残る」は
`render` の戻り値の `unmount()` → 再 `render()` で表現しています。
# taskboard
