import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist");

const websiteDist = path.join(root, "artifacts", "website", "dist", "public");
const worldcupDist = path.join(root, "artifacts", "worldcup", "dist", "public");

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else {
      await fs.copyFile(from, to);
    }
  }
}

async function main() {
  for (const dir of [websiteDist, worldcupDist]) {
    try {
      await fs.access(dir);
    } catch {
      console.error(`[prepare-vercel-output] Missing build output: ${dir}`);
      process.exit(1);
    }
  }

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  await copyDir(websiteDist, outDir);
  await copyDir(worldcupDist, path.join(outDir, "worldcup"));

  console.log("[prepare-vercel-output] Wrote dist/ (landing + /worldcup)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
