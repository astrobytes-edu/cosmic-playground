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

async function copyKatexBundle(distDir, targetKatexDir) {
  await copyFile(
    path.join(distDir, "katex.min.css"),
    path.join(targetKatexDir, "katex.min.css")
  );
  await copyDir(path.join(distDir, "fonts"), path.join(targetKatexDir, "fonts"));
}

async function copyKatexIntoPublic(appDir) {
  const distDir = await resolveKatexDistDir();
  const publicKatexDir = path.join(appDir, "public", "assets", "katex");
  await copyKatexBundle(distDir, publicKatexDir);
}

async function copyKatexIntoSourceAssets(appDir) {
  const distDir = await resolveKatexDistDir();
  const sourceKatexDir = path.join(appDir, "src", "assets", "katex");
  await copyKatexBundle(distDir, sourceKatexDir);
}

async function main() {
  const siteDir = path.join(repoRoot, "apps", "site");
  const demosDir = path.join(repoRoot, "apps", "demos");

  await copyKatexIntoPublic(siteDir);
  await copyKatexIntoPublic(demosDir);
  // Demos source HTML links resolve ../../assets/... from src/demos/<slug>/index.html.
  await copyKatexIntoSourceAssets(demosDir);
}

main().catch((err) => {
  console.error("Failed to copy KaTeX assets into apps/*/{public,src}/assets/katex.");
  console.error(err);
  process.exit(1);
});
