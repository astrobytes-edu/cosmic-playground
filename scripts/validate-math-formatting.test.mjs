import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { validateMathFormatting } from "./validate-math-formatting.mjs";

async function writeFile(root, rel, contents) {
  const filePath = path.join(root, rel);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

async function fixture(files) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-math-"));
  for (const [rel, contents] of Object.entries(files)) await writeFile(root, rel, contents);
  return root;
}

function flaggedLines(violations, file) {
  return violations.filter((v) => v.file === file).map((v) => v.line);
}

const DEMO_TS = "apps/demos/src/demos/demo/main.ts";
const DEMO_HTML = "apps/demos/src/demos/demo/index.html";

describe("validateMathFormatting", () => {
  // The audit found mu and an implication arrow reaching readers while this gate printed OK:
  // the source held `\u03bc`, which only becomes the glyph at runtime.
  test("decodes JavaScript escapes before testing, but not an escaped backslash", async () => {
    const root = await fixture({
      [DEMO_TS]: [
        'unit.textContent = "\\u03bcm";',
        'label.textContent = "\\u{3bc}m";',
        'sci.textContent = "1.5 \\xd7 10";',
        'latex.textContent = "\\\\u03bc is printed literally";'
      ].join("\n")
    });

    const violations = await validateMathFormatting({ repoRoot: root });
    expect(flaggedLines(violations, DEMO_TS)).toEqual([1, 2, 3]);
  });

  test("decodes numeric and named HTML entities before testing", async () => {
    const root = await fixture({
      [DEMO_HTML]: [
        "<span>&#x3bc;m</span>",
        "<span>&#956;m</span>",
        "<span>2 &times; 3</span>",
        "<span>Sun &amp; Moon</span>",
        '<button title="T &approx; 10^7 K">',
        "<span>Brighter &uarr;</span>"
      ].join("\n")
    });

    const violations = await validateMathFormatting({ repoRoot: root });
    expect(flaggedLines(violations, DEMO_HTML)).toEqual([1, 2, 3, 5, 6]);
  });

  test("flags the comparison, operator and arrow glyphs added in 2026-10", async () => {
    const glyphs = ["≤", "≥", "≠", "±", "÷", "√", "∑", "∫", "→", "←", "↑", "↓", "⇒", "↔", "⋅", "⁻"];
    const root = await fixture({
      [DEMO_TS]: glyphs.map((g) => `const s${glyphs.indexOf(g)} = "a ${g} b";`).join("\n")
    });

    const violations = await validateMathFormatting({ repoRoot: root });
    expect(flaggedLines(violations, DEMO_TS)).toEqual(glyphs.map((_, i) => i + 1));
  });

  // Anna, 2026-10-23: the middle dot is math only as an operator. The spaced separator in
  // every instructor page's nav line is typography and stays.
  test("flags a middle dot used as an operator but not as a spaced separator", async () => {
    const md = "apps/site/src/content/instructor/demo/index.md";
    const root = await fixture({
      [md]: ["hc = 1239.8 eV·nm", "> - This demo: [Model](#model) · [Activities](#activities)"].join("\n")
    });

    const violations = await validateMathFormatting({ repoRoot: root });
    expect(flaggedLines(violations, md)).toEqual([1]);
  });

  test("scans every reader-visible root, including CSS generated content", async () => {
    const roots = [
      "apps/demos/src/shared/helper.ts",
      "apps/site/src/data/glossary.ts",
      "packages/data-spectra/src/lines.ts",
      "packages/ui/src/index.ts",
      "packages/math/src/format.ts"
    ];
    const css = ["apps/site/src/styles/global.css", "packages/theme/styles/button.css"];
    const files = Object.fromEntries(roots.map((rel) => [rel, 'export const label = "λ";']));
    for (const rel of css) files[rel] = '.next::after {\n  content: "\\2192";\n}';
    const root = await fixture(files);

    const flagged = new Set((await validateMathFormatting({ repoRoot: root })).map((v) => v.file));
    expect([...flagged].sort()).toEqual([...roots, ...css].sort());
  });

  // Physics comments document the maths and never render; strings the models return do.
  test("scans physics string literals but not physics comments", async () => {
    const physics = "packages/physics/src/model.ts";
    const root = await fixture({
      [physics]: [
        "// G = 4π² AU³/(yr²·M☉)",
        "/* λ_max = b / T */",
        'export const unit = "M\\u2609";',
        "const quote = /[\"']/;",
        'export const symbol = "λ";',
        "/**",
        " * P² = a³",
        " */"
      ].join("\n")
    });

    const violations = await validateMathFormatting({ repoRoot: root });
    expect(flaggedLines(violations, physics)).toEqual([3, 5]);
  });

  test("accepts math authored as LaTeX", async () => {
    const root = await fixture({
      [DEMO_TS]: [
        'unit.innerHTML = renderMathText("$\\\\mu$m");',
        'sci.innerHTML = renderMathText("$1.5 \\\\times 10^{8}$");',
        "const arrow = `$n = 3 \\\\rightarrow n = 2$`;"
      ].join("\n"),
      [DEMO_HTML]: '<span class="cp-readout__label">$\\theta$ (deg)</span>'
    });

    expect(await validateMathFormatting({ repoRoot: root })).toEqual([]);
  });

  test("flags single-line display math in Markdown bodies, not in frontmatter or code", async () => {
    const md = "apps/site/src/content/demos/demo.md";
    const root = await fixture({
      [md]: ["---", "title: $$E = mc^2$$", "---", "$$E = mc^2$$", "```", "$$x$$", "```"].join("\n")
    });

    const violations = await validateMathFormatting({ repoRoot: root });
    expect(violations.filter((v) => v.file === md)).toEqual([
      expect.objectContaining({ line: 4, kind: "single-line-display-math" })
    ]);
  });
});
