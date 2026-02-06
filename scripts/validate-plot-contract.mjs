import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

const CODE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

const RX_IMPORT_PLOTLY =
  /\b(?:import\s+.+?\s+from\s+|import\s+)\s*["']plotly(?:\.js(?:-dist(?:-min)?)?)?["']/;
const RX_REQUIRE_PLOTLY = /\brequire\(\s*["']plotly(?:\.js(?:-dist(?:-min)?)?)?["']\s*\)/;
const RX_DIRECT_PLOTLY_CALL =
  /\b(?:Plotly|plotly)\.(?:newPlot|react|purge|update|restyle|relayout)\s*\(/;

function normalizePosix(value) {
  return value.split(path.sep).join("/");
}

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listCodeFiles(rootDir) {
  const files = [];

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules") continue;
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_EXTENSIONS.has(ext)) continue;
      files.push(fullPath);
    }
  }

  if (await pathExists(rootDir)) {
    await walk(rootDir);
  }

  return files;
}

function hasAxisLabelMetadata(text) {
  const hasAxesBlock = /\baxes\s*:\s*\{/.test(text);
  const hasXLabel = /\bx\s*:\s*\{[\s\S]*?\blabel\s*:\s*["'`]/m.test(text);
  const hasYLabel = /\by\s*:\s*\{[\s\S]*?\blabel\s*:\s*["'`]/m.test(text);
  return hasAxesBlock && hasXLabel && hasYLabel;
}

function hasPlotId(text) {
  return /\bid\s*:\s*["'`][^"'`]+["'`]/.test(text);
}

export async function validatePlotContract({ repoRoot = process.cwd() } = {}) {
  const violations = [];

  const demosRoot = path.join(repoRoot, "apps", "demos", "src");
  const runtimeRoot = path.join(repoRoot, "packages", "runtime", "src");
  const files = [
    ...(await listCodeFiles(demosRoot)),
    ...(await listCodeFiles(runtimeRoot))
  ];

  for (const filePath of files) {
    const rel = normalizePosix(path.relative(repoRoot, filePath));
    const inRuntimePlots = rel.startsWith("packages/runtime/src/plots/");
    const text = await fs.readFile(filePath, "utf8");

    if (!inRuntimePlots && (RX_IMPORT_PLOTLY.test(text) || RX_REQUIRE_PLOTLY.test(text))) {
      violations.push(
        `${rel}: direct Plotly imports are forbidden outside packages/runtime/src/plots`
      );
    }

    if (!inRuntimePlots && RX_DIRECT_PLOTLY_CALL.test(text)) {
      violations.push(
        `${rel}: direct Plotly calls are forbidden outside packages/runtime/src/plots`
      );
    }

    if (/\bmountPlot\s*\(/.test(text)) {
      if (!hasAxisLabelMetadata(text)) {
        violations.push(
          `${rel}: mountPlot usage requires PlotSpec axes metadata with x/y labels`
        );
      }
      if (!hasPlotId(text)) {
        violations.push(`${rel}: mountPlot usage requires PlotSpec id`);
      }
    }
  }

  return violations;
}

export async function main() {
  const violations = await validatePlotContract({ repoRoot });
  if (violations.length === 0) return 0;

  console.error("Plot contract violations found:");
  for (const violation of violations) console.error(`- ${violation}`);
  console.error(`\nTotal: ${violations.length}`);
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-process-exit
  main().then((code) => process.exit(code));
}
