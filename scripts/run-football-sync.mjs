#!/usr/bin/env node
/**
 * Run football sync jobs directly (loads .env from repo root).
 * Usage: pnpm run sync:football
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
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

const { runAllSyncJobs } = await import(
  "../artifacts/api-server/src/services/football-sync.ts"
);

console.log("Starting football sync (teams → groups → games)...\n");
const results = await runAllSyncJobs(true);
console.log(JSON.stringify(results, null, 2));

const failed = results.filter((r) => r.status === "error");
if (failed.length) process.exitCode = 1;
