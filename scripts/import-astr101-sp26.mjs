import fs from "node:fs/promises";
import path from "node:path";

import { inlineQuartoIncludes } from "./lib/quarto-inline-includes.mjs";
import { convertQuartoToMarkdown } from "./lib/quarto-to-markdown.mjs";

process.stdout.on("error", (err) => {
  if (err && err.code === "EPIPE") process.exit(0);
});

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args[key] = value;
  }
  return args;
}

function requireArg(args, key) {
  const v = args[key];
  if (!v || v === "true") throw new Error(`Missing required flag --${key}`);
  return String(v);
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function pathExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function writeFile({ outPath, contents, force }) {
  if (!force && (await pathExists(outPath))) {
    throw new Error(`Refusing to overwrite existing file: ${outPath} (use --force)`);
  }
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, contents, "utf8");
}

function sectionFromFilename(name) {
  const base = name.replace(/\.qmd$/i, "");
  if (
    base === "index" ||
    base === "activities" ||
    base === "assessment" ||
    base === "model" ||
    base === "backlog"
  ) {
    return base;
  }
  return null;
}

async function importInstructorBundle({ srcRoot, outRoot, bundle, dryRun, force }) {
  const instructorDir = path.join(srcRoot, "_instructor", bundle);
  const entries = await fs.readdir(instructorDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.endsWith(".qmd")).map((e) => e.name);

  for (const filename of files) {
    const section = sectionFromFilename(filename);
    if (!section) continue;

    const fromPath = path.join(instructorDir, filename);
    const raw = await fs.readFile(fromPath, "utf8");
    const expanded = await inlineQuartoIncludes({ text: raw, fromPath });
    const { markdown, title, hasMath } = convertQuartoToMarkdown({
      qmd: expanded,
      demoSlug: bundle
    });

    const frontmatter = [
      "---",
      `title: ${JSON.stringify(title ?? `${bundle} — ${section}`)}`,
      `bundle: ${JSON.stringify(bundle)}`,
      `section: ${JSON.stringify(section)}`,
      `demo_slug: ${JSON.stringify(bundle)}`,
      `last_updated: ${JSON.stringify(isoDate())}`,
      ...(hasMath ? [`has_math: true`] : []),
      "---",
      ""
    ].join("\n");

    const outPath = path.join(outRoot, "instructor", bundle, `${section}.md`);
    const contents = frontmatter + markdown;

    if (dryRun) {
      console.log(`WRITE instructor ${bundle}/${section}: ${outPath}`);
    } else {
      await writeFile({ outPath, contents, force });
    }
  }
}

async function importStationOverride({ srcRoot, outRoot, slug, dryRun, force }) {
  const fromPath = path.join(srcRoot, "_assets", "station-cards", `${slug}.qmd`);
  if (!(await pathExists(fromPath))) return;

  const raw = await fs.readFile(fromPath, "utf8");
  const expanded = await inlineQuartoIncludes({ text: raw, fromPath });
  const { markdown, title, hasMath } = convertQuartoToMarkdown({ qmd: expanded, demoSlug: slug });

  const stationHeaderPath = path.join(srcRoot, "_assets", "station-cards", "_student-header.qmd");
  const header = (await pathExists(stationHeaderPath))
    ? (await fs.readFile(stationHeaderPath, "utf8")).trim() + "\n\n"
    : "";

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title ?? `Station card: ${slug}`)}`,
    `demo_slug: ${JSON.stringify(slug)}`,
    `last_updated: ${JSON.stringify(isoDate())}`,
    ...(hasMath ? [`has_math: true`] : []),
    "---",
    ""
  ].join("\n");

  const outPath = path.join(outRoot, "stations", `${slug}.md`);
  const contents = frontmatter + header + markdown;

  if (dryRun) {
    console.log(`WRITE station ${slug}: ${outPath}`);
  } else {
    await writeFile({ outPath, contents, force });
  }
}

async function importHub({ srcRoot, outRoot, bundle, dryRun, force }) {
  const fromPath = path.join(srcRoot, "_instructor", bundle, "index.qmd");
  if (!(await pathExists(fromPath))) return;

  const raw = await fs.readFile(fromPath, "utf8");
  const expanded = await inlineQuartoIncludes({ text: raw, fromPath });
  const { markdown, title, hasMath } = convertQuartoToMarkdown({ qmd: expanded, demoSlug: bundle });

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title ?? bundle)}`,
    `bundle: ${JSON.stringify(bundle)}`,
    `last_updated: ${JSON.stringify(isoDate())}`,
    ...(hasMath ? [`has_math: true`] : []),
    "---",
    ""
  ].join("\n");

  const outPath = path.join(outRoot, "hubs", `${bundle}.md`);
  const contents = frontmatter + markdown;

  if (dryRun) {
    console.log(`WRITE hub ${bundle}: ${outPath}`);
  } else {
    await writeFile({ outPath, contents, force });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const srcRoot = requireArg(args, "src");
  const dryRun = String(args["dry-run"] ?? "false") === "true";
  const force = String(args.force ?? "false") === "true";

  const repoRoot = process.cwd();
  const outRoot = path.join(repoRoot, "apps", "site", "src", "content");

  const demoBundles = [
    "angular-size",
    "binary-orbits",
    "blackbody-radiation",
    "conservation-laws",
    "eclipse-geometry",
    "em-spectrum",
    "keplers-laws",
    "moon-phases",
    "parallax-distance",
    "seasons",
    "telescope-resolution"
  ];

  for (const slug of demoBundles) {
    await importInstructorBundle({ srcRoot, outRoot, bundle: slug, dryRun, force });
    await importStationOverride({ srcRoot, outRoot, slug, dryRun, force });
  }

  const hubs = ["cosmic-playground", "distance-and-measurement", "light-and-telescopes"];
  for (const hub of hubs) {
    await importHub({ srcRoot, outRoot, bundle: hub, dryRun, force });
  }

  if (dryRun) {
    console.log("OK (dry-run).");
  } else {
    console.log("OK: imported instructor + station + hub content.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
