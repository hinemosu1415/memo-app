# Drizzle ORM — TypeScriptでデータベースを操作する

この資料では、`memo-app` で使用している Drizzle ORM の基本的な使い方と、データベースの構造を管理するマイグレーションについて学びます。


## 第1章 Drizzle ORMとは

### 1.1 ORMとは

**ORM（Object-Relational Mapping）** とは、プログラミング言語のオブジェクトなどを使って、リレーショナルデータベースを操作するための仕組みです。

通常、データベースからデータを取得するには、SQLを記述します。

```sql`
SELECT * FROM memos;
```

ORMを使用すると、SQLを直接記述する代わりに、プログラミング言語のコードでデータベースを操作できます。

例えば、Drizzle ORMでは次のように記述します。

```ts
db.select().from(memosTable).all();
```

ORMを使うことで、次のようなメリットがあります。

- **型安全性**：データベースのカラムや取得結果の型をTypeScriptで扱える
- **保守性**：テーブルやカラムの定義をコード上で管理しやすくなる
- **補完機能**：エディタの入力補完を利用してクエリを記述できる

ただし、ORMを使用してもSQLが不要になるわけではありません。ORMが構築したクエリは、最終的にSQLとしてデータベースで実行されます。


### 1.2 Drizzle ORMとは

**Drizzle ORMは、TypeScriptでSQLに近い形のデータベース操作を記述できるORMです。**

例えば、SQLとDrizzle ORMでは次のように対応します。

| SQL | Drizzle ORM |
|---|---|
| `SELECT` | `select()` |
| `FROM` | `from()` |
| `WHERE` | `where()` |
| `ORDER BY` | `orderBy()` |
| `INSERT INTO` | `insert()` |
| `DELETE FROM` | `delete()` |

Drizzleには、主に次の2つのツールがあります。

| ツール | 役割 |
|---|---|
| **Drizzle ORM** | データベースのテーブルを定義し、データを取得・追加・更新・削除する |
| **Drizzle Kit** | テーブル構造の変更に必要なSQLを生成し、マイグレーションを管理する |

Drizzle ORMは日常的なデータ操作に使用し、Drizzle Kitはデータベースの構造を変更する際に使用します。


### 1.3 memo-appでの使用例

現在の`memo-app`は、次のような構成になっています。

```text
React（画面）
    |
    | HTTPリクエスト
    v
Hono（API）
    |
    | Drizzle ORM
    v
better-sqlite3
    |
    v
SQLite（データベース）
```

データベースに関係する主なファイルは次のとおりです。

```text
memo-app/
├── workspaces/
│   └── server/
│       ├── index.ts         API・DB操作
│       ├── db/
│       │   ├── schema.ts    テーブルの定義
│       │   └── index.ts     DB接続・初期化
│       ├── drizzle/         マイグレーション
│       └── data/
│           └── app.sqlite  データベース
└── drizzle.config.ts        Drizzle Kitの設定
```

`db/index.ts` では、SQLiteへの接続とDrizzle ORMの初期化を行っています。

```ts
const sqlite = new Database(
  process.env.MEMO_DB_PATH ?? defaultDbPath
);

