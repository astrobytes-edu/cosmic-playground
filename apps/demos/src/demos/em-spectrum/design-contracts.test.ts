import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- EM Spectrum
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

describe("EM Spectrum -- Design System Contracts", () => {
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

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      // wavelength, frequency, energy = 3 dimensional readouts
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) =>
        /\((?:nm|Hz|eV|cm|m|km)\)/.test(l)
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
      // Should not inline photon calculations
      expect(mainTs).not.toMatch(/function\s+planck/i);
      expect(mainTs).not.toMatch(/6\.626\s*\*\s*1e-27/);
    });

    it("spectrum bar gradient is applied from logic.ts (spectral data, not CSS tokens)", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      // Gradient is physical spectral data applied via JS, not a design token
      expect(mainTs).toContain("spectrumGradientCSS");
    });

    it("spectrum wave canvas exists for chirp overlay", () => {
      expect(html).toMatch(/<canvas[^>]*id="spectrumWaveCanvas"/);
    });

    it("scale objects container exists", () => {
      expect(html).toMatch(/id="spectrumScale"/);
    });

    it("includes powers-of-ten guide for SI connection", () => {
      expect(html).toContain("spectrum__powers");
      expect(html).toContain("Power-of-ten guide");
      expect(html).toContain("10^{4}");
      expect(html).toContain("10^{-14}");
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

    it("equation callout lives in Model Notes, not readouts", () => {
      // The relationship equations belong in Model Notes for cleaner readouts
      const readoutsSection = html.match(
        /cp-demo__readouts[\s\S]*?<\/aside>/
      );
      expect(readoutsSection).not.toBeNull();
      expect(readoutsSection![0]).not.toContain("cp-callout");
      // But it should exist somewhere in the page
      expect(html).toContain('data-kind="model"');
    });
  });

  describe("Component migration contracts", () => {
    it("uses cp-chip for band selector buttons", () => {
      const chips = html.match(/class="cp-chip band"/g) || [];
      expect(chips.length).toBe(7);
    });

    it("uses cp-chip-group container for band picker", () => {
      expect(html).toContain("cp-chip-group--grid");
    });

    it("uses cp-utility-toolbar for actions", () => {
      expect(html).toContain("cp-utility-toolbar");
    });

    it("uses cp-utility-btn for copy results", () => {
      expect(html).toMatch(/id="copyResults"[^>]*class="cp-utility-btn"/);
    });

    it("has popover navigation with correct links", () => {
      expect(html).toContain("cp-popover-trigger");
      expect(html).toContain("cp-popover");
      expect(html).toContain('href="../../exhibits/em-spectrum/"');
      expect(html).toContain('href="../../stations/em-spectrum/"');
      expect(html).toContain('href="../../instructor/em-spectrum/"');
    });

    it("main.ts imports and calls initPopovers", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain("initPopovers");
      expect(mainTs).toMatch(/initPopovers\s*\(/);
    });

    it("has zero cp-action references in HTML", () => {
      expect(html).not.toContain("cp-action");
    });

    it("has zero cp-action references in CSS", () => {
      expect(css).not.toContain("cp-action");
    });

    it("has zero cp-actions wrapper in HTML", () => {
      expect(html).not.toContain("cp-actions");
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
