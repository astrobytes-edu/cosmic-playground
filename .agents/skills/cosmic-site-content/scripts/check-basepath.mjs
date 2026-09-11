#!/usr/bin/env node
/**
 * Base-path scan for Cosmic Playground. Prints file:line for every internal link that would 404 under
 * GitHub Pages' /cosmic-playground/ base, and exits 1 if any are found.
 *
 *   node .agents/skills/cosmic-site-content/scripts/check-basepath.mjs [repoRoot]
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());

const RULES = [
  {
    dir: "apps/site/src",
    exts: [".astro", ".ts", ".tsx", ".md", ".mdx"],
    // Root-absolute href/src (but not protocol-relative "//" or a bare "/" home link built elsewhere).
    patterns: [/\b(?:href|src)=["']\/(?!\/)[^"']/, /\]\(\/(?!\/)/],
    why: "root-absolute internal link; use import.meta.env.BASE_URL (Astro) or a relative link (Markdown)"
  },
  {
    dir: "apps/demos/src/demos",
    exts: [".html", ".ts"],
    patterns: [/\b(?:href|src)=["']\/(?!\/)[^"']/],
    why: "root-absolute link in a demo; use ../../<route>/ or new URL('../../', location.href)"
  },
  {
    dir: "apps",
    exts: [".astro", ".ts", ".tsx", ".html", ".md", ".mdx"],
    patterns: [/["'(]\/cosmic-playground\//],
    why: "hardcoded base path"
  }
];

const SKIP = new Set(["node_modules", "dist", "public", ".astro"]);

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    // Tests and build/test configs legitimately name the base path (e.g. playwright.config.ts's default).
    else if (exts.includes(path.extname(entry.name)) && !/\.(test|spec|config)\.[tj]sx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const hits = [];
for (const rule of RULES) {
  for (const file of walk(path.join(root, rule.dir), rule.exts)) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      if (rule.patterns.some((p) => p.test(line))) {
        hits.push(`${path.relative(root, file)}:${i + 1}: ${rule.why}\n    ${line.trim().slice(0, 140)}`);
      }
    });
  }
}

if (hits.length) {
  console.error(`Base-path violations (${hits.length}):\n`);
  for (const h of [...new Set(hits)]) console.error(h);
  process.exit(1);
}
console.log("OK: no root-absolute internal links or hardcoded /cosmic-playground/ found.");
