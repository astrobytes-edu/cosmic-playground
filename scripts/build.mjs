import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function pathExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.rm(dest, { recursive: true, force: true });
  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  const demosDir = path.join(repoRoot, "apps", "demos");
  const siteDir = path.join(repoRoot, "apps", "site");

  await run("node", [path.join(repoRoot, "scripts", "validate-invariants.mjs")]);
  await run("node", [path.join(repoRoot, "scripts", "validate-datasets.mjs")]);
  await run("node", [path.join(repoRoot, "scripts", "validate-physics-models.mjs")]);
  await run("node", [path.join(repoRoot, "scripts", "copy-katex-assets.mjs")]);
  await run("corepack", ["pnpm", "-C", demosDir, "build"]);

  const demosDist = path.join(demosDir, "dist");
  const sitePlayRoot = path.join(siteDir, "public", "play");
  // Deterministic local builds: avoid stale /play/<slug>/ directories surviving between runs.
  await fs.rm(sitePlayRoot, { recursive: true, force: true });
  await fs.mkdir(sitePlayRoot, { recursive: true });

  const entries = await fs.readdir(demosDist, { withFileTypes: true });
  const slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const slug of slugs) {
    const src = path.join(demosDist, slug);
    const dest = path.join(sitePlayRoot, slug);
    if (!(await pathExists(src))) continue;
    await copyDir(src, dest);
  }

  await run("node", [path.join(repoRoot, "scripts", "validate-play-dirs.mjs")]);
  await run("corepack", ["pnpm", "-C", siteDir, "build"]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
