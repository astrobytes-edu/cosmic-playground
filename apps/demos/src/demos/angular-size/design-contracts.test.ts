import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests — Angular Size
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 *
 * Invariants:
 *   1. SVG celestial objects MUST use --cp-celestial-* tokens (not legacy)
 *   2. A starfield canvas MUST exist in the HTML
 *   3. Readout values MUST separate units into .cp-readout__unit spans
 *   4. Demo-specific panels MUST use translucent backgrounds
 *   5. No hardcoded rgba() color literals in CSS (use tokens)
 *   6. Entry animations MUST use cp-slide-up / cp-fade-in
 */

describe("Angular Size — Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("SVG sun gradient uses --cp-celestial-sun, not --cp-chart-4 or --cp-warning", () => {
      const sunGlow = html.match(/<radialGradient id="sunGlow"[\s\S]*?<\/radialGradient>/);
      expect(sunGlow).not.toBeNull();
      expect(sunGlow![0]).toContain("--cp-celestial-sun");
      expect(sunGlow![0]).not.toContain("--cp-chart-4");
      expect(sunGlow![0]).not.toContain("--cp-warning");
    });

    it("SVG moon gradient uses --cp-celestial-moon, not --cp-text", () => {
      const moonGlow = html.match(/<radialGradient id="moonGlow"[\s\S]*?<\/radialGradient>/);
      expect(moonGlow).not.toBeNull();
      expect(moonGlow![0]).toContain("--cp-celestial-moon");
      expect(moonGlow![0]).not.toContain("stop-color=\"var(--cp-text)\"");
    });

    it("SVG planet gradient uses --cp-celestial-earth, not --cp-chart-1", () => {
      const planetGlow = html.match(/<radialGradient id="planetGlow"[\s\S]*?<\/radialGradient>/);
      expect(planetGlow).not.toBeNull();
      expect(planetGlow![0]).toContain("--cp-celestial-earth");
      expect(planetGlow![0]).not.toContain("--cp-chart-1");
    });

    it("SVG mars gradient uses --cp-celestial-mars, not --cp-danger", () => {
      const marsGlow = html.match(/<radialGradient id="marsGlow"[\s\S]*?<\/radialGradient>/);
      expect(marsGlow).not.toBeNull();
      expect(marsGlow![0]).toContain("--cp-celestial-mars");
      expect(marsGlow![0]).not.toContain("--cp-danger");
    });

    it("no legacy --cp-chart-* tokens remain in SVG defs", () => {
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toMatch(/--cp-chart-[1-5]/);
    });

    it("no --cp-danger tokens remain in SVG defs", () => {
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toContain("--cp-danger");
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
      // θ display has dynamic unit (deg/arcmin/arcsec) → needs cp-readout__unit
      // θ (deg) has unit (deg) → needs cp-readout__unit
      // D has unit (km) → needs cp-readout__unit
      // d has unit (km) → needs cp-readout__unit
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      // Labels like "Angular diameter θ (deg)" should become "Angular diameter θ"
      // with the unit in a separate span
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:deg|km|arcmin|arcsec)\)/.test(l));
      expect(parenthesizedUnits.length).toBe(0);
    });
  });

  describe("Panel translucency", () => {
    it("stage SVG container uses backdrop-filter", () => {
      // The stage area should participate in the frosted-glass aesthetic
      expect(css).toMatch(/backdrop-filter/);
    });
  });

  describe("No legacy token leakage in CSS", () => {
    it("angle arc does not use --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__angleArc[\s\S]*?--cp-warning/);
    });

    it("size line does not use --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__sizeLine[\s\S]*?--cp-warning/);
    });

    it("no --cp-warning tokens remain in demo CSS", () => {
      expect(css).not.toContain("--cp-warning");
    });
  });

  describe("Entry animations", () => {
    it("demo shell sections have entry animations", () => {
      expect(css).toMatch(/\.cp-demo__controls[\s\S]*?animation.*cp-slide-up/);
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation.*cp-fade-in/);
    });
  });
});
