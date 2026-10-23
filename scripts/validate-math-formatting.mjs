import fs from "node:fs/promises";
import path from "node:path";

/*
 * Everything that can end up as text a reader sees.
 *
 * The site's own pages, components and layouts were missing until 2026-09-10, so the
 * rule held inside the demos and inside authored content while the chrome around them
 * -- the homepage cards, the exhibit headers, Explore's filter chips -- went unchecked.
 * One violation was living there: a multiplication sign used as a remove icon.
 *
 * The 2026-10-23 audit found the same gap again: the glossary, the demos' shared helpers,
 * the data packages' labels and every CSS `content:` string were unscanned. Data packages
 * are found by name (`packages/data-*`) so a new one cannot be missed.
 *
 * `packages/physics` is scanned with its comments stripped. Its comments document the
 * maths (`G = 4 pi^2 AU^3 / yr^2 / M_sun` reads worse as ASCII than the symbols do) and
 * never render; the strings its models return -- units, labels, regime names -- do.
 */
const SCAN_ROOTS = [
  { dir: "apps/demos/src/demos" },
  { dir: "apps/demos/src/shared" },
  { dir: "apps/site/src/content" },
  { dir: "apps/site/src/pages" },
  { dir: "apps/site/src/components" },
  { dir: "apps/site/src/layouts" },
  { dir: "apps/site/src/lib" },
  { dir: "apps/site/src/data" },
  { dir: "apps/site/src/styles" },
  { dir: "packages/runtime/src" },
  { dir: "packages/theme/styles" },
  { dir: "packages/ui/src" },
  { dir: "packages/math/src" },
  { dir: "packages/physics/src", stripComments: true, skipTests: true }
];

const SCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".astro", ".html"]);
const MARKUP_EXTENSIONS = new Set([".md", ".mdx"]);
const SKIP_DIRS = new Set(["node_modules", "dist"]);

// Contract: math should be authored as LaTeX, not unicode symbols embedded in source.
// This guardrail is intentionally mechanical: if you need a symbol, use LaTeX (e.g. \\, \\pi, \\sigma, ^{\\circ}).
// Comparison, operator and arrow glyphs were added on 2026-10-23, after the audit found them in reader copy.
const FORBIDDEN_UNICODE_MATH =
  /[°☉µμ′″×−∝≈∞αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻≤≥≠≡∼≲≳±÷√∑∏∫∂∇∆ℓ⋅∙→←↑↓↕↔⇒⇐⇑⇓⇔½¼¾]/u;

// The middle dot is math only as an operator (`eV·nm`). Spaced, it is the separator in every
// instructor page's nav line, which is typography (Anna, 2026-10-23).
const OPERATOR_MIDDLE_DOT = /\S·\S/u;

function hasUnicodeMath(text) {
  return FORBIDDEN_UNICODE_MATH.test(text) || OPERATOR_MIDDLE_DOT.test(text);
}

/*
 * Decoding. A glyph written as `μ` in a TypeScript string, `&#x3bc;` or `&mu;` in markup,
 * or `\3bc` in a CSS `content:` string reaches the reader exactly as if it had been typed.
 * Until 2026-10-23 this gate tested raw characters only and printed OK over 121 such lines.
 */
const NAMED_ENTITIES = {
  deg: "°", times: "×", minus: "−", micro: "µ", prop: "∝", asymp: "≈", infin: "∞",
  prime: "′", Prime: "″", sup1: "¹", sup2: "²", sup3: "³", le: "≤", ge: "≥", ne: "≠",
  equiv: "≡", sim: "∼", plusmn: "±", middot: "·", sdot: "⋅", divide: "÷", radic: "√",
  sum: "∑", prod: "∏", int: "∫", part: "∂", nabla: "∇", rarr: "→", larr: "←", harr: "↔",
  rArr: "⇒", lArr: "⇐", hArr: "⇔", frac12: "½", frac14: "¼", frac34: "¾",
  uarr: "↑", darr: "↓", varr: "↕", uArr: "⇑", dArr: "⇓",
  // HTML5 aliases of the same glyphs; `&approx;` reached a tooltip in eos-lab this way.
  approx: "≈", pm: "±", leq: "≤", geq: "≥", neq: "≠", cdot: "⋅", centerdot: "·", propto: "∝",
  rightarrow: "→", leftarrow: "←", uparrow: "↑", downarrow: "↓", leftrightarrow: "↔",
  Rightarrow: "⇒", Leftarrow: "⇐", Leftrightarrow: "⇔",
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", omicron: "ο",
  pi: "π", rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", chi: "χ", psi: "ψ",
  omega: "ω", Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω"
};

function fromCodePoint(hex, radix = 16) {
  const cp = Number.parseInt(hex, radix);
  return cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
}

// Only an odd run of backslashes escapes: `"\\u03bc"` is a backslash followed by text.
function decodeJsEscapes(text) {
  return text.replace(/(\\+)(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2})/g, (match, slashes, esc) => {
    if (slashes.length % 2 === 0) return match;
    const hex = esc.startsWith("u{") ? esc.slice(2, -1) : esc.slice(1);
    return slashes.slice(1) + fromCodePoint(hex);
  });
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&#[xX]([0-9a-fA-F]+);?/g, (_, hex) => fromCodePoint(hex))
    .replace(/&#([0-9]+);?/g, (_, dec) => fromCodePoint(dec, 10))
    .replace(/&([A-Za-z][A-Za-z0-9]*);/g, (match, name) => NAMED_ENTITIES[name] ?? match);
}

function decodeCssEscapes(text) {
  return text.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => fromCodePoint(hex));
}

/*
 * Blank out comments, keeping every newline so line numbers survive. A small tokenizer rather
 * than a regex, because `//` and quotes also occur inside strings, templates and regex literals.
 */
