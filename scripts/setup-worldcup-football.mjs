#!/usr/bin/env node
/**
 * Apply football World Cup migration (DATABASE_URL) and run first sync (CRON_SECRET + API).
 * Usage: node scripts/setup-worldcup-football.mjs [--skip-migration] [--skip-sync]
 * Loads .env from repo root when present.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv();

const skipMigration = process.argv.includes("--skip-migration");
const skipSync = process.argv.includes("--skip-sync");

async function applyMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("⏭  DATABASE_URL not set — skip migration.");
    console.log("   VPS: bash scripts/apply-migration-vps.sh");
    console.log("   Local: run D:\\Work\\VPS\\scripts\\db-tunnel-vscor.cmd then set DATABASE_URL=@127.0.0.1:5832");
    return false;
  }

  const migrationPath = resolve(
    root,
    "supabase/migrations/20260615120000_football_worldcup26_tables.sql",
  );
  const sql = readFileSync(migrationPath, "utf8");
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log("✓  Migration applied:", migrationPath);
    return true;
  } finally {
    await client.end();
  }
}

async function runFirstSync() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.log("⏭  CRON_SECRET not set — skip first sync.");
    return false;
  }

  const apiBase = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
  const url = `${apiBase.replace(/\/$/, "")}/api/sync-football-data?job=all&force=1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`✗  Sync failed (${res.status}):`, body.slice(0, 500));
    return false;
  }

  console.log("✓  First sync completed:", body.slice(0, 300));
  return true;
}

async function main() {
  console.log("World Cup football setup\n");

  if (!skipMigration) {
    try {
      await applyMigration();
    } catch (err) {
      console.error("✗  Migration error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  }

  if (!skipSync) {
    try {
      await runFirstSync();
    } catch (err) {
      console.error("✗  Sync error:", err instanceof Error ? err.message : err);
      console.error("   Start API with env vars: pnpm run dev:api");
      process.exitCode = 1;
    }
  }

  if (!process.env.DATABASE_URL && !process.env.CRON_SECRET) {
    console.log("\nNext: copy .env.example → .env, fill values, then re-run this script.");
  }
}

main();
