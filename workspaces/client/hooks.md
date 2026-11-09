## use-Memosの概要
```ts
import { useEffect, useState, type SubmitEvent } from "react";

export function useMemos() {
	const [memos, setMemos] = useState<Memo[]>([]);
	const [text, setText] = useState("");

	useEffect(() => {
		async function loadMemos() {
            // Memoの一覧を取得するリクエスト
		}

		void loadMemos();
	}, []);

	async function addMemo(event: SubmitEvent<HTMLFormElement>) {
        // textを追加するリクエスト
        // Memoの一覧を取得するリクエスト
	}

	async function removeMemo(id: number) {
        // Memoを削除するリクエスト
        // Memoの一覧を取得するリクエスト
	}

	return {
		memos,
		text,
		setText,
		addMemo,
		removeMemo,
	};
}
```





## GET：画面を開いたときの一覧取得

`useMemos` の `useEffect(..., [])` は、`App` が画面に表示された後に動きます。
そこで `loadMemos()` を呼び、一覧を取得します。

```ts
async function loadMemos() {
    try {
        const response = await fetch("/api/memos");
        if (!response.ok) throw new Error("メモを読み込めませんでした");

        setMemos((await response.json()) as Memo[]);
    } catch (cause) {
        console.error(cause);
    }
}

void loadMemos();
```

`fetch` は `method` を指定しない場合、GET を送ります。
サーバーの `app.get("/api/memos", ...)` は SQLite からメモを新しい順に読み、JSON の配列として返します。
`response.json()` でその配列を受け取り、`setMemos` に渡します。

`main.tsx` は `memos.map(...)` で各メモを表示します。0 件なら「まだメモはありません。」を表示します。



## POST：メモを追加するとき

入力欄の `value={text}` はフックの `text` を表示し、入力のたびに `onChange` が `setText` を呼びます。

```tsx
<input value={text} onChange={(event) => setText(event.target.value)} />
<form onSubmit={addMemo}>...</form>
```

フォームを送信すると、フックの `addMemo` が動きます。

```ts
async function addMemo(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;

    try {
        const response = await fetch("/api/memos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error("メモを追加できませんでした");

        setText("");
        const listResponse = await fetch("/api/memos");
        if (!listResponse.ok) throw new Error("メモを読み込めませんでした");
        setMemos((await listResponse.json()) as Memo[]);
    } catch (cause) {
        console.error(cause);
    }
}
```

`preventDefault()` はフォーム送信によるページの再読み込みを防ぎます。空白だけなら送信しません。サーバーの `app.post("/api/memos", ...)` は本文を検査し、SQLite に保存します。成功時は **201** を返しますが、レスポンス本文はありません。

そのため、フックは成功後に入力欄を空にし、GET で一覧を読み直します。

```ts
setText("");
const listResponse = await fetch("/api/memos");
if (!listResponse.ok) throw new Error("メモを読み込めませんでした");
setMemos((await listResponse.json()) as Memo[]);
```

`setText("")` で入力欄が空になり、`setMemos(...)` で追加されたメモが一覧に表示されます。



## DELETE：メモを削除するとき

各メモの削除ボタンは、そのメモの `id` を `removeMemo` に渡します。

```tsx
<button onClick={() => removeMemo(memo.id)}>削除</button>
```

フックは ID を URL に入れて DELETE を送ります。

```ts
async function removeMemo(id: number) {
    try {
        const response = await fetch(`/api/memos/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("メモを削除できませんでした");

        const listResponse = await fetch("/api/memos");
        if (!listResponse.ok) throw new Error("メモを読み込めませんでした");
        setMemos((await listResponse.json()) as Memo[]);
    } catch (cause) {
        console.error(cause);
    }
}
```

例えば `id` が `3` なら送信先は `/api/memos/3` です。サーバーの `app.delete("/api/memos/:id", ...)` は URL から ID を取り、SQLite の該当行を削除します。成功時は **204** を返し、レスポンス本文はありません。

POST と同様に、フックは削除成功後に GET で一覧を読み直し、`setMemos(...)` で画面から削除済みのメモを消します。

## 通信に失敗した場合

GET・POST・DELETE のいずれかで失敗すると、フックは `console.error(cause)` でブラウザのコンソールに記録します。このアプリには画面上のエラー表示はありません。POST や DELETE 自体は成功した後、その後の一覧 GET だけが失敗した場合も、画面の一覧は更新されません。


React Router
drrizle ORM
Cloudflare D1,wrangler
ソフトウェアアーキテクチャ, オブジェクト指向
(Tanstack Query)
Hono上級編
認証
ジェネリクス型