export const db = drizzle(sqlite, { schema });
```

`better-sqlite3` はNode.jsからSQLiteを操作するためのドライバーです。

`drizzle()` にSQLiteの接続とスキーマを渡すことで、Drizzle ORMを使用するための `db` が作られます。

この `db` を使い、HonoのAPIからデータベースを操作します。


## 第2章 スキーマの定義

### 2.1 スキーマとは

**スキーマとは、データベースのテーブルやカラムなどの構造を定義したものです。**

SQLでは、例えば次のようにテーブルを定義します。

```sql
CREATE TABLE memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  text TEXT NOT NULL
);
```

Drizzle ORMでは、これに相当するテーブル構造をTypeScriptで定義できます。

現在の`memo-app`では、`workspaces/server/db/schema.ts` にスキーマを記述しています。


### 2.2 テーブルの定義

`memo-app`のスキーマは、次のようになっています。

```ts
import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const memos = sqliteTable("memos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
});
```

それぞれの関数や設定は、SQLの定義と次のように対応します。

| Drizzle ORM | SQLでの意味 |
|---|---|
| `sqliteTable("memos", ...)` | `memos` テーブルを定義 |
| `integer("id")` | 整数型のカラム |
| `text("text")` | 文字列型のカラム |
| `.primaryKey()` | `PRIMARY KEY` |
| `autoIncrement: true` | `AUTOINCREMENT` |
| `.notNull()` | `NOT NULL` |

例えば、次の部分に注目してください。

```ts
id: integer("id").primaryKey({ autoIncrement: true }),
```

これは、`id` を整数型の主キーにし、値を自動採番する設定です。

また、次の定義は、

```ts
text: text("text").notNull(),
```

`text` が `NULL` になることを禁止しています。

このように、Drizzle ORMではTypeScriptのコードからデータベースのテーブル構造を表現できます。

ただし、**スキーマを定義しただけでは、実際のSQLiteにテーブルが作成されるわけではありません。**

データベースへの反映には、第4章で扱うマイグレーションが必要です。


### 2.3 TypeScriptの型推論

Drizzle ORMでは、定義したスキーマを基にTypeScriptの型が推論されます。

例えば、先ほどの `memos` テーブルは次の構造を持っています。

```ts
export const memos = sqliteTable("memos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
});
```

このテーブルからデータを取得した場合、取得した各レコードの型は次のようになります。

```ts
{
  id: number;
  text: string;
}
```

実際にDrizzle ORMを使って取得すると、

```ts
const result = db.select().from(memos).all();
```

`result` は、概ね次のような型として推論されます。

```ts
{
  id: number;
  text: string;
}[]
```

そのため、取得したデータを扱う際に、毎回手動で型を定義する必要がありません。

一方、データを追加する場合は、`id` が自動採番されるため、`text` だけを指定できます。

```ts
db.insert(memos).values({
  text: "新しいメモ",
}).run();
```

逆に、次のコードは `text` に数値を指定しているため、TypeScriptの型エラーになります。

```ts
db.insert(memos).values({
  text: 123,
}).run();
```

このように、スキーマはデータベースの構造を定義するだけでなく、**TypeScriptの型チェックにも利用されます。**

ただし、TypeScriptの型チェックは実行時の入力検証ではありません。

現在の`memo-app`では、APIに送られてきた値の検証にはValibotを使用しています。

| 技術 | 役割 |
|---|---|
| TypeScript | 開発時に型の不一致を検出する |
| Valibot | APIに届いた値を実行時に検証する |
| Drizzle ORM | テーブルを定義し、型を推論してDB操作を構築する |
| SQLite | データを保存し、DBの制約を適用する |

例えば、メモの文字数を1〜200文字に制限しているのはValibotです。現在のDrizzleスキーマには文字数制限を定義していません。


## 第3章 Drizzle ORMによるデータ操作

この章では、`memo-app` で実際に使用しているDrizzle ORMのコードを、SQLと比較します。

以降の例では、スキーマの `memos` を `memosTable` という名前でインポートしているものとします。

```ts
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { memos as memosTable } from "./db/schema";
```


### 3.1 データの取得（SELECT）

`GET /api/memos` では、すべてのメモをIDの降順で取得します。

**SQLの場合**

```sql
SELECT id, text
FROM memos
ORDER BY id DESC;
```

**Drizzle ORMの場合**

```ts
const memos = db
  .select()
  .from(memosTable)
  .orderBy(desc(memosTable.id))
  .all();
```

各メソッドは次のように対応します。

| Drizzle ORM | 役割 |
|---|---|
| `select()` | 取得するデータを指定 |
| `from(memosTable)` | 取得元のテーブルを指定 |
| `orderBy()` | 並び順を指定 |
| `desc()` | 降順を指定 |
| `all()` | クエリを実行し、結果を配列で取得 |

取得結果は、例えば次のようになります。

```json
[
  { "id": 3, "text": "メモC" },
  { "id": 2, "text": "メモB" },
  { "id": 1, "text": "メモA" }
]
```

この結果をHonoの `c.json()` に渡すことで、JSONレスポンスとして返しています。


### 3.2 データの追加（INSERT）

`POST /api/memos` では、新しいメモをデータベースに追加します。

**SQLの場合**

```sql
INSERT INTO memos (text)
VALUES (?);
```

**Drizzle ORMの場合**

```ts
db.insert(memosTable)
  .values({ text })
  .run();
```

| Drizzle ORM | 役割 |
|---|---|
| `insert(memosTable)` | 追加するテーブルを指定 |
| `values({ text })` | 追加する値を指定 |
| `run()` | クエリを実行 |

`id` は自動採番されるため、指定する必要はありません。

現在の`memo-app`では、追加成功時に `201 Created` を返し、追加したレコード自体はレスポンスに含めていません。


### 3.3 データの削除（DELETE）

`DELETE /api/memos/:id` では、指定したIDのメモを削除します。

**SQLの場合**

```sql
DELETE FROM memos
WHERE id = ?;
```

**Drizzle ORMの場合**

```ts
const result = db
  .delete(memosTable)
  .where(eq(memosTable.id, id))
  .run();
```

| Drizzle ORM | 役割 |
|---|---|
| `delete(memosTable)` | 削除するテーブルを指定 |
| `where()` | 削除対象の条件を指定 |
| `eq(memosTable.id, id)` | `id` が一致するという条件 |
| `run()` | クエリを実行 |

`eq()` は、SQLの `=` に相当する比較条件を作る関数です。

また、`run()` の実行結果には、変更された行数を表す `changes` が含まれます。

現在の`memo-app`では、次のように削除対象が存在したか判定しています。

```ts
if (result.changes === 0) {
  return c.body(null, 404);
}

