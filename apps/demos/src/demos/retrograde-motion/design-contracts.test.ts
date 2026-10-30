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

    it("lays each stationary-nav label out as one run of text, not as flex items", () => {
      // The labels carry a KaTeX approx sign, so a button's children are text, .katex, text.
      // .cp-button is inline-flex, which would make those three flex items shrinking side by
      // side with an 8px gap; the nav rule has to take the button out of flex layout.
      const rule = css.match(/\.playbar-nav \.cp-button\s*\{([^}]*)\}/);
      expect(rule).not.toBeNull();
      expect(rule?.[1]).toMatch(/display:\s*block/);
    });
  });

});
