/**
 * Shared helpers for the project hooks, used by both Claude Code (.claude/settings.json) and Codex
 * (.codex/hooks.json). Both agents send a JSON object on stdin with `tool_input` and accept the same
 * outputs: exit code 2 (stderr = reason) blocks; `hookSpecificOutput.additionalContext` informs the model.
 * Pass `--codex` from the Codex config where the output format differs.
 */
import { execSync } from "node:child_process";

export const isCodex = process.argv.includes("--codex");

export async function readInput() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

/** The shell command a tool call will run, whatever the agent calls the field. */
export function commandOf(input) {
  const ti = input.tool_input ?? {};
  const cmd = ti.command ?? ti.cmd ?? ti.args ?? "";
  return Array.isArray(cmd) ? cmd.join(" ") : String(cmd);
}

/** File paths a tool call edits: direct path fields, plus files named in an apply_patch body. */
export function editedPaths(input) {
  const ti = input.tool_input ?? {};
  const out = [];
  for (const key of ["file_path", "path", "notebook_path"]) {
    if (typeof ti[key] === "string") out.push(ti[key]);
  }
  const blob = JSON.stringify(ti);
  for (const m of blob.matchAll(/\*\*\* (?:Add|Update) File: ([^\\"\n]+)/g)) out.push(m[1].trim());
  return [...new Set(out)];
}

export function repoRoot(cwd) {
  try {
    return execSync("git rev-parse --show-toplevel", { cwd: cwd || process.cwd(), encoding: "utf8" }).trim();
  } catch {
    return cwd || process.cwd();
  }
}

export function addContext(event, text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
}

export function block(reason) {
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}
