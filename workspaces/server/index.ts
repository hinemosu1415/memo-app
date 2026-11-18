import { serve } from "@hono/node-server";
import { vValidator } from "@hono/valibot-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import * as v from "valibot";
import { db } from "./db";
import { memos as memosTable } from "./db/schema";


// 以下はAPIのルーティング

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

const app = new Hono();

app.get("/api/memos", (c) => {
	const memos = db.select().from(memosTable).orderBy(desc(memosTable.id)).all();

	return c.json(memos);
});


app.post(
	"/api/memos",
	vValidator("json", createMemoSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "メモは1〜200文字で入力してください" }, 400);
		}
	}),
	(c) => {
		const { text } = c.req.valid("json");
		db.insert(memosTable).values({ text }).run();

		return c.body(null, 201);
	},
);


app.delete(
	"/api/memos/:id",
	vValidator("param", memoIdSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "不正なIDです" }, 400);
		}
	}),
	(c) => {
		const { id } = c.req.valid("param");
		const result = db.delete(memosTable).where(eq(memosTable.id, id)).run();

		if (result.changes === 0) {
			return c.json({ error: "メモが見つかりません" }, 404);
		}

		return c.body(null, 204);
	},
);


const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port, hostname: "localhost" });
console.log(`Hono: http://localhost:${port}`);
