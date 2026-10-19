## 1. curlで試す

### 1.1 GET：メモの一覧取得

```bash
curl http://localhost:3001/api/memos
```

### 1.2 POST：メモの追加

```bash
curl -X POST http://localhost:3001/api/memos \
  -H "Content-Type: application/json" \
  -d '{"text":"Honoの勉強"}'
```

### 1.3 DELETE：メモの削除

```bash
curl -X DELETE http://localhost:3001/api/memos/1
```




## 2. リクエストの通信

### 2.1 GET：メモの一覧取得

- method: `GET`
- URL: `http://localhost:3001/api/memos`
- body: なし

### 2.2 POST：メモの追加

- method: `POST`
- URL: `http://localhost:3001/api/memos`
- body: `{"text":"Honoの勉強"}`
- Content-Type: `application/json`


### 2.3 DELETE：メモの削除

- method: `DELETE`
- URL: `http://localhost:3001/api/memos/1`
- body: なし

削除対象のIDは、BodyではなくURLのパスパラメータ `/1` で指定しています。




## 3. レスポンスの通信

HTTPレスポンスは、主に**ステータスコード・ヘッダー・Body**から構成されます。

### 3.1 ステータスコード
処理の成功・失敗を表す
- `200`: リクエストが成功した
- `201`: 新しいデータの作成に成功した
- `400`: リクエストの内容が間違っている
- `401`: ログイン・認証が必要
- `404`: 指定されたデータやページが見つからない
- `500`: サーバー側でエラーが起きた

### 3.2 ヘッダー
レスポンスの形式などを表す

### 3.3 Body
クライアントに返すデータを格納する

### 3.4 レスポンスの例
```http
HTTP/1.1 200 OK
Content-Type: application/json
[
  {
    "id": 1,
    "text": "Honoの勉強"
  }
]
```
```http
HTTP/1.1 500 Internal Server Error
Content-Length: 0
```



## 4. ルーティング

今回のコードを簡略化するとこれです

```ts
app.get("/api/memos", (c) => {});

app.post("/api/memos", (c) => {});

app.delete("/api/memos/:id", (c) => {});
```

メソッドとURLが一致すると後ろの関数が実行されます。

### 4.1 コンテキスト
後ろの関数の引数と渡っている`c`は**コンテキスト**と言います。
Honoのコンテキスト `c` は、**通信の中身が入っていたり入れたりする物**です。


### 4.2 リクエスト情報の取得

#### **`c.req.param()`：URLのパラメータを取得**

```ts
app.delete("/api/memos/:id", (c) => {
  const id = Number(c.req.param("id"));
});
```

例えば `/api/memos/1` にアクセスすると、`c.req.param("id")` は `"1"` を返します。

#### **`c.req.json()`：リクエストBodyをJSONとして取得**

```ts
app.post("/api/memos", async (c) => {
  const body = await c.req.json();
  const text = body.text;
});
```

例えば次のBodyを送信した場合、
```json
{
  "text": "Honoの勉強"
}
```

`body.text` から `"Honoの勉強"` を取得できます。


### 4.3 レスポンスの送信

#### **`c.json()`：JSON形式のレスポンスを返す**

```ts
return c.json(memos);
```

例えば、メモが2件あるときの`GET /api/memos`のレスポンスは次のようになります。最初の行がステータス、次がヘッダー、空行の後がBodyです。

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 2,
    "text": "Reactの勉強"
  },
  {
    "id": 1,
    "text": "Honoの勉強"
  }
]
```

ステータスコードも指定できます。
```ts
return c.json({ error: "不正なIDです" }, 400);
```

#### **`c.body()`：レスポンスBodyを指定して返す**

```ts
return c.body(null, 201);
```

例えば、メモの追加に成功すると次のようなレスポンスになります。

```http
HTTP/1.1 201 Created
```
`null`を指定しているため、このレスポンスにはBodyがありません。









