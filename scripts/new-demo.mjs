import fs from "node:fs/promises";
import path from "node:path";

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
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function validateSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid slug "${slug}". Use kebab-case (a-z, 0-9, hyphen).`);
  }
}

async function pathExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function writeFileIfMissing(filePath, contents) {
  if (await pathExists(filePath)) {
    throw new Error(`Refusing to overwrite existing file: ${filePath}`);
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const slug = requireArg(args, "slug");
  validateSlug(slug);

  const title = requireArg(args, "title");
  const topic = String(args.topic ?? "EarthSky");
  const levels = String(args.levels ?? "Both");
  const timeMinutes = Number(args.time ?? 10);
  const hasMathMode = String(args.math ?? "false") === "true";

  const repoRoot = process.cwd();
  const demoDir = path.join(repoRoot, "apps", "demos", "src", "demos", slug);
  const contentPath = path.join(
    repoRoot,
    "apps",
    "site",
    "src",
    "content",
    "demos",
    `${slug}.md`
  );

  await fs.mkdir(demoDir, { recursive: true });

  await writeFileIfMissing(
    path.join(demoDir, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Cosmic Playground</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <div id="cp-demo" class="cp-layer-instrument cp-demo" aria-label="${title}">
      <aside class="cp-demo__controls cp-panel" aria-label="Controls panel">
        <div class="cp-panel-header">${title}</div>
        <div class="cp-panel-body">
          <p class="cp-muted">TODO: one-line description.</p>
          <div class="cp-callout" data-kind="model">
            TODO: What does this model simplify, and why?
          </div>
          <button id="copyResults" class="cp-action" type="button">Copy results</button>
          <p id="status" class="cp-status" role="status" aria-live="polite"></p>
        </div>
      </aside>

      <section class="cp-demo__stage cp-stage cp-stage--placeholder" aria-label="Visualization stage">
        <div class="cp-stage__inner">
          <p class="cp-stage__headline">TODO: visualization</p>
          <p class="cp-muted">Replace this placeholder with the interactive stage.</p>
        </div>
      </section>

      <aside class="cp-demo__readouts cp-panel" aria-label="Readouts panel">
        <div class="cp-panel-header">Readouts</div>
        <div class="cp-panel-body">
          <div class="cp-readout">
            <div class="cp-readout__label">(example) Readout name</div>
            <div class="cp-readout__value">—</div>
          </div>
          <div class="cp-notice">
            <h3>What to notice</h3>
            <ul>
              <li>TODO: observation 1</li>
              <li>TODO: observation 2</li>
            </ul>
          </div>
        </div>
      </aside>

      <section class="cp-demo__drawer cp-drawer" aria-label="Model notes">
        <strong>Model notes</strong>
        <ul>
          <li>TODO: model note 1</li>
        </ul>
      </section>
    </div>

    <script type="module" src="./main.ts"></script>
  </body>
</html>
`
  );

  await writeFileIfMissing(
    path.join(demoDir, "style.css"),
    `@import "@cosmic/theme/styles/tokens.css";
@import "@cosmic/theme/styles/layer-instrument.css";
@import "@cosmic/theme/styles/demo-shell.css";

.cp-panel-body {
  display: grid;
  gap: var(--cp-space-3);
}

.cp-muted {
  color: var(--cp-muted);
}

.cp-action {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--cp-accent3) 44%, transparent);
  background: color-mix(in srgb, var(--cp-accent3) 22%, transparent);
  color: inherit;
  font-weight: 700;
  cursor: pointer;
}

.cp-action:hover {
  background: color-mix(in srgb, var(--cp-accent3) 30%, transparent);
}

.cp-status {
  margin: 0;
  color: var(--cp-muted);
  min-height: 1.25em;
}

.cp-stage--placeholder {
  display: grid;
  place-items: center;
  padding: var(--cp-space-5);
}

.cp-stage__inner {
  max-width: 52ch;
}

.cp-stage__headline {
  margin: 0;
  font-weight: 800;
  font-size: 1.2rem;
}

.cp-readout {
  margin-top: 12px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--cp-border);
}

.cp-readout__label {
  font-size: 0.9rem;
  color: var(--cp-muted);
}

.cp-readout__value {
  margin-top: 4px;
  font-size: 1.4rem;
}

.cp-notice {
  margin-top: 12px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--cp-border);
}

.cp-notice h3 {
  margin: 0;
  font-size: 1rem;
}

.cp-notice ul {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--cp-muted);
}

.cp-notice li {
  margin: 6px 0;
}

.cp-drawer ul {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--cp-muted);
}
`
  );

  await writeFileIfMissing(
    path.join(demoDir, "main.ts"),
    `import { createInstrumentRuntime } from "@cosmic/runtime";

const copyResults = document.querySelector<HTMLButtonElement>("#copyResults");
const status = document.querySelector<HTMLParagraphElement>("#status");

if (!copyResults || !status) {
  throw new Error("Missing required export UI.");
}

const runtime = createInstrumentRuntime({
  hasMathMode: ${hasMathMode ? "true" : "false"},
  storageKey: "cp:${slug}:mode",
  url: new URL(window.location.href)
});

function exportResults() {
  return {
    parameters: {},
    readouts: {},
    notes: ["TODO: replace placeholder export results."],
    timestamp: new Date().toISOString()
  };
}

(window as any).__cp = {
  slug: "${slug}",
  mode: runtime.mode,
  exportResults
};

copyResults.addEventListener("click", () => {
  status.textContent = "Copying…";
  void runtime
    .copyResults(exportResults())
    .then(() => {
      status.textContent = "Copied results to clipboard.";
    })
    .catch((err) => {
      status.textContent =
        err instanceof Error ? \`Copy failed: \${err.message}\` : "Copy failed.";
    });
});
`
  );

  await writeFileIfMissing(
    contentPath,
    `---
title: "${title.replaceAll('"', '\\"')}"
status: draft
levels: [${levels}]
topics: [${topic}]
time_minutes: ${Number.isFinite(timeMinutes) ? timeMinutes : 10}
has_math_mode: ${hasMathMode ? "true" : "false"}
tags: ["TODO"]
learning_goals:
  - "TODO"
misconceptions:
  - "TODO"
predict_prompt: "TODO"
play_steps:
  - "TODO"
explain_prompt: "TODO"
model_notes:
  - "TODO"
demo_path: "/play/${slug}/"
station_path: "/stations/${slug}/"
instructor_path: "/instructor/${slug}/"
last_updated: "${isoDate()}"
---

TODO: Short description (1–3 sentences) shown on cards.
`
  );

  console.log("Created demo scaffold:");
  console.log(`- ${path.relative(repoRoot, demoDir)}/`);
  console.log(`- ${path.relative(repoRoot, contentPath)}`);
  console.log("");
  console.log("Next:");
  console.log("- Run: corepack pnpm build");
  console.log("- Update the content fields to be real (no TODOs).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

