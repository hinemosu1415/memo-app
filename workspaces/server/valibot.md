## はじめに

今回のコードを簡潔にするとこうなります。

```ts
const createMemoSchema = v.object({
	text: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
});

const memoIdSchema = v.object({
	id: v.pipe(
		v.string(),
		v.transform(Number),
		v.check((id) => Number.isSafeInteger(id) && id > 0),
	),
});

app.get("/api/memos", (c) => {});


app.post("/api/memos", vValidator("json", createMemoSchema, (result, c) => {}), (c) => {});


app.delete("/api/memos/:id", vValidator("param", memoIdSchema, (result, c) => {}), (c) => {});
```



## 1. ミドルウェア

### 1.1 ミドルウェアとは

**ミドルウェアは、リクエストを処理する途中で実行される処理です。**



### 1.2 Honoでミドルウェアを使う

これはミドルウェアの例です。

```ts
app.post(
  "/api/memos",

  // ミドルウェア
  async (c, next) => {
    console.log("登録処理の前");
    await next();
    console.log("登録処理の後");
  },

  // ハンドラー
  (c) => {
    console.log("登録処理");
    return c.body(null, 201);
  },
);
```

実行されるこのようなログが出力されます。
```text
登録処理の前
登録処理
登録処理の後
```

ここで登場する `next()` は、**次のミドルウェアまたはハンドラーに処理を進める関数**です。`await next()` の後にも処理を書けるため、ミドルウェアはハンドラーの前後で動作できます。
(ハンドラーとは、特定のルーティング（URLパスとHTTPメソッド）にリクエストが一致した際に実行されるコールバック関数のことです。)

一方、エラーのレスポンスを返して処理を終了するミドルウェアも作れます。

```ts
app.post(
  "/api/memos",

  // ミドルウェア
  async (c, next) => {
    const allowed = false;

    if (!allowed) {
      return c.json({ error: "登録できません" }, 400);
    }

    return next();
  },

  // ハンドラー
  (c) => {
    // allowed が false なら、この処理は実行されない
    return c.body(null, 201);
  },
);
```

この「**条件を確認し、問題があれば後続の処理を止める**」という仕組みが、今回の入力検証でも使われます。


### 1.3 app.use()でミドルウェアを登録

`app.use()` は、Honoでミドルウェアを登録するためのメソッドです。
`app.get()` や `app.post()` が特定のHTTPメソッドとパスに対する処理を登録するのに対し、app.use() はHTTPメソッドに関係なくミドルウェアを登録します。

`app.use()` で登録したミドルウェアは、対象となるルートのハンドラーより前に実行されます。

例えば、次のコードを考えます。

```ts
app.use(async (c, next) => {
  console.log("ミドルウェア実行");
  await next();
});

app.get("/", (c) => {
  console.log("ハンドラー実行");
  return c.text("Hello World");
});
```

これは、処理の流れとしては次のように書いた場合と同じです。

```ts
app.get(
  "/",

  // app.use() で登録したミドルウェア
  async (c, next) => {
    console.log("ミドルウェア実行");
    await next();
  },

  // ハンドラー
  (c) => {
    console.log("ハンドラー実行");
    return c.text("Hello World");
  },
);
```

つまり、`app.use()` を使うことで、複数のルートに共通するミドルウェアをまとめて登録できます。

※ 実際にコードが変換されるわけではなく、処理の流れを分かりやすくするための例です。


### 1.3 `next()` の役割

`next()` は、**次のミドルウェアまたはハンドラーに処理を進めるための関数**です。

Honoのミドルウェアでは、後続の処理を実行したい場合に `next()` を呼び出す必要があります。

#### `next()` を呼び出す場合

```ts
app.use(async (c, next) => {
  console.log("ミドルウェア実行");
  await next();
});

app.get("/", (c) => {
  console.log("ハンドラー実行");
  return c.text("Hello World");
});
```

実行結果：