return c.body(null, 204);
```

削除された行数が `0` の場合は、指定したIDのメモが存在しなかったとして `404 Not Found` を返します。

削除できた場合は `204 No Content` を返します。


### 3.4 クエリの実行結果

今回の`memo-app`では、クエリを実行するメソッドとして主に `all()` と `run()` を使用しています。

| メソッド | 戻り値 | 使用例 |
|---|---|---|
| `.all()` | 取得したレコードの配列 | SELECT |
| `.run()` | 実行結果の情報 | INSERT・DELETE |

これらは今回使用しているSQLiteドライバーに対応した実行方法です。

`run()` は、実行結果として `changes` などの情報を返します。

なお、Drizzle ORMにはUPDATEなどの操作もありますが、現在の`memo-app`では使用していないため、ここでは扱いません。


## 第4章 マイグレーション

### 4.1 マイグレーションとは

**マイグレーションとは、データベースのテーブル構造の変更を管理し、実際のデータベースに適用する仕組みです。**

例えば、最初に次のようなテーブルを作成したとします。

```sql
CREATE TABLE memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL
);
```

後からメモの作成日時を保存したくなった場合、テーブルに新しいカラムを追加する必要があります。

SQLでは、例えば次のような操作です。

```sql
ALTER TABLE memos
ADD COLUMN created_at TEXT;
```

しかし、開発者が毎回手動でSQLを管理すると、どの変更を適用したのか分かりにくくなります。

そこでマイグレーションを利用します。

マイグレーションを使用することで、テーブル構造の変更をファイルとして記録し、順番に適用できます。


### 4.2 Drizzle Kitとは

**Drizzle Kitは、Drizzle ORMのスキーマ定義を基に、マイグレーション用のSQLを生成・管理するツールです。**

例えば、`schema.ts` のテーブル定義を変更したとき、Drizzle Kitを使用して変更に必要なSQLを生成できます。

Drizzle Kitの設定は、プロジェクトルートの `drizzle.config.ts` で行います。

現在の`memo-app`では、次の項目が設定されています。

| 設定 | 役割 | memo-appでの値 |
|---|---|---|
| `dialect` | データベースの種類 | `sqlite` |
| `schema` | スキーマ定義の場所 | `./workspaces/server/db/schema.ts` |
| `out` | SQLなどの出力先 | `./workspaces/server/drizzle` |
| `dbCredentials.url` | DBの接続先 | `./workspaces/server/data/app.sqlite`（標準） |

Drizzle Kitは、これらの設定を参照してSQLの生成や適用を行います。


### 4.3 開発環境でのマイグレーション手順

`memo-app`では、Drizzle Kitを使用してマイグレーションSQLを自動生成します。

例えば、`memos` テーブルに作成日時を保存する `created_at` カラムを追加する場合、次の手順で行います。

**1. `schema.ts` を変更する**

まず、TypeScriptで定義しているスキーマを変更します。

変更前：

```ts
export const memos = sqliteTable("memos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
});
```

変更後：

```ts
export const memos = sqliteTable("memos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  createdAt: text("created_at"),
});
```

ここでは `created_at` という新しいカラムを追加しています。既存のメモには値がないため、今回は `NULL` を許可します。

**2. マイグレーションSQLを生成する**

プロジェクトのルートディレクトリで、次のコマンドを実行します。

```bash
pnpm db:generate
```

Drizzle Kitが現在のスキーマと過去のスキーマを比較し、変更に必要なSQLを生成します。

例えば、次のようなSQLが生成されます。

```sql
ALTER TABLE `memos`
ADD `created_at` text;
```

**3. 生成されたSQLを確認する**

生成されたSQLは、`workspaces/server/drizzle/` に保存されます。

追加されるカラムやデータ型が意図した内容になっているか確認します。

特に、既存カラムの削除や型変更など、データが失われる可能性のある変更には注意が必要です。

**4. マイグレーションを適用する**

生成されたSQLを確認したら、次のコマンドを実行します。

```bash
pnpm db:migrate
```

これにより、未適用のマイグレーションがSQLiteに適用されます。

**5. 変更が反映されたことを確認する**

実際のデータベースに `created_at` カラムが追加されているか確認します。

また、既存データが保持されていることや、APIが正常に動作することも確認します。

**注意：** 現在の `memo-app` はサーバー起動時にも `migrate()` を実行するため、SQL生成後に `pnpm dev` でサーバーを起動しても未適用のマイグレーションが適用されます。

ただし、マイグレーションの仕組みを理解するため、ここでは `pnpm db:migrate` を明示的に実行する手順で説明しました。


### 4.4 本番環境でのマイグレーション手順

開発環境では自分のSQLiteを変更しますが、本番環境では利用者のデータが保存されているデータベースを変更します。

そのため、**本番環境では事前にマイグレーションを生成・検証し、確認済みのSQLを適用することが重要です。**

一般的には、次の手順で進めます。

**1. 開発環境でスキーマを変更する**

開発者が `schema.ts` を変更し、次のコマンドでSQLを生成します。

```bash
pnpm db:generate
```

**2. 開発環境でSQLを確認・適用する**

生成されたSQLを確認してから、開発用DBへ適用します。

```bash
pnpm db:migrate
```

適用後、アプリが正常に動作することを確認します。

**3. スキーマとマイグレーションファイルをGitにコミットする**

次のファイルをGitで管理します。

- `schema.ts`
- `drizzle/` 以下のSQL・履歴ファイル
- 変更が必要なアプリケーションコード

これにより、ほかの開発者や本番環境でも同じ変更を適用できます。

**4. ステージング環境で動作を確認する**

本番環境に近いテスト環境があれば、同じマイグレーションを適用して動作を確認します。

特に、既存データを保持したまま変更できるか確認します。

**5. 本番データベースをバックアップする**

マイグレーションに失敗した場合に備え、変更前のデータベースをバックアップします。

SQLiteでは、オンラインバックアップ機能などを利用できます。

**6. 本番環境でマイグレーションを適用する**

本番用のマイグレーション実行環境で、確認済みのSQLを適用します。

```bash
pnpm db:migrate
```

ここでは、本番DBに接続する設定を使用する必要があります。

`memo-app` では `MEMO_DB_PATH` を使用して接続するSQLiteファイルを変更できます。

また、本番環境ではマイグレーションを複数のサーバーから同時実行せず、管理された処理として1回実行する運用が望ましいです。

**7. アプリケーションをデプロイする**

マイグレーションが成功したら、新しいスキーマに対応したアプリケーションをデプロイします。

ただし、DB構造の変更内容によっては、古いアプリケーションとの互換性を考慮し、段階的にデプロイする必要があります。

**8. 本番環境で正常に動作することを確認する**

デプロイ後、APIやデータベース操作が正常に動作することを確認します。

エラーが発生した場合は、事前に用意した復旧手順に従って対応します。


### 4.5 開発環境と本番環境の違い

| 項目 | 開発環境 | 本番環境 |
|---|---|---|
| `schema.ts` の変更 | 開発者が行う | 検証済みの変更を使用 |
| `db:generate` | 実行する | 原則として実行しない |
| SQLの確認 | 行う | 事前に確認済み |
| `db:migrate` | 開発用DBに適用 | 本番用DBに適用 |
| バックアップ | 必要に応じて | 適用前に取得 |
| 動作確認 | 開発中に実施 | 適用・デプロイ後に実施 |

本番環境では、開発環境で生成したSQLをそのまま使用するのが基本です。

したがって、通常の開発フローは次のようになります。

**開発環境**

1. `schema.ts` を変更
2. `pnpm db:generate` でSQLを生成
3. 生成されたSQLを確認
4. `pnpm db:migrate` で開発用DBに適用
5. 動作確認してGitにコミット

**本番環境**

1. 検証済みのコード・マイグレーションを用意
2. 本番DBをバックアップ
3. 本番用DBにマイグレーションを適用
4. 対応するアプリケーションをデプロイ
5. 正常に動作していることを確認

なお、既存カラムの削除など、古いアプリケーションが動作しなくなる変更については、アプリケーションとDBの更新順序を別途設計する必要があります。

## まとめ

今回の`memo-app`では、Drizzle ORMとDrizzle Kitを組み合わせてSQLiteを操作・管理しています。

| 項目 | 役割 |
|---|---|
| Drizzle ORM | TypeScriptからデータベースを操作 |
| `schema.ts` | テーブル・カラムを定義 |
| `db` | Drizzle ORMによるDB操作に使用 |
| Drizzle Kit | マイグレーションSQLの生成・管理 |
| `db:generate` | スキーマ変更からSQLを生成 |
| `db:migrate` | 生成したSQLをDBに適用 |
| SQLite | 実際のデータを保存 |

特に重要なのは、次の3点です。

1. **Drizzle ORMを使うと、SQLに近い構文で型安全なデータベース操作を記述できる。**
2. **スキーマをTypeScriptで定義すると、クエリの型推論にも利用される。**
3. **スキーマの変更を実際のデータベースに反映するには、マイグレーションが必要になる。**

これらを理解すると、Drizzle ORMを使用したアプリケーションのコードを読み、データベースの操作や構造変更の流れを把握できるようになります。




## おまけ

