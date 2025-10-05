import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_DIR = ".data";
const DB_FILE = "market.db";

function ensureDataDir() {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
}

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  ensureDataDir();
  const file = join(process.cwd(), DB_DIR, DB_FILE);
  const sqlite = new Database(file);
  _db = drizzle(sqlite, { logger: false });
  return _db;
}
