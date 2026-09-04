// packages/theme/src/tokenContrast.test.ts
//
// Contrast tests that read the ACTUAL CSS.
//
// contrast.test.ts hardcodes hex literals next to a comment naming the token they are
// meant to represent. Those tests cannot fail when a token drifts, and its paper-theme
// block asserts colours (#047857, #b45309) that appear nowhere in the theme at all --
// it is checking arithmetic on constants declared three lines above.
//
// This file parses tokens.css / layer-instrument.css / layer-paper.css, resolves the
// token graph (including one level of color-mix), and asserts the pairs that are
// actually rendered. It caught two live failures when written: a 2.25:1 focus ring on
// the museum layer, and 1.33:1 accent text on the paper layer.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const STYLES = join(import.meta.dirname, "..", "styles");

function readStyles(file: string): string {
  return readFileSync(join(STYLES, file), "utf8");
}

/** Collect `--token: value;` declarations in source order (later wins). */
function parseTokens(css: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of css.matchAll(/(--cp-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out.set(m[1], m[2].trim());
  }
  return out;
}

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const h = hex.replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16)
  };
}

/**
 * Resolve a token value to RGB, following `var()` references and evaluating one level of
 * `color-mix(in srgb, A P%, B)`. `transparent` composites against `over`, which is how
 * the browser actually paints it — the step the hardcoded tests skipped, and precisely
 * where the focus-ring failure was hiding.
 */
function resolve(value: string, tokens: Map<string, string>, over: Rgb, depth = 0): Rgb {
  if (depth > 8) throw new Error(`token cycle resolving: ${value}`);
  const v = value.trim();

  if (v.startsWith("#")) return hexToRgb(v);
  if (v === "transparent") return over;

  const varMatch = /^var\(\s*(--cp-[a-z0-9-]+)/.exec(v);
  if (varMatch) {
    const next = tokens.get(varMatch[1]);
    if (!next) throw new Error(`undefined token: ${varMatch[1]}`);
    return resolve(next, tokens, over, depth + 1);
  }

  const mix = /^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/.exec(v);
  if (mix) {
    const a = resolve(mix[1], tokens, over, depth + 1);
    const p = Number(mix[2]) / 100;
    const b = resolve(mix[3], tokens, over, depth + 1);
    return {
      r: Math.round(a.r * p + b.r * (1 - p)),
      g: Math.round(a.g * p + b.g * (1 - p)),
      b: Math.round(a.b * p + b.b * (1 - p))
    };
  }

  const rgba = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/.exec(v);
  if (rgba) {
    const alpha = rgba[4] === undefined ? 1 : Number(rgba[4]);
    const a = { r: Number(rgba[1]), g: Number(rgba[2]), b: Number(rgba[3]) };
    return {
      r: Math.round(a.r * alpha + over.r * (1 - alpha)),
      g: Math.round(a.g * alpha + over.g * (1 - alpha)),
      b: Math.round(a.b * alpha + over.b * (1 - alpha))
    };
  }

  throw new Error(`cannot resolve token value: ${v}`);
}

function luminance({ r, g, b }: Rgb): number {
  const ch = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function ratio(fg: Rgb, bg: Rgb): number {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const base = parseTokens(readStyles("tokens.css"));
const instrument = new Map([...base, ...parseTokens(readStyles("layer-instrument.css"))]);
const paper = new Map([...base, ...parseTokens(readStyles("layer-paper.css"))]);

function check(tokens: Map<string, string>, fgToken: string, bgToken: string): number {
  const bgValue = tokens.get(bgToken);
  if (!bgValue) throw new Error(`undefined background token: ${bgToken}`);
  // Backgrounds are opaque, so resolve them over black to get a concrete value first.
  const bg = resolve(bgValue, tokens, { r: 0, g: 0, b: 0 });
  const fgValue = tokens.get(fgToken);
  if (!fgValue) throw new Error(`undefined foreground token: ${fgToken}`);
  return ratio(resolve(fgValue, tokens, bg), bg);
}

describe("token contrast, resolved from the CSS", () => {
  describe("museum layer", () => {
    it.each([
      ["--cp-text", 4.5],
      ["--cp-text2", 4.5],
      ["--cp-muted", 4.5]
    ])("%s on --cp-bg0 meets %s:1", (token, min) => {
      expect(check(base, token, "--cp-bg0")).toBeGreaterThanOrEqual(min as number);
    });

    it("--cp-focus meets the 3:1 non-text contrast minimum (WCAG 1.4.11)", () => {
      // Was color-mix(accent 55%, transparent), compositing to #215557 = 2.25:1.
      // It is the only focus affordance on the museum layer.
      expect(check(base, "--cp-focus", "--cp-bg0")).toBeGreaterThanOrEqual(3);
    });
  });

  describe("instrument layer", () => {
    it.each([
      ["--cp-accent-amber", 4.5],
      ["--cp-accent-ice", 4.5]
    ])("%s on --cp-bg0 meets %s:1", (token, min) => {
      expect(check(instrument, token, "--cp-bg0")).toBeGreaterThanOrEqual(min as number);
    });

    it("--cp-focus meets 3:1", () => {
      expect(check(instrument, "--cp-focus", "--cp-bg0")).toBeGreaterThanOrEqual(3);
    });
  });

  describe("paper layer", () => {
    it.each([
      ["--cp-text", 4.5],
      ["--cp-muted", 4.5],
      // These are used as TEXT by the instructor hub, StatBar, CitationCard, DemoCard and
      // the playlists page, and every /instructor/* and /stations/* route renders on paper.
      ["--cp-accent-ice", 4.5],
      ["--cp-accent-amber", 4.5]
    ])("%s on --cp-bg0 meets %s:1", (token, min) => {
      expect(check(paper, token, "--cp-bg0")).toBeGreaterThanOrEqual(min as number);
    });

    it("--cp-focus meets 3:1", () => {
      expect(check(paper, "--cp-focus", "--cp-bg0")).toBeGreaterThanOrEqual(3);
    });
  });

  it("resolves color-mix against the real background rather than assuming opacity", () => {
    // Guards the resolver itself: 55% accent over the ink ground is materially darker
    // than the accent alone, which is the whole reason the focus ring failed.
    const composited = resolve(
      "color-mix(in srgb, var(--cp-accent) 55%, transparent)",
      base,
      hexToRgb("#0f1115")
    );
    const opaque = resolve("var(--cp-accent)", base, hexToRgb("#0f1115"));
    expect(luminance(composited)).toBeLessThan(luminance(opaque));
  });
});
