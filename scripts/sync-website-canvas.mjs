import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");
const targetDir = resolve(projectRoot, "website", "zx-canvas");

try {
  const distStat = await stat(distDir);
  if (!distStat.isDirectory()) {
    throw new Error(`${distDir} is not a directory`);
  }
} catch (error) {
  throw new Error("Run `npm run build` before syncing the website canvas.", {
    cause: error,
  });
}

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });
await cp(distDir, targetDir, { recursive: true });

console.log(`Synced canvas build to ${targetDir}`);
