import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

/*
 * Everything that can end up as text a reader sees.
 *
 * The site's own pages, components and layouts were missing until 2026-09-10, so the
 * rule held inside the demos and inside authored content while the chrome around them
 * -- the homepage cards, the exhibit headers, Explore's filter chips -- went unchecked.
 * One violation was living there: a multiplication sign used as a remove icon.
 *
 * `packages/physics` is deliberately NOT here. Its unicode is in comments and test
 * names describing the maths (`G = 4*pi^2 AU^3/yr^2/M_sun` reads worse as ASCII than
 * the symbols do), none of it reaches a rendered page, and mechanically rewriting 100
 * lines of somebody's physics documentation is a separate decision from this contract.
 */
const SCAN_ROOTS = [
  path.join(repoRoot, "apps", "demos", "src", "demos"),
  path.join(repoRoot, "apps", "site", "src", "content"),
  path.join(repoRoot, "apps", "site", "src", "pages"),
  path.join(repoRoot, "apps", "site", "src", "components"),
  path.join(repoRoot, "apps", "site", "src", "layouts"),
  path.join(repoRoot, "apps", "site", "src", "lib"),
  path.join(repoRoot, "packages", "runtime", "src")
];

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".html", ".astro", ".md", ".mdx"]);

// Contract: math should be authored as LaTeX, not unicode symbols embedded in source.
// This guardrail is intentionally mechanical: if you need a symbol, use LaTeX (e.g. \\, \\pi, \\sigma, ^{\\circ}).
const FORBIDDEN_UNICODE_MATH = /[°☉µμ′″×−∝≈∞αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]/u;

/*
 * Contract: display math in Markdown is fenced -- `$$` on a line of its own, above and below.
 *
 * remark-math (apps/site/astro.config.mjs) decides display mode from the fence lines, not
 * from the number of dollars: `$$E = mc^2$$` written on one line is INLINE math, however it
 * was meant. Until 2026-09-10 the browser-side renderer treated every `$$` as display, so
 * 80 equations across 35 files were written that way; once Markdown math moved to build
 * time all 80 rendered inline, and six ran past a 320px viewport.
 *
 * Markdown bodies only. Astro pages and frontmatter are still typeset by KatexAutoRender,
 * which does treat `$$` as display, and fenced code blocks show source rather than math.
 */
const SINGLE_LINE_DISPLAY_MATH = /^\s*(?:>\s*)*(?:(?:[-*+]|\d+[.)])\s+)?\$\$.*\$\$\s*$/;
const CODE_FENCE = /^\s*(?:>\s*)*(?:```|~~~)/;

function singleLineDisplayMath(raw) {
  const lines = raw.split(/\r?\n/);
  let start = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
    start = end === -1 ? lines.length : end + 1;
  }

  const hits = [];
  let inCode = false;
  for (let i = start; i < lines.length; i++) {
    if (CODE_FENCE.test(lines[i])) {
      inCode = !inCode;
    } else if (!inCode && SINGLE_LINE_DISPLAY_MATH.test(lines[i])) {
      hits.push({ line: i + 1, text: lines[i] });
    }
  }
  return hits;
}

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
  const singleLineDisplay = [];

  for (const root of SCAN_ROOTS) {
    if (!(await isDirectory(root))) continue;
    const files = await walk(root);

    for (const file of files) {
      const ext = path.extname(file);
      if (!EXTENSIONS.has(ext)) continue;

      const raw = await fs.readFile(file, "utf8");
      if ((ext === ".md" || ext === ".mdx") && raw.includes("$$")) {
        for (const hit of singleLineDisplayMath(raw)) {
          singleLineDisplay.push({ file: relative(file), ...hit });
        }
      }
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
  }

  if (singleLineDisplay.length > 0) {
    if (violations.length > 0) console.error("");
    console.error(
      "Display math written on one line in Markdown. remark-math renders `$$...$$` on a single line as INLINE math; put each `$$` on a line of its own:\n"
    );
    for (const v of singleLineDisplay) {
      console.error(`${v.file}:${v.line}: ${v.text}`);
    }
  }

  if (violations.length > 0 || singleLineDisplay.length > 0) process.exit(1);

  console.log("OK: no unicode-math symbols in demo/site/runtime sources, and Markdown display math is fenced.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

