import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Planetary Conjunctions
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 *
 * Invariants:
 *   1. SVG celestial objects MUST use --cp-celestial-* tokens (not legacy)
 *   2. A starfield canvas MUST exist in the HTML
 *   3. Readout values MUST separate units into .cp-readout__unit spans
 *   4. Demo-specific panels MUST use translucent backgrounds (or radial-gradient)
 *   5. No hardcoded rgba() color literals in CSS (use tokens)
 *   6. Entry animations MUST use cp-slide-up / cp-fade-in
 */

describe("Planetary Conjunctions -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const mainPath = path.resolve(__dirname, "main.ts");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");
  const mainTs = fs.readFileSync(mainPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("sun core uses --cp-celestial-sun-core", () => {
      expect(css).toMatch(/--cp-celestial-sun-core/);
    });

    it("sun has glow effect", () => {
      expect(css).toMatch(/--cp-glow-sun/);
    });

    it("Earth dot uses --cp-celestial-earth", () => {
      expect(css).toMatch(/\.conjunction__earth[\s\S]*?--cp-celestial-earth/);
    });

    it("Earth dot has planet glow", () => {
      expect(css).toMatch(/\.conjunction__earth[\s\S]*?--cp-glow-planet/);
    });

    it("target dot uses --cp-celestial-mars as default", () => {
      expect(css).toMatch(/\.conjunction__target[\s\S]*?--cp-celestial-mars/);
    });

    it("target dot has planet glow", () => {
      expect(css).toMatch(/\.conjunction__target[\s\S]*?--cp-glow-planet/);
    });

    it("orbit rings use --cp-celestial-orbit", () => {
      expect(css).toMatch(/\.conjunction__orbit[\s\S]*?--cp-celestial-orbit/);
    });

    it("conjunction line uses --cp-accent-amber", () => {
      expect(css).toMatch(/\.conjunction__line[\s\S]*?--cp-accent-amber/);
    });
  });

  describe("Starfield invariant", () => {
    it("demo HTML contains a starfield canvas element", () => {
      expect(html).toContain('class="cp-starfield"');
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });
  });

  describe("Starfield initialization", () => {
    it("main.ts imports and calls initStarfield", () => {
      expect(mainTs).toContain("initStarfield");
      expect(mainTs).toMatch(/initStarfield\s*\(/);
    });
  });

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      // synodic (days), elapsed (days), earth angle (deg), target angle (deg), separation (deg)
      expect(unitSpans.length).toBeGreaterThanOrEqual(5);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) =>
        /\((?:days|deg|yr)\)/.test(l)
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

    it("no --cp-chart-* tokens remain in CSS", () => {
      expect(css).not.toMatch(/--cp-chart-[0-9]/);
    });
  });

  describe("Entry animations", () => {
    it("demo shell sections have entry animations", () => {
      expect(css).toMatch(/\.cp-demo__controls[\s\S]*?animation.*cp-slide-up/);
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation.*cp-fade-in/);
      expect(css).toMatch(/\.cp-demo__readouts[\s\S]*?animation.*cp-slide-up/);
      expect(css).toMatch(/\.cp-demo__drawer[\s\S]*?animation.*cp-fade-in/);
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

  describe("Instrument layer", () => {
    it("demo root has cp-layer-instrument class", () => {
      expect(html).toContain("cp-layer-instrument");
    });
  });

  describe("Architecture compliance", () => {
    it("main.ts imports physics from @cosmic/physics, not inline", () => {
      expect(mainTs).toContain('from "@cosmic/physics"');
    });

    it("main.ts imports pure logic from ./logic", () => {
      expect(mainTs).toContain('from "./logic"');
    });

    it("main.ts does not define its own formatNumber or clamp", () => {
      expect(mainTs).not.toMatch(/^function\s+formatNumber/m);
      expect(mainTs).not.toMatch(/^function\s+clamp/m);
    });
  });

  describe("Component contracts", () => {
    it("uses cp-chip for planet selector buttons", () => {
      const chips = html.match(/class="cp-chip planet-chip"/g) || [];
      expect(chips.length).toBeGreaterThanOrEqual(4);
    });

    it("uses cp-chip-group container for planet selector", () => {
      expect(html).toContain("cp-chip-group");
    });

    it("uses cp-button--ghost for reset button", () => {
      expect(html).toContain("cp-button--ghost");
    });

    it("uses cp-utility-toolbar for actions", () => {
      expect(html).toContain("cp-utility-toolbar");
    });

    it("has zero cp-action references", () => {
      expect(html).not.toContain("cp-action");
      expect(css).not.toContain("cp-action");
    });
  });

  describe("SVG structure", () => {
    it("has Earth and target orbit circles", () => {
      expect(html).toContain('id="earthOrbit"');
      expect(html).toContain('id="targetOrbit"');
    });

    it("has Earth and target planet dots", () => {
      expect(html).toContain('id="earthDot"');
      expect(html).toContain('id="targetDot"');
    });

    it("has conjunction line element", () => {
      expect(html).toContain('id="conjunctionLine"');
    });

    it("has sun with gradient glow", () => {
      expect(html).toContain('id="sunGlow"');
      expect(html).toContain('fill="url(#sunGlow)"');
    });
  });

  describe("Radial-gradient background", () => {
    it("SVG uses radial-gradient background, not opaque panel bg", () => {
      expect(css).toMatch(/\.conjunction[\s\S]*?radial-gradient/);
    });
  });

  describe("Animation dt clamping", () => {
    it("main.ts clamps dt to prevent tab-backgrounding jumps", () => {
      expect(mainTs).toMatch(/Math\.min\s*\([\s\S]*?0\.1/);
    });
  });
});
