---
name: taskboard-feature-dev
description: TaskBoardに新機能をTDDで追加するときに使用する。失敗するテストを先に書き、状態管理を整え、UIを更新し、最後にブラウザで動作を確認するまで一貫した手順で進める。
---

TaskBoardに機能を追加するときは、以下の順で進めてください。

１．追加する機能のユーザ操作を確認する
２．失敗するテストを先に追加する
３．`useBoard`に状態管理を集約する
４．既存コンポーネントの責務分担を変えずにUIを更新する
５．`npx tsc --noEmit` → `npm run lint` → `npm test` → `npm run build` の順で検証する
６．必要に応じてPlaywright MCPで画面操作を確認する