import fs from "node:fs/promises";
import path from "node:path";

function lineColFromIndex(text, index) {
  const prefix = text.slice(0, index);
  const lines = prefix.split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

async function pathExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(rootDir, { includeExtensions }) {
  const files = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules") continue;
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!includeExtensions.has(ext)) continue;

      files.push(fullPath);
    }
  }

  await walk(rootDir);
  return files;
}

function pushRegexViolations({
  violations,
  code,
  filePath,
  text,
  regex,
  message,
  maxPerFile = 5
}) {
  let count = 0;
  for (const match of text.matchAll(regex)) {
    if (count >= maxPerFile) break;
    const idx = match.index ?? 0;
    const { line, column } = lineColFromIndex(text, idx);
    violations.push({
      code,
      file: filePath,
      line,
      column,
      message
    });
    count++;
  }
}

function pushSubstringViolation({ violations, code, filePath, text, needle, message }) {
  const idx = text.indexOf(needle);
  if (idx === -1) return;
  const { line, column } = lineColFromIndex(text, idx);
  violations.push({ code, file: filePath, line, column, message });
}

export async function validateInvariants({ repoRoot = process.cwd() } = {}) {
  const violations = [];

  const siteSrcRoot = path.join(repoRoot, "apps", "site", "src");
  const siteContentRoot = path.join(siteSrcRoot, "content");
  const sitePagesRoot = path.join(siteSrcRoot, "pages");

  const themeStylesRoot = path.join(repoRoot, "packages", "theme", "styles");
  const demosSrcRoot = path.join(repoRoot, "apps", "demos", "src");
  const demosDemosRoot = path.join(demosSrcRoot, "demos");

  const textExts = new Set([
    ".astro",
    ".css",
    ".html",
    ".js",
    ".jsx",
    ".mjs",
    ".md",
    ".mdx",
    ".ts",
    ".tsx"
  ]);

  const colorLiteralExts = new Set([".astro", ".css", ".html"]);

  const rxRootAbsoluteAttr = /\b(?:href|src|action)=["']\/(?!\/)/g;
  const rxRootAbsoluteCssUrl = /url\(\s*\/(?!\/)/g;
  const rxRootAbsoluteMarkdownLink = /\]\(\/(?!\/)/g;
  const rxRootAbsoluteHtmlInMarkdown = /\b(?:href|src)=["']\/(?!\/)/g;
  const rxForbiddenBaseUrlInDemos = /\bimport\.meta\.env\.BASE_URL\b/g;
  const rxPrintMedia = /@media\s+print\b/g;
  const rxStyleTag = /<style\b/i;
  // Theme rule enforcement for apps: no hardcoded colors. Catch common CSS color literal forms.
  // Note: This intentionally targets only app-layer files (apps/site and apps/demos), not packages/theme.
  const rxColorLiteral = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/gi;

  // Site source (excluding content)
  if (await pathExists(siteSrcRoot)) {
    const siteFiles = await listFiles(siteSrcRoot, { includeExtensions: textExts });
    for (const filePath of siteFiles) {
      if (filePath.startsWith(siteContentRoot + path.sep)) continue;

      const text = await fs.readFile(filePath, "utf8");

      pushSubstringViolation({
        violations,
        code: "site:hardcoded-repo-base-path",
        filePath,
        text,
        needle: "/cosmic-playground/",
        message:
          "Hardcoded \"/cosmic-playground/\" path; Astro code must build internal links/assets from import.meta.env.BASE_URL."
      });

      pushRegexViolations({
        violations,
        code: "site:root-absolute-link",
        filePath,
        text,
        regex: rxRootAbsoluteAttr,
        message:
          "Root-absolute internal link/asset; Astro code must use import.meta.env.BASE_URL for internal links/assets."
      });

      pushRegexViolations({
        violations,
        code: "site:root-absolute-css-url",
        filePath,
        text,
        regex: rxRootAbsoluteCssUrl,
        message: "Root-absolute CSS url(...); bundle or construct URLs without leading '/'."
      });

      if (colorLiteralExts.has(path.extname(filePath).toLowerCase())) {
        // DemoIllustration uses physical spectral data colors (Planck curve, rainbow gradient)
        // in SVG gradient stops — these are visualization data, not design tokens.
        const isIllustration = filePath.endsWith("DemoIllustration.astro");
        if (!isIllustration) {
          pushRegexViolations({
            violations,
            code: "apps:no-color-literals",
            filePath,
            text,
            regex: rxColorLiteral,
            message:
              "Hardcoded color literal in apps; prefer tokens from packages/theme/styles/tokens.css (visualization-only colors should not be in UI styles)."
          });
        }
      }
    }
  }

  // Content collections (markdown)
  if (await pathExists(siteContentRoot)) {
    const contentFiles = await listFiles(siteContentRoot, { includeExtensions: textExts });
    for (const filePath of contentFiles) {
      const text = await fs.readFile(filePath, "utf8");

      pushSubstringViolation({
        violations,
        code: "content:hardcoded-repo-base-path",
        filePath,
        text,
        needle: "/cosmic-playground/",
        message:
          "Hardcoded \"/cosmic-playground/\" in content; markdown must use relative links (no BASE_URL, no hardcoded repo base path)."
      });

      pushRegexViolations({
        violations,
        code: "content:root-absolute-markdown-link",
        filePath,
        text,
        regex: rxRootAbsoluteMarkdownLink,
        message:
          "Root-absolute markdown link/image; content must use relative links (e.g. ../../play/<slug>/) so GitHub Pages base paths work."
      });

      pushRegexViolations({
        violations,
        code: "content:root-absolute-html-link",
        filePath,
        text,
        regex: rxRootAbsoluteHtmlInMarkdown,
        message:
          "Root-absolute raw HTML href/src in content; use relative links/paths inside markdown content."
      });

      pushRegexViolations({
        violations,
        code: "content:forbidden-print-hack",
        filePath,
        text,
        regex: rxPrintMedia,
        message:
          "Page-local print CSS in content; print fixes must be centralized in packages/theme/styles/print.css (not in content)."
      });

      if (rxStyleTag.test(text)) {
        pushSubstringViolation({
          violations,
          code: "content:forbidden-style-tag",
          filePath,
          text,
          needle: "<style",
          message:
            "Style tag found in content; avoid inline styles and keep print/theme fixes centralized in packages/theme."
        });
      }
    }
  }

  // Demo source (Vite)
  if (await pathExists(demosSrcRoot)) {
    const demoFiles = await listFiles(demosSrcRoot, { includeExtensions: textExts });
    for (const filePath of demoFiles) {
      const text = await fs.readFile(filePath, "utf8");

      pushSubstringViolation({
        violations,
        code: "demos:hardcoded-repo-base-path",
        filePath,
        text,
        needle: "/cosmic-playground/",
        message:
          "Hardcoded \"/cosmic-playground/\" in demo source; demos must use relative ../../... links for cross-site navigation."
      });

      pushRegexViolations({
        violations,
        code: "demos:forbidden-base-url",
        filePath,
        text,
        regex: rxForbiddenBaseUrlInDemos,
        message:
          "import.meta.env.BASE_URL used in demos; Vite demos are built with base './' and must not treat BASE_URL as the site root (use ../../... or computed siteRoot)."
      });

      if (filePath.startsWith(demosDemosRoot + path.sep)) {
        pushRegexViolations({
          violations,
          code: "demos:root-absolute-link",
          filePath,
          text,
          regex: rxRootAbsoluteAttr,
          message:
            "Root-absolute link/asset in a demo; demos served at /play/<slug>/ must use ../../... for cross-site links."
        });

        pushRegexViolations({
          violations,
          code: "demos:root-absolute-css-url",
          filePath,
          text,
          regex: rxRootAbsoluteCssUrl,
          message: "Root-absolute CSS url(...); avoid leading '/' inside demos."
        });
      }

      if (colorLiteralExts.has(path.extname(filePath).toLowerCase())) {
        pushRegexViolations({
          violations,
          code: "apps:no-color-literals",
          filePath,
          text,
          regex: rxColorLiteral,
          message:
            "Hardcoded color literal in apps; prefer theme tokens (visualization-only colors should not be in UI styles)."
        });
      }
    }
  }

  // Page-local print hacks in Astro pages
  if (await pathExists(sitePagesRoot)) {
    const pageFiles = await listFiles(sitePagesRoot, { includeExtensions: textExts });
    for (const filePath of pageFiles) {
      const text = await fs.readFile(filePath, "utf8");
      pushRegexViolations({
        violations,
        code: "site:forbidden-print-hack",
        filePath,
        text,
        regex: rxPrintMedia,
        message:
          "Page-local print CSS in an Astro page; print fixes must be centralized in packages/theme/styles/print.css."
      });
    }
  }

  // A design token must hold the SAME KIND of value in every layer. --cp-glow-teal was a
  // colour in tokens.css/layer-museum.css and a shadow list in layer-instrument.css, so
  // layer-agnostic rules such as `box-shadow: 0 0 0 3px var(--cp-glow-teal)` expanded to
  // invalid CSS inside every demo and were silently dropped, removing the focus ring.
  // Convention: --cp-glow-* are SHADOW LISTS, --cp-tint-* are COLOURS.
  if (await pathExists(themeStylesRoot)) {
    const themeFiles = await listFiles(themeStylesRoot, { includeExtensions: new Set([".css"]) });
    const declarations = new Map(); // token -> Map<kind, {file, line, column}>

    for (const filePath of themeFiles) {
      const text = await fs.readFile(filePath, "utf8");
      const rx = /(--cp-(?:glow|tint)-[a-z0-9-]+)\s*:\s*([^;]+);/g;
      let m;
      while ((m = rx.exec(text)) !== null) {
        const [, token, rawValue] = m;
        const value = rawValue.trim();
        // An alias (`var(--other)`) inherits its kind; skip it.
        if (/^var\(/.test(value)) continue;
        // A shadow list starts with a <length> (possibly a bare 0) or "inset". No CSS
        // colour value starts with a digit or a minus sign, so this is unambiguous.
        const kind = /^(inset\b|-?[0-9.])/.test(value) ? "shadow" : "color";
        const { line, column } = lineColFromIndex(text, m.index);
        if (!declarations.has(token)) declarations.set(token, new Map());
        declarations.get(token).set(kind, { file: filePath, line, column });
      }
    }

    for (const [token, kinds] of declarations) {
      const expected = token.startsWith("--cp-glow-") ? "shadow" : "color";
      for (const [kind, where] of kinds) {
        if (kind === expected) continue;
        violations.push({
          code: "theme:token-kind-mismatch",
          file: where.file,
          line: where.line,
          column: where.column,
          message: `${token} is declared as a ${kind} value but --cp-${expected === "shadow" ? "glow" : "tint"}-* must be a ${expected} value. Colours belong in --cp-tint-*, shadow lists in --cp-glow-*.`
        });
      }
      if (kinds.size > 1) {
        const where = [...kinds.values()][0];
        violations.push({
          code: "theme:token-kind-conflict",
          file: where.file,
          line: where.line,
          column: where.column,
          message: `${token} holds different value kinds (${[...kinds.keys()].join(", ")}) across layers; layer-agnostic CSS cannot consume it safely.`
        });
      }
    }
  }

  violations.sort((a, b) => {
    if (a.file === b.file) return a.line - b.line;
    return a.file.localeCompare(b.file);
  });

  return violations;
}

function formatViolation(v, repoRoot) {
  const rel = path.relative(repoRoot, v.file);
  return `${v.code}: ${rel}:${v.line}:${v.column} ${v.message}`;
}

export async function main(argv = process.argv.slice(2)) {
  const repoRoot = process.cwd();
  const violations = await validateInvariants({ repoRoot });

  if (violations.length === 0) {
    return 0;
  }

  console.error("Invariant violations found:");
  for (const v of violations) {
    console.error(`- ${formatViolation(v, repoRoot)}`);
  }
  console.error(`\nTotal: ${violations.length}`);
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-process-exit
  main().then((code) => process.exit(code));
}
