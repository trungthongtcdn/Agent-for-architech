import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

const MIGRATIONS: string[] = [
  // 1 — schema gốc
  `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    credits INTEGER NOT NULL DEFAULT 0,
    disabled INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX idx_sessions_user ON sessions(user_id);

  CREATE TABLE credit_tx (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT NOT NULL,
    ref TEXT,
    note TEXT,
    actor_id TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_credit_tx_user ON credit_tx(user_id, created_at DESC);

  CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    params TEXT NOT NULL,
    inputs TEXT NOT NULL DEFAULT '[]',
    outputs TEXT NOT NULL DEFAULT '[]',
    cost INTEGER NOT NULL,
    refunded INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    provider_ref TEXT,
    model TEXT,
    created_at INTEGER NOT NULL,
    started_at INTEGER,
    finished_at INTEGER
  );
  CREATE INDEX idx_jobs_user ON jobs(user_id, created_at DESC);
  CREATE INDEX idx_jobs_status ON jobs(status);

  CREATE TABLE topups (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id TEXT NOT NULL,
    credits INTEGER NOT NULL,
    amount_vnd INTEGER NOT NULL,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at INTEGER NOT NULL,
    handled_by TEXT,
    handled_at INTEGER
  );
  CREATE INDEX idx_topups_status ON topups(status, created_at DESC);
  `,
];

function open(): Database.Database {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const db = new Database(path.join(config.dataDir, "app.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
  return db;
}

const g = globalThis as unknown as { __archDb?: Database.Database };

export function db(): Database.Database {
  if (!g.__archDb) g.__archDb = open();
  return g.__archDb;
}

export const now = () => Date.now();
