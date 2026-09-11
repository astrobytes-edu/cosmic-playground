#!/usr/bin/env node
/**
 * PreToolUse guard for shell commands. Blocks the git and test-runner mistakes that have cost this
 * project time: bulk staging, staging the local .gitignore edit, force pushes, skipped hooks, and a second
 * Playwright run while one is in progress (they share port 4321 and wipe test-results/).
 */
import { execSync } from "node:child_process";
import { block, commandOf, readInput } from "./common.mjs";

const input = await readInput();
const raw = commandOf(input);
if (!raw) process.exit(0);

// Match only what the shell will execute: drop heredoc bodies and quoted strings first, so a commit
// message or a file being written that merely mentions `git add -A` is not blocked.
const cmd = raw
  .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g, "<<HEREDOC")
  .replace(/'[^']*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""');

const RULES = [
  [/\bgit\s+add\s+(?:[^;&|]*\s)?(?:-A\b|--all\b|\.(?=\s|$|[;&|]))/, "Stage explicit paths; `git add -A` / `git add .` is blocked in this repo."],
  // `git add` only: a commit message that merely mentions .gitignore must not be blocked.
  [/\bgit\s+add\b[^;&|]*\.gitignore\b/, "Staging .gitignore is blocked: it carries a local edit that must not be committed. Ask Anna first."],
  [/\bgit\s+commit\b[^;&|]*\s-(?:[a-z]*a[a-z]*)\b|\bgit\s+commit\b[^;&|]*--all\b/, "`git commit -a` stages every tracked change (including the local .gitignore edit). Stage explicit paths instead."],
  [/\bgit\s+push\b[^;&|]*(?:--force\b|--force-with-lease\b|\s-f\b)/, "Force push is blocked. Ask Anna explicitly before rewriting history."],
  [/\bgit\s+(?:commit|push)\b[^;&|]*--no-verify\b/, "--no-verify is blocked; fix the failing hook or check instead."]
];
for (const [pattern, reason] of RULES) {
  if (pattern.test(cmd)) block(reason);
}

if (/\btest:e2e\b|\bplaywright\s+test\b/.test(cmd)) {
  let running = "";
  try {
    running = execSync("pgrep -fl 'playwright(/cli\\.js)? test|playwright test'", { encoding: "utf8" }).trim();
  } catch {
    running = "";
  }
  if (running) {
    block(`A Playwright run is already in progress (${running.split("\n")[0]}). Wait for it to finish: two runs share port 4321 and wipe test-results/.`);
  }
}

process.exit(0);
