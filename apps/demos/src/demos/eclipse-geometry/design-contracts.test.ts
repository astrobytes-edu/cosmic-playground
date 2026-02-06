import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Eclipse Geometry
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

describe("Eclipse Geometry -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Starfield invariant", () => {
    it("demo HTML contains a starfield canvas element", () => {
      expect(html).toContain('class="cp-starfield"');
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
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

  describe("Celestial token invariants", () => {
    it("earthGlow gradient uses --cp-celestial-earth, not --cp-chart-1", () => {
      const earthGlow = html.match(
        /<radialGradient id="earthGlow"[\s\S]*?<\/radialGradient>/
      );
      expect(earthGlow).not.toBeNull();
      expect(earthGlow![0]).toContain("--cp-celestial-earth");
      expect(earthGlow![0]).not.toContain("--cp-chart-1");
    });

    it("moonGlow gradient uses --cp-celestial-moon, not --cp-text", () => {
      const moonGlow = html.match(
        /<radialGradient id="moonGlow"[\s\S]*?<\/radialGradient>/
      );
      expect(moonGlow).not.toBeNull();
      expect(moonGlow![0]).toContain("--cp-celestial-moon");
      expect(moonGlow![0]).not.toContain("--cp-text");
    });

    it("no legacy tokens remain in SVG defs", () => {
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toContain("--cp-warning");
      expect(allDefs).not.toContain("--cp-accent2");
      expect(allDefs).not.toContain("--cp-chart-1");
    });
  });

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      // phase angle (deg), |beta| (deg), nearest node (deg) = 3 dimensional readouts
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) =>
        /\((?:deg|km|yr)\)/.test(l)
      );
      expect(parenthesizedUnits.length).toBe(0);
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

    it("no --cp-accent2, --cp-accent3, or --cp-warning in HTML", () => {
      expect(html).not.toContain("--cp-accent2");
      expect(html).not.toContain("--cp-accent3");
      expect(html).not.toContain("--cp-warning");
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

  describe("Architecture compliance", () => {
    it("main.ts imports physics from @cosmic/physics, not inline", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain('from "@cosmic/physics"');
      // Should not inline eclipse geometry calculations
      expect(mainTs).not.toMatch(/function\s+eclipticLatitude/i);
      expect(mainTs).not.toMatch(/function\s+shadowRadi/i);
    });
  });

  describe("Instrument layer wrapper", () => {
    it("HTML has cp-layer-instrument class on demo root", () => {
      expect(html).toContain("cp-layer-instrument");
    });

    it("readouts panel exists as separate aside", () => {
      expect(html).toMatch(/<aside[^>]*cp-demo__readouts/);
    });
  });

  describe("Readouts panel", () => {
    it("readouts panel has accessible label", () => {
      expect(html).toMatch(/cp-demo__readouts[^>]*aria-label="Readouts panel"/);
    });

    it("model callout lives in controls or drawer, not readouts", () => {
      const readoutsSection = html.match(
        /cp-demo__readouts[\s\S]*?<\/aside>/
      );
      expect(readoutsSection).not.toBeNull();
      expect(readoutsSection![0]).not.toContain("cp-callout");
      // But the model callout should exist somewhere
      expect(html).toContain('data-kind="model"');
    });
  });
});
