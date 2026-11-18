import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const memos = sqliteTable("memos", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	text: text("text").notNull(),
});
