import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

async function pathExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function getDemoSlugsFromContent() {
  const demosDir = path.join(
    repoRoot,
    "apps",
    "site",
    "src",
    "content",
    "demos"
  );
  const files = await fs.readdir(demosDir, { withFileTypes: true });
  const slugs = [];

  for (const entry of files) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (ext !== ".md" && ext !== ".mdx") continue;
    slugs.push(path.basename(entry.name, ext));
  }

  return slugs.sort();
}

async function main() {
  const slugs = await getDemoSlugsFromContent();
  const playRoot = path.join(repoRoot, "apps", "site", "public", "play");

  const missing = [];
  for (const slug of slugs) {
    const indexPath = path.join(playRoot, slug, "index.html");
    if (!(await pathExists(indexPath))) missing.push({ slug, indexPath });
  }

  if (missing.length > 0) {
    console.error("Missing built demo artifacts for content slugs:");
    for (const m of missing) {
      console.error(`- ${m.slug} (expected ${m.indexPath})`);
    }
    process.exit(1);
  }

  console.log(`OK: found play artifacts for ${slugs.length} demo(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
