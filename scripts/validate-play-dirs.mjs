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

async function readText(p) {
  return fs.readFile(p, "utf8");
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

async function getDemoSlugsFromSource() {
  const demosDir = path.join(repoRoot, "apps", "demos", "src", "demos");
  const entries = await fs.readdir(demosDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
}

function missingMarkers(html, markers) {
  return markers.filter((m) => !html.includes(m));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findStartTagById(html, id) {
  const re = new RegExp(`<[^>]+\\bid=["']${escapeRegExp(id)}["'][^>]*>`, "i");
  const match = html.match(re);
  return match ? match[0] : null;
}

async function main() {
  const slugs = await getDemoSlugsFromContent();
  const playRoot = path.join(repoRoot, "apps", "site", "public", "play");

  const missingPlayArtifacts = [];
  for (const slug of slugs) {
    const indexPath = path.join(playRoot, slug, "index.html");
    if (!(await pathExists(indexPath)))
      missingPlayArtifacts.push({ slug, indexPath });
  }

  const requiredMarkers = [
    'id="cp-demo"',
    'id="copyResults"',
    'id="status"',
    "cp-demo__drawer"
  ];

  const missingContractMarkers = [];
  for (const slug of slugs) {
    const indexPath = path.join(playRoot, slug, "index.html");
    if (!(await pathExists(indexPath))) continue;
    const html = await readText(indexPath);
    const missing = missingMarkers(html, requiredMarkers);
    if (missing.length > 0) {
      missingContractMarkers.push({ slug, indexPath, missing });
    }
  }

  const invalidExportStatusRegion = [];
  for (const slug of slugs) {
    const indexPath = path.join(playRoot, slug, "index.html");
    if (!(await pathExists(indexPath))) continue;
    const html = await readText(indexPath);

    const statusTag = findStartTagById(html, "status");
    if (!statusTag) continue;

    const missing = [];
    if (!/\brole=["']status["']/i.test(statusTag)) missing.push('role="status"');
    if (!/\baria-live=["']polite["']/i.test(statusTag))
      missing.push('aria-live="polite"');

    if (missing.length > 0) {
      invalidExportStatusRegion.push({ slug, indexPath, missing, statusTag });
    }
  }

  const invalidCopyResultsButton = [];
  for (const slug of slugs) {
    const indexPath = path.join(playRoot, slug, "index.html");
    if (!(await pathExists(indexPath))) continue;
    const html = await readText(indexPath);

    const copyResultsTag = findStartTagById(html, "copyResults");
    if (!copyResultsTag) continue;

    const missing = [];
    if (!/^<button\b/i.test(copyResultsTag)) missing.push("<button …>");
    if (!/\btype=["']button["']/i.test(copyResultsTag))
      missing.push('type="button"');

    if (missing.length > 0) {
      invalidCopyResultsButton.push({ slug, indexPath, missing, copyResultsTag });
    }
  }

  const sourceSlugs = await getDemoSlugsFromSource();
  const missingMetadata = [];
  for (const slug of sourceSlugs) {
    const mdPath = path.join(
      repoRoot,
      "apps",
      "site",
      "src",
      "content",
      "demos",
      `${slug}.md`
    );
    const mdxPath = path.join(
      repoRoot,
      "apps",
      "site",
      "src",
      "content",
      "demos",
      `${slug}.mdx`
    );
    if ((await pathExists(mdPath)) || (await pathExists(mdxPath))) continue;
    missingMetadata.push({ slug, expected: [mdPath, mdxPath] });
  }

  if (
    missingPlayArtifacts.length > 0 ||
    missingContractMarkers.length > 0 ||
    invalidExportStatusRegion.length > 0 ||
    invalidCopyResultsButton.length > 0 ||
    missingMetadata.length > 0
  ) {
    if (missingPlayArtifacts.length > 0) {
      console.error("Missing built demo artifacts for content slugs:");
      for (const m of missingPlayArtifacts) {
        console.error(`- ${m.slug} (expected ${m.indexPath})`);
      }
      console.error("");
    }

    if (missingContractMarkers.length > 0) {
      console.error("Built demo artifacts missing required instrument markers:");
      for (const item of missingContractMarkers) {
        console.error(`- ${item.slug} (${item.indexPath})`);
        for (const marker of item.missing) console.error(`  - missing: ${marker}`);
      }
      console.error("");
    }

    if (invalidExportStatusRegion.length > 0) {
      console.error("Built demo artifacts missing export status live-region attributes:");
      for (const item of invalidExportStatusRegion) {
        console.error(`- ${item.slug} (${item.indexPath})`);
        for (const marker of item.missing) console.error(`  - missing: ${marker}`);
      }
      console.error("");
    }

    if (invalidCopyResultsButton.length > 0) {
      console.error("Built demo artifacts missing copy results button semantics:");
      for (const item of invalidCopyResultsButton) {
        console.error(`- ${item.slug} (${item.indexPath})`);
        for (const marker of item.missing) console.error(`  - missing: ${marker}`);
      }
      console.error("");
    }

    if (missingMetadata.length > 0) {
      console.error("Demo source folders missing content metadata entries:");
      for (const item of missingMetadata) {
        console.error(`- ${item.slug} (expected ${item.expected.join(" or ")})`);
      }
      console.error("");
    }

    process.exit(1);
  }

  console.log(
    `OK: validated ${slugs.length} content demo(s) and ${sourceSlugs.length} demo source folder(s).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