```text
ミドルウェア実行
ハンドラー実行
```

`await next()` によって、次のハンドラーに処理が進みます。

また、`await next()` の後に処理を行う必要がなければ、`return next()` と記述することもできます。

```ts
app.use((c, next) => {
  console.log("ミドルウェア実行");
  return next();
});
```

#### `next()` を呼び出さない場合

```ts
app.use(async (c, next) => {
  console.log("ミドルウェア実行");
});

app.get("/", (c) => {
  console.log("ハンドラー実行");
  return c.text("Hello World");
});
```

実行結果：

```text
ミドルウェア実行
```

`next()` が呼び出されていないため、後続のハンドラーは実行されません。

さらに、このミドルウェアはレスポンスも返していないため、通常は500エラーになります。


#### `next()` を呼び出さずにレスポンスを返す場合

```ts
app.use((c) => {
  return c.json({ error: "アクセス禁止" }, 403);
});

app.get("/", (c) => {
  return c.text("Hello World");
});
```

この場合、ミドルウェア自身が403レスポンスを返して処理を終了するため、`next()` を呼び出す必要はありません。

この仕組みを利用することで、入力内容に問題がある場合などに、後続の処理を実行せずにエラーを返すことができます。


### まとめ

- `await next()`
  - 後続の処理が実行される。
  - 後続の処理が完了した後、ミドルウェアに戻る。
- `return next()`
  - 後続の処理が実行される。
  - 後続の処理に進み、その結果を返す。
- `return c.json(...)`
  - 後続の処理は実行されない。
  - レスポンスを返して処理を終了する。
- `next()` もレスポンスもなし
  - 後続の処理は実行されない。
  - 通常は500エラーになる。

**ミドルウェアでは、後続の処理に進むか、その場でレスポンスを返すかを選択できます。**


---


## 2. Valibot

### 2.1 Valibotとは

**Valibotは、データが指定した条件を満たすか検証したり、データを変換したりするライブラリです。**

TypeScriptで `text: string` と型を定義しても、APIに届くJSONが必ず文字列であるとは限りません。TypeScriptの型チェックは、外部から送られてくるデータの正しさを実行時に保証しないためです。

そこで、実際に受け取った値を確認するためにValibotを使用します。

Valibotでは、データに求める条件を**スキーマ（schema）**として定義します。


### 2.2 よく使うValibotのスキーマとアクション

Valibotでは、主に**スキーマ**と**アクション**を組み合わせてデータを検証します。

#### スキーマ（Schema）

**スキーマは、データの型や構造を定義・検証するものです。**
例えば、文字列、数値、オブジェクト、配列などを指定できます。

よく使うスキーマは次のとおりです。

- **`v.string()`**：文字列であることを検証する。
- **`v.number()`**：数値であることを検証する。
- **`v.boolean()`**：真偽値（`true` / `false`）であることを検証する。
- **`v.object({...})`**：オブジェクトの各プロパティを検証する。
- **`v.array(schema)`**：配列であることと、各要素が指定したスキーマを満たすことを検証する。
- **`v.optional(schema)`**：値が `undefined` でもよいことを指定する。オブジェクトのプロパティを省略可能にするときにも使う。
- **`v.nullable(schema)`**：値が `null` でもよいことを指定する。
- **`v.literal(value)`**：指定した値と一致することを検証する。
- **`v.picklist([...])`**：指定した複数の値のいずれかであることを検証する。
- **`v.union([...])`**：複数のスキーマのうち、いずれかを満たすことを検証する。

例えば、次のように組み合わせて使用できます。

```ts
const userSchema = v.object({
  name: v.string(),
  age: v.number(),
  isAdmin: v.boolean(),
  tags: v.array(v.string()),
  nickname: v.optional(v.string()),
  status: v.picklist(["active", "inactive"]),
});
```

#### アクション（Action）

**アクションは、スキーマで定義したデータに対して、追加の検証や変換を行うものです。**

