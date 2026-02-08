import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Kepler's Laws
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

describe("Kepler's Laws -- Design System Contracts", () => {
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
    it("starGradient uses --cp-celestial-sun, not --cp-warning", () => {
      const starGrad = html.match(
        /<radialGradient id="starGradient"[\s\S]*?<\/radialGradient>/
      );
      expect(starGrad).not.toBeNull();
      expect(starGrad![0]).toContain("--cp-celestial-sun");
      expect(starGrad![0]).not.toContain("--cp-warning");
    });

    it("planetGradient uses --cp-celestial tokens, not --cp-chart", () => {
      const planetGrad = html.match(
        /<radialGradient id="planetGradient"[\s\S]*?<\/radialGradient>/
      );
      expect(planetGrad).not.toBeNull();
      expect(planetGrad![0]).not.toContain("--cp-chart-1");
      expect(planetGrad![0]).not.toContain("--cp-chart-2");
    });

    it("focus1 marker uses --cp-celestial-sun, not --cp-warning", () => {
      const focus1 = html.match(/<circle id="focus1"[^>]*>/);
      expect(focus1).not.toBeNull();
      expect(focus1![0]).toContain("--cp-celestial-sun");
      expect(focus1![0]).not.toContain("--cp-warning");
    });

    it("perihelion marker uses semantic token, not --cp-warning", () => {
      const periMarker = html.match(/<circle id="perihelionMarker"[^>]*>/);
      expect(periMarker).not.toBeNull();
      expect(periMarker![0]).not.toContain("--cp-warning");
    });

    it("aphelion marker uses semantic token, not --cp-chart-2", () => {
      const aphMarker = html.match(/<circle id="aphelionMarker"[^>]*>/);
      expect(aphMarker).not.toBeNull();
      expect(aphMarker![0]).not.toContain("--cp-chart-2");
    });

    it("equal-areas wedge uses semantic token, not --cp-chart-1", () => {
      const wedge = html.match(/<path[\s\S]*?id="equalAreasWedge"[^>]*>/);
      expect(wedge).not.toBeNull();
      expect(wedge![0]).not.toContain("--cp-chart-1");
    });

    it("no legacy tokens remain in SVG defs", () => {
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toContain("--cp-warning");
      expect(allDefs).not.toContain("--cp-chart-1");
      expect(allDefs).not.toContain("--cp-chart-2");
    });
  });

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      // distance (AU), velocity (km/s), acceleration (mm/s^2), period (yr),
      // kinetic, potential, total energy, angular momentum, areal velocity = 9
      expect(unitSpans.length).toBeGreaterThanOrEqual(9);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) =>
        /\((?:AU|km|yr|cm|mm)\)/.test(l)
      );
      expect(parenthesizedUnits.length).toBe(0);
    });
  });

  describe("No legacy token leakage in CSS", () => {
    it("no --cp-warning tokens remain in demo CSS", () => {
      expect(css).not.toContain("--cp-warning");
    });

    it("no --cp-chart-1 or --cp-chart-2 tokens remain in CSS", () => {
      expect(css).not.toContain("--cp-chart-1");
      expect(css).not.toContain("--cp-chart-2");
    });

    it("no --cp-warning, --cp-chart-1, or --cp-chart-2 in HTML", () => {
      expect(html).not.toContain("--cp-warning");
      expect(html).not.toContain("--cp-chart-1");
      expect(html).not.toContain("--cp-chart-2");
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
      // Should not inline orbital mechanics calculations
      expect(mainTs).not.toMatch(/function\s+orbitalPeriod/i);
      expect(mainTs).not.toMatch(/function\s+stateAtMean/i);
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
  });

  describe("Component migration: cp-chip presets", () => {
    it("all 9 preset buttons use cp-chip class, not cp-button--outline", () => {
      const chips = html.match(/class="cp-chip preset[^"]*"/g) || [];
      expect(chips.length).toBe(9);
    });

    it("no cp-button--outline remains on preset buttons", () => {
      const presetButtons = html.match(/class="[^"]*preset[^"]*"/g) || [];
      const outlinePresets = presetButtons.filter((c) => c.includes("cp-button--outline"));
      expect(outlinePresets).toEqual([]);
    });

    it("active preset uses is-active class, not preset--active", () => {
      expect(html).not.toContain("preset--active");
      const activeChips = html.match(/cp-chip[^"]*is-active/g) || [];
      expect(activeChips.length).toBeGreaterThanOrEqual(1);
    });

    it("preset containers use cp-chip-group--grid, not cp-button-grid", () => {
      expect(html).not.toContain("cp-button-grid");
      const chipGroups = html.match(/cp-chip-group--grid/g) || [];
      expect(chipGroups.length).toBe(2);
    });

    it("main.ts uses is-active for preset toggling, not preset--active", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).not.toContain("preset--active");
      expect(mainTs).toContain("is-active");
    });

    it("CSS has no .preset--active rule (replaced by theme .cp-chip.is-active)", () => {
      expect(css).not.toMatch(/\.preset--active\s*\{/);
    });

    it("CSS has no .cp-button-grid rule (replaced by theme .cp-chip-group--grid)", () => {
      expect(css).not.toMatch(/\.cp-button-grid\s*\{/);
    });
  });

  describe("Component migration: cp-utility-toolbar", () => {
    it("HTML contains a cp-utility-toolbar", () => {
      expect(html).toContain("cp-utility-toolbar");
      expect(html).toMatch(/<div[^>]*class="cp-utility-toolbar"/);
    });

    it("toolbar has role=toolbar and aria-label", () => {
      expect(html).toMatch(/cp-utility-toolbar[^>]*role="toolbar"/);
      expect(html).toMatch(/cp-utility-toolbar[^>]*aria-label/);
    });

    it("station mode button is cp-utility-btn with aria-label", () => {
      expect(html).toMatch(/id="stationMode"[^>]*class="cp-utility-btn"/);
      expect(html).toMatch(/id="stationMode"[^>]*aria-label/);
    });

    it("help button is cp-utility-btn with aria-label", () => {
      expect(html).toMatch(/id="help"[^>]*class="cp-utility-btn"/);
      expect(html).toMatch(/id="help"[^>]*aria-label/);
    });

    it("copy results button is cp-utility-btn with aria-label", () => {
      expect(html).toMatch(/id="copyResults"[^>]*class="cp-utility-btn"/);
      expect(html).toMatch(/id="copyResults"[^>]*aria-label/);
    });

    it("no cp-action or cp-actions wrappers remain", () => {
      expect(html).not.toContain("cp-action");
      expect(html).not.toContain("cp-actions");
    });
  });

  describe("Component migration: popover nav", () => {
    it("HTML contains a cp-popover-anchor with nav links", () => {
      expect(html).toContain("cp-popover-anchor");
      expect(html).toContain("cp-popover-trigger");
      expect(html).toContain("cp-popover");
    });

    it("popover contains links to exhibit, station, and instructor pages", () => {
      expect(html).toContain('href="../../exhibits/keplers-laws/"');
      expect(html).toContain('href="../../stations/keplers-laws/"');
      expect(html).toContain('href="../../instructor/keplers-laws/"');
    });

    it("main.ts imports and calls initPopovers", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain("initPopovers");
      expect(mainTs).toMatch(/initPopovers\s*\(/);
    });
  });

  describe("Chip button aria-pressed", () => {
    it("all cp-chip buttons have initial aria-pressed attribute", () => {
      const chipButtons = html.match(/<button[^>]*class="[^"]*cp-chip[^"]*"[^>]*>/g) || [];
      expect(chipButtons.length).toBeGreaterThan(0);
      const missing = chipButtons.filter((tag) => !tag.includes("aria-pressed"));
      expect(missing, "cp-chip buttons missing aria-pressed").toEqual([]);
    });
  });
});
