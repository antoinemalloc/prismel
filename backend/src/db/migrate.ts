import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { resolve } from "path";
import { createHash } from "crypto";
import { readFileSync } from "fs";

const dbPath = resolve(import.meta.dirname, "../../../data/prismel.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite);

const migrationsFolder = resolve(import.meta.dirname, "./migrations");
const journalPath = resolve(migrationsFolder, "meta/_journal.json");
const journal = JSON.parse(readFileSync(journalPath, "utf-8")) as {
  entries: { idx: number; when: number; tag: string }[];
};

// Ensure the Drizzle migrations tracking table exists.
sqlite.exec(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL,
  created_at INTEGER
)`);

const existingHashes = new Set(
  (sqlite.prepare("SELECT hash FROM __drizzle_migrations").all() as { hash: string }[]).map(
    (r) => r.hash,
  ),
);

const hasTable = (name: string) =>
  !!sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);

const aliasesColumns = hasTable("aliases")
  ? (sqlite.prepare("PRAGMA table_info(aliases)").all() as { name: string }[])
  : [];
const hasTagsColumn = aliasesColumns.some((c) => c.name === "tags");
const hasTagsTable = hasTable("tags");
const hasAliasTagsTable = hasTable("alias_tags");

/**
 * Pre-mark migrations as applied when the target schema is already in place.
 * This handles DBs created via `drizzle-kit push` (which doesn't track migrations)
 * so the migrator doesn't try to recreate existing tables.
 */
const markApplied = (maxIdx: number) => {
  for (const entry of journal.entries) {
    if (entry.idx > maxIdx) break;
    const sqlPath = resolve(migrationsFolder, `${entry.tag}.sql`);
    const content = readFileSync(sqlPath, "utf-8");
    const hash = createHash("sha256").update(content).digest("hex");
    if (!existingHashes.has(hash)) {
      sqlite
        .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
        .run(hash, entry.when);
      existingHashes.add(hash);
    }
  }
};

if (!hasTable("aliases")) {
  // Fresh DB: nothing to pre-mark, let the migrator create everything.
} else if (hasTagsTable && hasAliasTagsTable && !hasTagsColumn) {
  // Fully migrated (new schema already in place). Mark everything applied.
  markApplied(Number.MAX_SAFE_INTEGER);
} else if (hasTable("aliases") && hasTagsColumn && !hasTagsTable) {
  // Old schema (created via push). Mark 0000-0002 applied; let 0003 run.
  markApplied(2);
}

migrate(db, { migrationsFolder });

// Backfill from the legacy aliases.tags JSON column if it still exists.
const stillHasTagsColumn = (sqlite.prepare("PRAGMA table_info(aliases)").all() as { name: string }[]).some(
  (c) => c.name === "tags",
);

if (stillHasTagsColumn) {
  const now = new Date().toISOString();

  // DISTINCT on the lowercased value: legacy JSON may contain mixed-case
  // duplicates (e.g. ["Github", "github"]) that must collapse to one row.
  const distinctNames = sqlite
    .prepare(
      `SELECT DISTINCT lower(je.value) AS name
       FROM aliases, json_each(aliases.tags) je
       WHERE je.value IS NOT NULL AND je.value != ''`,
    )
    .all() as { name: string }[];

  const { randomPastel } = await import("../lib/color.js");
  // INSERT OR IGNORE makes the backfill idempotent — a previous partial
  // migration may have left some tags in place.
  const insertTag = sqlite.prepare(
    "INSERT OR IGNORE INTO tags (name, color, created_at) VALUES (?, ?, ?)",
  );
  const selectTagId = sqlite.prepare("SELECT id FROM tags WHERE name = ?");
  const tagIdByName = new Map<string, number>();
  for (const { name } of distinctNames) {
    // Defensive dedupe — SQL lower() should already collapse, but guard
    // against any other path that re-introduces collisions.
    if (tagIdByName.has(name)) continue;
    insertTag.run(name, randomPastel(), now);
    const row = selectTagId.get(name) as { id: number } | undefined;
    if (row) tagIdByName.set(name, row.id);
  }

  const aliasRows = sqlite
    .prepare("SELECT id, tags FROM aliases WHERE tags IS NOT NULL AND tags != '[]'")
    .all() as { id: string; tags: string }[];
  const insertJunction = sqlite.prepare(
    "INSERT OR IGNORE INTO alias_tags (alias_id, tag_id) VALUES (?, ?)",
  );
  for (const { id, tags } of aliasRows) {
    try {
      const names = JSON.parse(tags) as string[];
      for (const raw of names) {
        const normalized = raw.toLowerCase();
        const tagId = tagIdByName.get(normalized);
        if (tagId) insertJunction.run(id, tagId);
      }
    } catch {
      // Skip malformed rows.
    }
  }

  sqlite.exec("ALTER TABLE aliases DROP COLUMN tags");
  console.log(`Backfilled ${distinctNames.length} tag(s) from legacy aliases.tags column`);
}

console.log("Migrations applied");
sqlite.close();
