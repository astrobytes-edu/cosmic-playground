#!/usr/bin/env node
/**
 * Stop reminder: when source files have uncommitted changes and STATUS.md has none, remind once per
 * session to update STATUS.md (next:/blocker:/due:). Never blocks.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { addContext, isCodex, readInput, repoRoot } from "./common.mjs";

const input = await readInput();
const root = repoRoot(input.cwd);

const marker = path.join(os.tmpdir(), `cp-status-reminder-${String(input.session_id ?? "unknown").replace(/[^\w-]/g, "")}`);
if (fs.existsSync(marker)) process.exit(0);

let changed = [];
try {
  changed = execSync("git status --porcelain", { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((l) => l.slice(3).trim())
    .filter(Boolean);
} catch {
  process.exit(0);
}

const sourceChanged = changed.some((p) => /^(apps|packages|scripts)\//.test(p));
const statusChanged = changed.includes("STATUS.md");
if (!sourceChanged || statusChanged) process.exit(0);

fs.writeFileSync(marker, "");
const msg = "Source files changed this session and STATUS.md did not. If this was notable progress, a blocker or a new next action, update STATUS.md (next:/blocker:/due:).";
if (isCodex) addContext("Stop", msg);
else process.stdout.write(JSON.stringify({ systemMessage: msg }));
