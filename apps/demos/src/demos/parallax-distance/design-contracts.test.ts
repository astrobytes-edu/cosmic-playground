import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Parallax Distance
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 *
 * Invariants:
 *   1. SVG celestial objects MUST use --cp-celestial-* tokens (not legacy)
 *   2. A starfield canvas MUST exist in the HTML
 *   3. Readout values MUST separate units into .cp-readout__unit spans
 *   4. No hardcoded rgba() color literals in CSS (use tokens)
 *   5. Entry animations MUST use cp-slide-up / cp-fade-in
 *   6. main.ts must import initStarfield and call it
 *   7. Physics must come from @cosmic/physics only
 */

describe("Parallax Distance -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("earth circles use --cp-celestial-earth, not --cp-accent3 or --cp-accent", () => {
      expect(css).toMatch(/\.stage__earth[\s\S]*?--cp-celestial-earth/);
      expect(css).not.toMatch(/\.stage__earth[\s\S]*?--cp-accent3/);
    });

    it("star uses --cp-celestial-star, not --cp-warning", () => {
      expect(css).toMatch(/\.stage__star[\s\S]*?--cp-celestial-star/);
      expect(css).not.toMatch(/\.stage__star[\s\S]*?--cp-warning/);
    });

    it("arc uses --cp-accent-amber or celestial token, not --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__arc[\s\S]*?--cp-warning/);
    });

    it("rays use --cp-celestial-orbit or semantic token, not --cp-accent3", () => {
      expect(css).not.toMatch(/\.stage__ray[\s\S]*?--cp-accent3/);
    });
  });

  describe("Starfield invariant", () => {
    it("demo HTML contains a starfield canvas element", () => {
      expect(html).toContain('class="cp-starfield"');
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });
  });

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      // parallax has arcsec unit, distance has pc and ly units, SNR is dimensionless
      // At minimum: arcsec, pc, ly = 3 unit spans
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:arcsec|pc|ly|mas)\)/.test(l));
      expect(parenthesizedUnits.length).toBe(0);
    });
  });

  describe("Panel translucency", () => {
    it("stage SVG container uses backdrop-filter", () => {
      expect(css).toMatch(/backdrop-filter/);
    });
  });

  describe("No legacy token leakage in CSS", () => {
    it("no --cp-warning tokens remain in demo CSS", () => {
      expect(css).not.toContain("--cp-warning");
    });

    it("no --cp-accent2 or --cp-accent3 aliases remain in CSS", () => {
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
    });

    it("no --cp-accent2 or --cp-accent3 aliases remain in HTML", () => {
      expect(html).not.toContain("--cp-accent2");
      expect(html).not.toContain("--cp-accent3");
    });
  });

  describe("Entry animations", () => {
    it("demo shell sections have entry animations", () => {
      expect(css).toMatch(/\.cp-demo__controls[\s\S]*?animation.*cp-slide-up/);
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation.*cp-fade-in/);
    });
  });

  describe("Color literal absence", () => {
    it("CSS has no hardcoded rgba() color literals (outside color-mix)", () => {
      const lines = css.split("\n");
      const violations = lines.filter((line) => {
        if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return false;
        if (/rgba\s*\(/.test(line) && !line.includes("color-mix")) return true;
        return false;
      });
      expect(violations).toEqual([]);
    });

    it("CSS has no hardcoded hex color values", () => {
      const lines = css.split("\n");
      const violations = lines.filter((line) => {
        if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return false;
        return /#[0-9a-fA-F]{3,8}\b/.test(line);
      });
      expect(violations).toEqual([]);
    });
  });

  describe("Starfield initialization", () => {
    it("main.ts imports and calls initStarfield", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain("initStarfield");
      expect(mainTs).toMatch(/initStarfield\s*\(/);
    });
  });

  describe("Architecture compliance", () => {
    it("main.ts imports physics from @cosmic/physics, not inline", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain('from "@cosmic/physics"');
      // Should NOT define its own parallax function
      expect(mainTs).not.toMatch(/function\s+distanceParsec/);
    });
  });
});
