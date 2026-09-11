#!/usr/bin/env node
/**
 * Checks that each demo's release-state frontmatter is internally consistent, so what readers see (badge
 * and "Active development" callout) tells one story. Exits 1 with file-level reasons on any violation.
 *
 *   node .agents/skills/cosmic-readiness/scripts/check-readiness.mjs [contentDemosDir]
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] ?? "apps/site/src/content/demos");
const PAIRS = { stable: ["launch-ready"], beta: ["candidate"], draft: ["experimental", "stub"] };

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return fields;
}

const problems = [];
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
for (const file of files) {
  const fm = frontmatter(fs.readFileSync(path.join(dir, file), "utf8"));
  const where = path.join(path.relative(process.cwd(), dir), file);
  if (!fm) { problems.push(`${where}: no frontmatter`); continue; }
  const { status, readiness, readinessReason, content_verified, unlisted, unlistedReason } = fm;
  if (!PAIRS[status]) problems.push(`${where}: unknown status "${status}"`);
  else if (!PAIRS[status].includes(readiness))
    problems.push(`${where}: status "${status}" does not pair with readiness "${readiness}" (expected ${PAIRS[status].join(" or ")})`);
  if (!readinessReason) problems.push(`${where}: readinessReason is empty`);
  if (readiness === "launch-ready" && content_verified !== "true")
    problems.push(`${where}: launch-ready requires content_verified: true`);
  if (unlisted === "true" && !unlistedReason) problems.push(`${where}: unlisted without unlistedReason`);
  if (unlisted === "true" && readiness === "launch-ready") problems.push(`${where}: an unlisted demo cannot be launch-ready`);
}

if (problems.length) {
  console.error(`Readiness problems (${problems.length}):\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(`OK: ${files.length} demos have consistent status/readiness frontmatter.`);