アクションは主に次の2種類に分けられます。

**1. 検証アクション**

データが特定の条件を満たしているか確認するものです。

- **`v.minLength(n)`**：文字列や配列などの長さが `n` 以上であることを検証する。
- **`v.maxLength(n)`**：文字列や配列などの長さが `n` 以下であることを検証する。
- **`v.minValue(n)`**：数値などが `n` 以上であることを検証する。
- **`v.maxValue(n)`**：数値などが `n` 以下であることを検証する。
- **`v.email()`**：メールアドレスの形式を検証する。
- **`v.url()`**：URLの形式を検証する。
- **`v.regex(pattern)`**：文字列が指定した正規表現に一致することを検証する。
- **`v.check(callback)`**：コールバック関数が返す真偽値によって検証する。

**2. 変換アクション**

データを別の値や形式に変換するものです。

- **`v.trim()`**：文字列の前後の空白を削除する。
- **`v.toLowerCase()`**：文字列を小文字に変換する。
- **`v.toUpperCase()`**：文字列を大文字に変換する。
- **`v.transform(callback)`**：コールバック関数を使ってデータを変換する。

#### `v.pipe()` で組み合わせる

スキーマとアクションを組み合わせる場合は、`v.pipe()` を使用します。

**`v.pipe()` は、スキーマに検証・変換処理を追加し、順番に適用するための関数です。**

```ts
const userSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
  ),
  age: v.pipe(
    v.number(),
    v.minValue(0),
  ),
  email: v.pipe(
    v.string(),
    v.email(),
  ),
});
```

`v.pipe()` の最初にはスキーマを指定し、その後にアクションを追加します。

このように、**スキーマでデータの型や構造を定義し、アクションで細かい検証・変換条件を追加する**のがValibotの基本的な使い方です。



### 2.3 メモ本文のスキーマ

```ts
import * as v from "valibot";

const createMemoSchema = v.object({
  text: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.maxLength(200),
  ),
});
```

各関数の役割を確認しましょう。

| 関数 | 役割 |
| --- | --- |
| `v.object({...})` | オブジェクトの形を定義・検証する |
| `v.string()` | 文字列であることを検証する |
| `v.trim()` | 文字列の前後の空白を削除する |
| `v.minLength(1)` | 1文字以上であることを検証する |
| `v.maxLength(200)` | 200文字以下であることを検証する |
| `v.pipe(...)` | 検証・変換処理を順番につなげる |

`v.pipe()` の中では、処理が順番に適用されます。

例えば、次のデータを受け取ったとします。

```json
{ "text": "  こんにちは  " }
```

`text` に対して以下の処理が行われます。

1. 入力データ：`"  こんにちは  "`
2. `v.string()`：文字列なのでOK
3. `v.trim()`：前後の空白を除去 → `"こんにちは"`
4. `v.minLength(1)`：1文字以上なのでOK
5. `v.maxLength(200)`：200文字以下なのでOK
6. 検証成功：`"こんにちは"`

一方、`"   "` のような空白だけの文字列は `v.trim()` で `""` となり、`v.minLength(1)` で検証に失敗します。

**重要：** Valibotは「正しいか確認する」だけでなく、`trim()` のように「使いやすい形に変換する」こともできます。


### 2.4 削除APIのIDのスキーマ

```ts
const memoIdSchema = v.object({
  id: v.pipe(
    v.string(),
    v.transform(Number),
    v.check((id) => Number.isSafeInteger(id) && id > 0),
  ),
});
```

`DELETE /api/memos/10` のようなURLのパスパラメータは、取得時には通常 `"10"` という**文字列**です。

このスキーマでは、次の順番で処理します。

1. `v.string()`：文字列であることを確認する (これが無いと`""`,``の時にバグ)
2. `v.transform(Number)`：`"10"` を数値の `10` に変換する
3. `v.check(...)`：安全に扱える整数で、かつ0より大きいことを確認する

