import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./workspaces/server/db/schema.ts",
	out: "./workspaces/server/drizzle",
	dbCredentials: {
		url: process.env.MEMO_DB_PATH ?? "./workspaces/server/data/app.sqlite",
	},
});