const REGEX_PRECEDERS = new Set(["", "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^"]);

function stripComments(src) {
  let out = "";
  let i = 0;
  let prev = "";
  const blank = (s) => s.replace(/[^\n]/g, " ");

  function readQuoted(quote) {
    let j = i + 1;
    while (j < src.length && src[j] !== quote && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
    return j + 1;
  }

  function readRegex() {
    let j = i + 1;
    let inClass = false;
    while (j < src.length && src[j] !== "\n") {
      if (src[j] === "\\") j += 2;
      else if (src[j] === "[") (inClass = true), j++;
      else if (src[j] === "]") (inClass = false), j++;
      else if (src[j] === "/" && !inClass) return j + 1;
      else j++;
    }
    return j;
  }

  // Templates nest: `${` opens code that may contain templates of its own.
  const templateDepths = [];
  let depth = 0;

  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    let end;

    if (c === "/" && n === "/") {
      end = src.indexOf("\n", i);
      end = end === -1 ? src.length : end;
      out += blank(src.slice(i, end));
      i = end;
      continue;
    }
    if (c === "/" && n === "*") {
      end = src.indexOf("*/", i + 2);
      end = end === -1 ? src.length : end + 2;
      out += blank(src.slice(i, end));
      i = end;
      continue;
    }

    if (c === '"' || c === "'") end = readQuoted(c);
    else if (c === "/" && REGEX_PRECEDERS.has(prev)) end = readRegex();
    else if (c === "`" || (c === "}" && templateDepths.at(-1) === depth)) {
      if (c === "}") templateDepths.pop();
      let j = i + 1;
      while (j < src.length && src[j] !== "`" && !(src[j] === "$" && src[j + 1] === "{")) j += src[j] === "\\" ? 2 : 1;
      if (src[j] === "$") {
        templateDepths.push(depth);
        j += 2;
      } else {
        j += 1;
      }
      end = j;
    } else {
      if (c === "{") depth++;
      if (c === "}") depth--;
      out += c;
      if (!/\s/.test(c)) prev = /[A-Za-z0-9_$)\]]/.test(c) ? "word" : c;
      i++;
      continue;
    }

    out += src.slice(i, end);
    prev = "word";
    i = end;
  }
  return out;
}

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
      if (!SKIP_DIRS.has(entry.name)) files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function scanRoots(repoRoot) {
  const roots = [...SCAN_ROOTS];
  const packagesDir = path.join(repoRoot, "packages");
  if (await isDirectory(packagesDir)) {
    for (const name of (await fs.readdir(packagesDir)).sort()) {
      if (name.startsWith("data-")) roots.push({ dir: `packages/${name}/src` });
    }
  }
  return roots;
}

/*
 * Returns the lines a reader would see as Unicode math, already decoded. CSS is checked only
 * inside `content:` declarations, the one place a stylesheet puts text on the page.
 */
function unicodeMathLines(raw, ext, { stripComments: strip }) {
  const source = strip ? stripComments(raw) : raw;
  const lines = source.split(/\r?\n/);
  const rawLines = raw.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (ext === ".css") {
      if (!/\bcontent\s*:/.test(line)) continue;
      line = decodeCssEscapes(line);
    } else if (SCRIPT_EXTENSIONS.has(ext)) {
      line = decodeHtmlEntities(decodeJsEscapes(line));
    } else {
      line = decodeHtmlEntities(line);
    }
    if (hasUnicodeMath(line)) hits.push({ line: i + 1, text: rawLines[i] });
  }
  return hits;
}

export async function validateMathFormatting({ repoRoot = process.cwd() } = {}) {
  const violations = [];

  for (const scan of await scanRoots(repoRoot)) {
    const root = path.join(repoRoot, scan.dir);
    if (!(await isDirectory(root))) continue;

    for (const file of await walk(root)) {
      const ext = path.extname(file);
      if (!SCRIPT_EXTENSIONS.has(ext) && !MARKUP_EXTENSIONS.has(ext) && ext !== ".css") continue;
      if (scan.skipTests && /\.test\.[cm]?[jt]sx?$/.test(file)) continue;

      const relFile = path.relative(repoRoot, file).split(path.sep).join("/");
      const raw = await fs.readFile(file, "utf8");
      if (MARKUP_EXTENSIONS.has(ext) && raw.includes("$$")) {
        for (const hit of singleLineDisplayMath(raw)) {
          violations.push({ file: relFile, ...hit, kind: "single-line-display-math" });
        }
      }
      for (const hit of unicodeMathLines(raw, ext, scan)) {
        violations.push({ file: relFile, ...hit, kind: "unicode-math" });
      }
    }
  }

  return violations;
}

export async function main() {
  const violations = await validateMathFormatting();
  const unicode = violations.filter((v) => v.kind === "unicode-math");
  const singleLineDisplay = violations.filter((v) => v.kind === "single-line-display-math");

  if (unicode.length > 0) {
    console.error(
      "Unicode math symbols found (after decoding \\u, &#x and named-entity escapes). Use LaTeX instead (see docs/specs/cosmic-playground-legacy-demo-migration-contract.md).\n"
    );
    for (const v of unicode) console.error(`${v.file}:${v.line}: ${v.text}`);
  }

  if (singleLineDisplay.length > 0) {
    if (unicode.length > 0) console.error("");
    console.error(
      "Display math written on one line in Markdown. remark-math renders `$$...$$` on a single line as INLINE math; put each `$$` on a line of its own:\n"
    );
    for (const v of singleLineDisplay) console.error(`${v.file}:${v.line}: ${v.text}`);
  }

  if (violations.length > 0) return 1;

  console.log("OK: no unicode-math symbols (raw or escaped) in reader-visible sources, and Markdown display math is fenced.");
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