`v.check()` は、**引数に渡した関数の返り値が `true` かどうかで値を検証する関数**です。

```ts
v.check((value) => {
  return value > 0;
});
```

- `v.check()` の引数には、検証条件を記述した**コールバック関数**を渡します。
- コールバック関数の引数 `value` には、**検証対象の値**が渡されます。
- コールバック関数が `true` を返すと検証成功、`false` を返すと検証失敗になります。

今回のコードでは、次のように使用しています。

```ts
v.check((id) => Number.isSafeInteger(id) && id > 0)
```

ここでは、`v.transform(Number)` によって変換された数値が `id` に渡されます。

そして、`Number.isSafeInteger(id) && id > 0` によって、**安全に扱える整数であり、かつ0より大きいか**を確認しています。


### 2.5 `safeParse()` でデータを検証する

ValibotはHonoを使わなくても利用できます。

`v.safeParse()` は、**データがスキーマの条件を満たしているかを検証する関数**です。

```ts
v.safeParse(スキーマ, 検証するデータ);
```

例えば、メモのデータを検証する場合は次のように書きます。

```ts
const createMemoSchema = v.object({
  text: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.maxLength(200),
  ),
});

const result = v.safeParse(createMemoSchema, {
  text: "  こんにちは  ",
});
```

この場合、`createMemoSchema` に従ってデータが検証され、結果が `result` に格納されます。

また、`v.trim()` によって前後の空白も除去されます。


### 2.6 `safeParse()` の返り値

`v.safeParse()` は、**検証に成功したかどうかと、検証結果を含むオブジェクト**を返します。

主なプロパティは次の3つです。

- **`result.success`**：検証に成功したかを示す真偽値（`true` / `false`）
- **`result.output`**：検証成功時に取得できる、検証・変換後のデータ
- **`result.issues`**：検証失敗時に取得できる、エラーの詳細情報

例えば、次のように検証結果によって処理を分けられます。

```ts
const result = v.safeParse(createMemoSchema, {
  text: "  こんにちは  ",
});

if (result.success) {
  console.log(result.output); // { text: "こんにちは" }
} else {
  console.log(result.issues); // エラーの詳細
}
```

検証に成功した場合は `result.success` が `true` となり、`result.output` から検証・変換後のデータを取得できます。

一方、検証に失敗した場合は `result.success` が `false` となり、`result.issues` からエラーの詳細を確認できます。

このように、Valibot単体では**スキーマに従ってデータを検証・変換すること**ができます。ただし、HTTPリクエストの取得やエラー時のHTTPレスポンス作成は、Valibot自身の役割ではありません。

---

## 3. @hono/valibot-validator

### 3.1 @hono/valibot-validatorとは

**`@hono/valibot-validator` は、ValibotをHonoのミドルウェアとして使うためのライブラリです。**

それぞれの役割を整理すると、次のようになります。

| 項目 | 役割 |
| --- | --- |
| ミドルウェア | ハンドラーの前後に処理を挟む仕組み |
| `valibot` | データの検証・変換ルールを定義し、実行する |
| `@hono/valibot-validator` | HonoのリクエストをValibotで検証し、結果をハンドラーにつなぐ |

インストールするときは、以下の2つのパッケージを使用します。

```bash
pnpm add valibot @hono/valibot-validator
```


### 3.2 vValidator()の3つの引数

メモ登録APIでは、次のように使用しています。

```ts
vValidator("json", createMemoSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: "メモは1〜200文字で入力してください" }, 400);
  }
})
```

基本形は以下のとおりです。

```ts
vValidator(検証対象, スキーマ, 検証結果を受け取る関数)
```

**第1引数：検証対象**

第1引数には、リクエストのどの部分を検証するかを指定します。

指定できる値は次のとおりです。

