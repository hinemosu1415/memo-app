# memo-app

React、Hono、SQLiteで作った小さなメモアプリです。React RouterとDrizzleは使っていません。

## 起動

Node.js 22.13以上とpnpmが必要です。SQLiteファイルは`data/app.sqlite`に保存します。

```bash
pnpm install
pnpm dev
```

ブラウザで <http://localhost:5173> を開いてください。Viteが画面を配信し、`/api` をHono（ポート3001）へ転送します。

## 構成

- `workspaces/client/main.tsx`: Reactの画面。
- `workspaces/client/use-memos.ts`: メモの状態管理とAPI通信を行うカスタムフック。
- `workspaces/server/index.ts`: SQLiteへのアクセス、HonoのAPI、サーバーの起動をまとめています。
- `data/app.sqlite`: SQLiteファイル。

