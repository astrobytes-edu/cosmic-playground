import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const require = createRequire(import.meta.url);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

async function copyDir(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.rm(dest, { recursive: true, force: true });
  await fs.cp(src, dest, { recursive: true });
}

async function resolveKatexDistDir() {
  const resolutionRoots = [
    repoRoot,
    path.join(repoRoot, "apps", "site")
  ];

  let pkgJson = null;
  for (const root of resolutionRoots) {
    try {
      pkgJson = require.resolve("katex/package.json", { paths: [root] });
      break;
    } catch {
      // try next
    }
  }

  if (!pkgJson) {
    throw new Error(
      "KaTeX dependency not found. Ensure dependencies are installed (pnpm install)."
    );
  }

  return path.join(path.dirname(pkgJson), "dist");
}

async function copyKatexIntoPublic(appDir) {
  const distDir = await resolveKatexDistDir();
  const publicKatexDir = path.join(appDir, "public", "assets", "katex");

  await copyFile(
    path.join(distDir, "katex.min.css"),
    path.join(publicKatexDir, "katex.min.css")
  );
  await copyDir(path.join(distDir, "fonts"), path.join(publicKatexDir, "fonts"));
}

async function main() {
  const apps = [
    path.join(repoRoot, "apps", "site"),
    path.join(repoRoot, "apps", "demos")
  ];

  for (const appDir of apps) {
    await copyKatexIntoPublic(appDir);
  }
}

main().catch((err) => {
  console.error("Failed to copy KaTeX assets into apps/*/public/assets/katex.");
  console.error(err);
  process.exit(1);
});
