import { DatabaseSync } from "node:sqlite";
import { serve } from "@hono/node-server";
import { Hono } from "hono";


// DBの初期化・パスの設定
const db = new DatabaseSync("./data/app.sqlite");
db.exec(`
  CREATE TABLE IF NOT EXISTS memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL
  )
`);


// 以下はAPIのルーティング

// メモの型定義
type Memo = {
	id: number;
	text: string;
};

const app = new Hono();

app.get("/api/memos", (c) => {
	const memos = db
		.prepare("SELECT id, text FROM memos ORDER BY id DESC")
		.all() as Memo[];

	return c.json(memos);
});


app.post("/api/memos", async (c) => {
	const body = await c.req.json().catch(() => null);
	const text = typeof body?.text === "string" ? body.text.trim() : "";

	if (!text || text.length > 200) {
		return c.json({ error: "メモは1〜200文字で入力してください" }, 400);
	}

	db.prepare("INSERT INTO memos (text) VALUES (?)").run(text);

	return c.body(null, 201);
});


app.delete("/api/memos/:id", (c) => {
	const id = Number(c.req.param("id"));

	if (!Number.isSafeInteger(id) || id <= 0) {
		return c.json({ error: "不正なIDです" }, 400);
	}

	const result = db.prepare("DELETE FROM memos WHERE id = ?").run(id);

	if (result.changes === 0) {
		return c.json({ error: "メモが見つかりません" }, 404);
	}

	return c.body(null, 204);
});


const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port, hostname: "localhost" });
console.log(`Hono: http://localhost:${port}`);
