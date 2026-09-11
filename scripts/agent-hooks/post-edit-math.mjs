#!/usr/bin/env node
/**
 * PostToolUse check after an edit: runs scripts/validate-math-formatting.mjs and, if it reports problems in
 * a file just edited (Unicode math symbols, or single-line $$...$$ in Markdown), tells the model which lines.
 * Never blocks; silent when the edit touched nothing the validator scans or introduced no problems.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { addContext, editedPaths, readInput, repoRoot } from "./common.mjs";

const SCANNED = /(?:^|\/)(?:apps\/demos\/src\/demos|apps\/site\/src|packages\/runtime\/src)\/.+\.(?:md|mdx|astro|html|ts|tsx|js|mjs|cjs)$/;

const input = await readInput();
const root = repoRoot(input.cwd);
const edited = editedPaths(input)
  .map((p) => path.relative(root, path.resolve(input.cwd || root, p)))
  .filter((p) => SCANNED.test(p));
if (edited.length === 0) process.exit(0);

const run = spawnSync(process.execPath, ["scripts/validate-math-formatting.mjs"], { cwd: root, encoding: "utf8" });
if (run.status === 0) process.exit(0);

const report = `${run.stdout}\n${run.stderr}`
  .split("\n")
  .filter((line) => edited.some((p) => line.startsWith(`${p}:`)));
if (report.length === 0) process.exit(0);

addContext(
  "PostToolUse",
  `validate-math-formatting flags the file(s) you just edited. Use KaTeX, not Unicode math, and fence display math ($$ on its own lines) in Markdown:\n${report.slice(0, 20).join("\n")}`
);
