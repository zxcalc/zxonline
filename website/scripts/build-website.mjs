import { spawn } from "node:child_process";
import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const distDir = resolve(projectRoot, "dist");
const targetDir = resolve(projectRoot, "website", "zx-canvas");

await run("npm", ["run", "build", "--", "--base", "./"]);

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

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", rejectRun);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      rejectRun(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}
