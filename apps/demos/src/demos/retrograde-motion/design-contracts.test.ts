import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests — Retrograde Motion
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

const demoDir = __dirname;
const htmlPath = path.resolve(demoDir, "index.html");
const cssPath = path.resolve(demoDir, "style.css");
const mainPath = path.resolve(demoDir, "main.ts");

const html = fs.readFileSync(htmlPath, "utf-8");
const css = fs.readFileSync(cssPath, "utf-8");
const main = fs.readFileSync(mainPath, "utf-8");

describe("Retrograde Motion — Design System Contracts", () => {
  // ── Starfield ─────────────────────────────────────────────
  describe("Starfield contract", () => {
    it("HTML contains a starfield canvas", () => {
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });

    it("main.ts imports and calls initStarfield", () => {
      expect(main).toContain("initStarfield");
    });
  });

  // ── Celestial tokens ──────────────────────────────────────
  describe("Celestial token contract", () => {
    it("Sun uses --cp-celestial-sun tokens in main.ts", () => {
      expect(main).toContain("--cp-celestial-sun");
      expect(main).not.toMatch(/["']--cp-warning["']/);
    });

    it("main.ts references all five planet celestial tokens", () => {
      expect(main).toContain("--cp-celestial-earth");
      expect(main).toContain("--cp-celestial-mars");
      expect(main).toContain("--cp-celestial-venus");
      expect(main).toContain("--cp-celestial-jupiter");
      expect(main).toContain("--cp-celestial-saturn");
    });

    it("orbit paths use --cp-celestial-orbit", () => {
      expect(main).toContain("--cp-celestial-orbit");
    });
  });

  // ── No legacy token leakage ───────────────────────────────
  describe("No legacy tokens", () => {
    it("CSS has no --cp-warning, --cp-accent2, --cp-accent3", () => {
      expect(css).not.toContain("--cp-warning");
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
    });

    it("main.ts has no legacy tokens", () => {
      expect(main).not.toContain("--cp-accent3");
      // --cp-warning is allowed ONLY for semantic warning states, not celestial objects.
      // The sun must use --cp-celestial-sun-*, not --cp-warning.
    });
  });

  // ── Readout unit separation ───────────────────────────────
  describe("Readout unit separation", () => {
    it("HTML has at least 4 readout unit spans", () => {
      // Readouts with units: day(s), deg, deg/day, days (for intervals)
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(4);
    });

    it("no parenthesized units in readout labels", () => {
      // Labels should not contain "(deg)" or "(days)" — units go in separate spans
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      for (const label of labels) {
        expect(label).not.toMatch(/\(deg\)|\(days\)|\(day\)|\(deg\/day\)/);
      }
    });
  });

  // ── Entry animations ──────────────────────────────────────
  describe("Entry animations", () => {
    it("controls and stage have entry animations in CSS", () => {
      expect(css).toMatch(/cp-slide-up|cp-fade-in/);
    });
  });

  // ── No color literals ─────────────────────────────────────
  describe("No color literals in CSS", () => {
    it("CSS has no rgba() outside color-mix", () => {
      const lines = css.split("\n");
      for (const line of lines) {
        if (line.includes("rgba(") && !line.includes("color-mix")) {
          expect(line).not.toMatch(/rgba\(/);
        }
      }
    });

    it("CSS has no hardcoded hex colors", () => {
      // Allow hex in comments only
      const nonCommentLines = css.split("\n").filter((l) => !l.trim().startsWith("/*") && !l.trim().startsWith("*"));
      for (const line of nonCommentLines) {
        expect(line).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      }
    });
  });

  // ── Architecture compliance ───────────────────────────────
  describe("Architecture compliance", () => {
    it("main.ts imports from @cosmic/physics", () => {
      expect(main).toMatch(/from\s+["']@cosmic\/physics["']/);
    });

    it("main.ts imports from ./logic (humble object)", () => {
      expect(main).toMatch(/from\s+["'].\/logic["']/);
    });
  });

  // ── Instrument layer ──────────────────────────────────────
  describe("Instrument layer", () => {
    it("HTML has cp-layer-instrument on demo root", () => {
      expect(html).toContain("cp-layer-instrument");
    });

    it("readouts strip exists with aria-label", () => {
      expect(html).toMatch(/class="[^"]*cp-demo__readouts/);
      expect(html).toMatch(/aria-label="Readouts"/);
    });
  });

  // ── Hybrid controls contract ──────────────────────────────
  describe("Hybrid controls contract", () => {
    it("keeps speed and window controls in the sidebar", () => {
      expect(html).toMatch(/<aside[^>]*class="cp-demo__sidebar/);
      expect(html).toMatch(/id="speed-select"/);
      expect(html).toMatch(/id="windowMonths"/);
      expect(html).toMatch(/id="windowMonths"[\s\S]*max="72"/);
    });

    it("uses a stage-adjacent timeline row for scrub and nav", () => {
      expect(html).toMatch(/class="[^"]*retro__timeline-row/);
      expect(html).toMatch(/id="scrubSlider"/);
      expect(html).toMatch(/id="prevStationary"/);
      expect(html).toMatch(/id="nextStationary"/);
      expect(html).toMatch(/id="centerRetrograde"/);
    });
  });

  // ── Unicode-math normalization ────────────────────────────
  describe("Unicode math normalization", () => {
    it("avoids unicode math glyphs in non-KaTeX UI code", () => {
      const forbiddenUnicodeMath = /\\u00B0|\\u00B1|\\u2264|\\u2265|\\u2248|\\u2190|\\u2192/;
      expect(html).not.toMatch(forbiddenUnicodeMath);
      expect(main).not.toMatch(forbiddenUnicodeMath);
    });
  });

  // ── Panel translucency ────────────────────────────────────
  describe("Panel translucency", () => {
    it("SVG backgrounds use translucent treatment", () => {
      // retrograde-motion uses color-mix pattern (like angular-size)
      expect(css).toMatch(/color-mix|radial-gradient|--cp-instr-panel-bg/);
    });

    it("controls or readouts use backdrop-filter or translucent bg", () => {
      // The stub-demo.css provides this for .cp-panel, but verify not overridden
      expect(css).not.toMatch(/background:\s*(#|rgb|hsl)/);
    });
  });
});
