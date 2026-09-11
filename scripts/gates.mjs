#!/usr/bin/env node
/**
 * Runs the Cosmic Playground gates in order, capturing each exit code directly, and prints a summary.
 * E2E is skipped when the build fails, because it would test a stale dist/.
 *
 *   corepack pnpm gates                 # all gates
 *   corepack pnpm gates build e2e       # a subset, still in canonical order
 */
import { spawnSync } from "node:child_process";

const STEPS = [
  { name: "lint", args: ["pnpm", "lint"] },
  { name: "typecheck", args: ["pnpm", "-r", "typecheck"] },
  { name: "unit", args: ["pnpm", "test"] },
  { name: "build", args: ["pnpm", "build"] },
  { name: "e2e", args: ["pnpm", "-C", "apps/site", "test:e2e"], env: { CP_BASE_PATH: "/cosmic-playground/" } }
];

const only = process.argv.slice(2);
const unknown = only.filter((n) => !STEPS.some((s) => s.name === n));
if (unknown.length) {
  console.error(`Unknown gate(s): ${unknown.join(", ")}. Known: ${STEPS.map((s) => s.name).join(", ")}`);
  process.exit(2);
}

const results = [];
for (const step of STEPS) {
  if (only.length && !only.includes(step.name)) continue;
  if (step.name === "e2e" && results.some((r) => r.name === "build" && r.code !== 0)) {
    results.push({ name: step.name, code: "skipped (build failed)", seconds: 0 });
    continue;
  }
  console.log(`\n=== ${step.name}: corepack ${step.args.join(" ")}`);
  const started = Date.now();
  const run = spawnSync("corepack", step.args, { stdio: "inherit", env: { ...process.env, ...step.env } });
  results.push({ name: step.name, code: run.status ?? 1, seconds: Math.round((Date.now() - started) / 1000) });
}

console.log("\n=== gate summary");
for (const r of results) console.log(`${r.name.padEnd(10)} EXIT=${r.code} (${r.seconds}s)`);
process.exit(results.every((r) => r.code === 0) ? 0 : 1);