- **`"json"`**：リクエストボディのJSONデータを検証する。
- **`"form"`**：フォームデータを検証する。`multipart/form-data` や `application/x-www-form-urlencoded` などが対象。
- **`"query"`**：URLのクエリパラメータを検証する。例：`?page=1&sort=desc`
- **`"param"`**：URLのパスパラメータを検証する。例：`/users/:id` の `:id`
- **`"header"`**：リクエストヘッダーを検証する。例：`Authorization` ヘッダー
- **`"cookie"`**：リクエストに含まれるCookieの値を検証する。

今回のメモアプリでは、`"json"` と `"param"` を使用しています。
```ts
vValidator("json", createMemoSchema) // POSTのJSONを検証
vValidator("param", memoIdSchema)    // DELETEの:idを検証
```


**第2引数：スキーマ**

Valibotで用意した `createMemoSchema` や `memoIdSchema` を渡します。このスキーマが検証ルールになります。

**第3引数：検証結果に応じた処理（省略可能）**

```ts
(result, c) => {
  if (!result.success) {
    return c.json({ error: "メモは1〜200文字で入力してください" }, 400);
  }
}
```

- `result.success` が `false` のときは検証失敗
- `c.json(...)` で400エラーのレスポンスを返す
- レスポンスを返した場合は、後続のハンドラーに進まない
- 検証に成功し、この関数が何も返さなければ後続のハンドラーに進む

第3引数を省略しても検証は行われます。その場合も検証失敗時には既定の400レスポンスが返されます。


### 3.3 検証済みのデータを取得する c.req.valid()

検証に成功したデータは、ハンドラー内で `c.req.valid()` を使って取得できます。

```ts
app.post(
  "/api/memos",
  vValidator("json", createMemoSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "メモは1〜200文字で入力してください" }, 400);
    }
  }),
  (c) => {
    const { text } = c.req.valid("json");
    db.prepare("INSERT INTO memos (text) VALUES (?)").run(text);
    return c.body(null, 201);
  },
);
```

ここで重要なのは、**`c.req.valid("json")` で受け取る値は、検証・変換後のデータである**という点です。

例えば、リクエストボディが以下の場合、

```json
{ "text": "  こんにちは  " }
```

`c.req.valid("json")` の結果は次のようになります。

```ts
{ text: "こんにちは" }
```

`v.trim()` の結果が反映されるため、データベースには前後の空白が取り除かれた文字列を保存できます。

また、Valibotのスキーマを元にTypeScriptの型も推論されるため、`text` は `string` 型として扱えます。


### 3.4 DELETEの場合は「param」を検証する

```ts
app.delete(
  "/api/memos/:id",
  vValidator("param", memoIdSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "不正なIDです" }, 400);
    }
  }),
  (c) => {
    const { id } = c.req.valid("param");
    const result = db.prepare("DELETE FROM memos WHERE id = ?").run(id);

    if (result.changes === 0) {
      return c.json({ error: "メモが見つかりません" }, 404);
    }

    return c.body(null, 204);
  },
);
```

`DELETE /api/memos/10` が呼び出されたとき、次の流れで処理されます。

1. URLのパスパラメータを取得
   - `id = "10"`（`string`型）
2. `vValidator("param", memoIdSchema)` で検証・変換
   - `v.string()`：文字列であることを確認する。
   - `v.transform(Number)`：文字列 `"10"` を数値 `10` に変換する。
   - `v.check(...)`：正の安全な整数であることを確認する。
3. `c.req.valid("param")` で検証済みデータを取得
   - `id = 10`（`number`型）
4. SQLでメモを削除
   - 取得した `id` を使用して、データベースからメモを削除する。


`"abc"` などの不正なIDなら400エラーが返され、削除処理には進みません。正しい形式のIDでも該当するメモが存在しなければ、ハンドラーが404エラーを返します。

**400と404の違い**も押さえておきましょう。

- **400 Bad Request**：受け取った値がスキーマに一致しない
- **404 Not Found**：IDの形式は正しいが、指定されたメモが存在しない

