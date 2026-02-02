import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

const SCAN_ROOTS = [
  path.join(repoRoot, "apps", "demos", "src", "demos"),
  path.join(repoRoot, "apps", "site", "src", "content"),
  path.join(repoRoot, "packages", "runtime", "src")
];

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".html", ".astro", ".md", ".mdx"]);

// Contract: math should be authored as LaTeX, not unicode symbols embedded in source.
// This guardrail is intentionally mechanical: if you need a symbol, use LaTeX (e.g. \\, \\pi, \\sigma, ^{\\circ}).
const FORBIDDEN_UNICODE_MATH = /[°☉µμ′″×−∝≈∞αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]/u;

async function isDirectory(p) {
  try {
    return (await fs.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function relative(p) {
  return path.relative(repoRoot, p);
}

async function main() {
  const violations = [];

  for (const root of SCAN_ROOTS) {
    if (!(await isDirectory(root))) continue;
    const files = await walk(root);

    for (const file of files) {
      const ext = path.extname(file);
      if (!EXTENSIONS.has(ext)) continue;

      const raw = await fs.readFile(file, "utf8");
      if (!FORBIDDEN_UNICODE_MATH.test(raw)) continue;

      const lines = raw.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (FORBIDDEN_UNICODE_MATH.test(line)) {
          violations.push({ file: relative(file), line: i + 1, text: line });
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error("Unicode math symbols found. Use LaTeX instead (see docs/specs/cosmic-playground-legacy-demo-migration-contract.md).\n");
    for (const v of violations) {
      console.error(`${v.file}:${v.line}: ${v.text}`);
    }
    process.exit(1);
  }

  console.log("OK: no unicode-math symbols found in demo/site/runtime sources.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

