import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests — Moon Phases
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
 */

describe("Moon Phases — Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("SVG sun elements use --cp-celestial-sun, not --cp-warning", () => {
      // sunGlow gradient and sunlight arrows must use celestial token
      const sunGlowSection = html.match(/<radialGradient id="sunGlow"[\s\S]*?<\/radialGradient>/);
      expect(sunGlowSection).not.toBeNull();
      expect(sunGlowSection![0]).toContain("--cp-celestial-sun");
      expect(sunGlowSection![0]).not.toContain("--cp-warning");
    });

    it("SVG earth elements use --cp-celestial-earth, not --cp-accent2", () => {
      const earthGradient = html.match(/<radialGradient id="earthGradient"[\s\S]*?<\/radialGradient>/);
      expect(earthGradient).not.toBeNull();
      expect(earthGradient![0]).toContain("--cp-celestial-earth");
      expect(earthGradient![0]).not.toContain("--cp-accent2");
    });

    it("SVG moon-dark uses --cp-celestial-moon-dark, not --cp-bg3", () => {
      const moonDark = html.match(/<circle id="moon-dark"[^>]*>/);
      expect(moonDark).not.toBeNull();
      expect(moonDark![0]).toContain("--cp-celestial-moon-dark");
      expect(moonDark![0]).not.toContain("--cp-bg3");
    });

    it("SVG moon-lit gradient uses --cp-celestial-moon", () => {
      const moonLit = html.match(/<radialGradient id="moonLit"[\s\S]*?<\/radialGradient>/);
      expect(moonLit).not.toBeNull();
      expect(moonLit![0]).toContain("--cp-celestial-moon");
    });

    it("orbit path uses --cp-celestial-orbit, not --cp-border", () => {
      // The dashed orbit circle around Earth
      const orbitCircle = html.match(/<circle[^>]*stroke-dasharray="4 4"[^>]*>/);
      expect(orbitCircle).not.toBeNull();
      expect(orbitCircle![0]).toContain("--cp-celestial-orbit");
      expect(orbitCircle![0]).not.toContain("--cp-border");
    });

    it("sunlight arrows use --cp-celestial-sun, not --cp-warning", () => {
      const sunlightGroup = html.match(/<g id="sunlight-arrows"[\s\S]*?<\/g>/);
      expect(sunlightGroup).not.toBeNull();
      expect(sunlightGroup![0]).toContain("--cp-celestial-sun");
      expect(sunlightGroup![0]).not.toContain("--cp-warning");
    });

    it("no legacy --cp-warning tokens remain in SVG gradients", () => {
      // Extract all SVG defs content
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toContain("--cp-warning");
    });

    it("no legacy --cp-accent2 tokens remain in SVG gradients", () => {
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toContain("--cp-accent2");
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
      // Readouts that display units should have separate unit spans
      // "Phase angle alpha" has unit (deg) → needs cp-readout__unit
      // "Illumination fraction f" is dimensionless → no unit needed
      // "Illuminated (%)" has unit (%) → needs cp-readout__unit
      // "Days since new" has unit (d) → needs cp-readout__unit
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Panel translucency", () => {
    it("demo CSS uses translucent backgrounds for viz panels", () => {
      expect(css).toMatch(/\.viz-panel[\s\S]*?background:\s*rgba\(/);
    });

    it("demo CSS uses backdrop-filter for viz panels", () => {
      expect(css).toMatch(/\.viz-panel[\s\S]*?backdrop-filter/);
    });
  });

  describe("No legacy token leakage in CSS", () => {
    it("timeline active state does not use --cp-warning", () => {
      expect(css).not.toMatch(/\.timeline-phase\.active[\s\S]*?--cp-warning/);
    });

    it("sky markers do not use --cp-accent2", () => {
      expect(html).not.toMatch(/<circle id="sky-rise-marker"[^>]*--cp-accent2/);
    });
  });
});
