import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const defaultDbPath = fileURLToPath(new URL("../data/app.sqlite", import.meta.url));
const migrationsFolder = fileURLToPath(new URL("../drizzle/", import.meta.url));
const sqlite = new Database(process.env.MEMO_DB_PATH ?? defaultDbPath);

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder });
