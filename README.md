# memo-app

React、Hono、Drizzle ORM、SQLiteで作った小さなメモアプリです。React Routerは使っていません。

## 起動

Node.js 22.13以上とpnpmが必要です。SQLiteファイルは`workspaces/server/data/app.sqlite`に保存します。サーバー起動時に未適用のDrizzleマイグレーションが実行されます。既存の`memos`テーブルとデータもそのまま利用できます。

```bash
pnpm install
pnpm dev
```

ブラウザで <http://localhost:5173> を開いてください。Viteが画面を配信し、`/api` をHono（ポート3001）へ転送します。

## データベース

テーブル定義を変更したら、次のコマンドでマイグレーションを生成します。生成されたSQLを確認してから起動してください。

```bash
pnpm db:generate
pnpm dev
```

サーバーを起動せずにマイグレーションだけ適用する場合は `pnpm db:migrate` を使います。別のSQLiteファイルで試す場合は `MEMO_DB_PATH=/tmp/memo-app.sqlite pnpm db:migrate` のように指定できます。

## 構成

- `workspaces/client/main.tsx`: Reactの画面。
- `workspaces/client/use-memos.ts`: メモの状態管理とAPI通信を行うカスタムフック。
- `workspaces/server/index.ts`: Drizzle ORMを使ったCRUD、HonoのAPI、サーバーの起動をまとめています。
- `workspaces/server/db/schema.ts`: Drizzleのテーブル定義。
- `workspaces/server/db/index.ts`: SQLite接続とマイグレーションの実行。
- `drizzle.config.ts`、`workspaces/server/drizzle/`: マイグレーションの設定とSQL。
- `workspaces/server/data/app.sqlite`: SQLiteファイル。

