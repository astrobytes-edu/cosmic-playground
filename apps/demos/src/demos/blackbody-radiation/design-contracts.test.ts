import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Blackbody Radiation
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

describe("Blackbody Radiation -- Design System Contracts", () => {
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

    it("main.ts initializes tabs via initTabs", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain("initTabs");
      expect(mainTs).toMatch(/initTabs\s*\(/);
    });
  });

  describe("Explore/Understand tabs", () => {
    it("contains two top-level stage tabs with ARIA wiring", () => {
      expect(html).toContain('id="tab-explore"');
      expect(html).toContain('id="tab-understand"');
      expect(html).toContain('id="panel-explore"');
      expect(html).toContain('id="panel-understand"');
      const tabButtons = html.match(/role="tab"/g) || [];
      expect(tabButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      // peak wavelength (nm) + luminosity ratio (Lsun)
      expect(unitSpans.length).toBeGreaterThanOrEqual(2);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:nm|K)\)/.test(l));
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
      // Should not inline Planck's law
      expect(mainTs).not.toMatch(/function\s+planck/i);
    });

    it("canvas stage uses design-system tokens for background", () => {
      // The radial-gradient on the spectrum canvas should use token-based colors
      expect(css).toMatch(/#spectrumCanvas[\s\S]*?background[\s\S]*?var\(--cp-/);
    });

    it("star preview circle uses token-based styling", () => {
      expect(css).toMatch(/star-preview__circle[\s\S]*?var\(--cp-/);
    });
  });

  describe("Celestial glow effects", () => {
    it("star preview circle has glow or box-shadow using tokens", () => {
      expect(css).toMatch(/star-preview__circle[\s\S]*?(?:box-shadow|filter)[\s\S]*?var\(--cp-/);
    });
  });

  describe("Instrument layer wrapper", () => {
    it("HTML has cp-layer-instrument class on demo root", () => {
      expect(html).toContain("cp-layer-instrument");
    });

    it("readouts are integrated in controls panel (no separate readouts aside)", () => {
      // Star preview and readouts should be inside the controls panel, not a separate aside
      expect(html).not.toMatch(/<aside[^>]*cp-demo__readouts/);
      // Controls panel should contain the readout elements
      const controlsSection = html.match(/class="cp-demo__controls[\s\S]*?<\/aside>/);
      expect(controlsSection).not.toBeNull();
      expect(controlsSection![0]).toContain('class="cp-readout"');
      expect(controlsSection![0]).toContain('class="star-preview"');
    });
  });

  describe("Component contracts", () => {
    it("uses cp-chip for preset buttons (not cp-action)", () => {
      const presetChips = html.match(/class="cp-chip preset"/g) || [];
      expect(presetChips.length).toBeGreaterThanOrEqual(12);
      expect(html).not.toContain("cp-action");
    });

    it("uses cp-chip for scale selector (not segmented__button)", () => {
      expect(html).toContain('class="cp-chip"');
      expect(html).not.toContain("segmented__button");
    });

    it("uses cp-chip-group containers for presets", () => {
      expect(html).toContain("cp-chip-group--grid");
      expect(html).toContain("cp-chip-group");
    });

    it("uses cp-utility-toolbar for actions (not cp-actions)", () => {
      expect(html).toContain("cp-utility-toolbar");
      expect(html).not.toContain('"cp-actions"');
    });

    it("has zero cp-action references in HTML and CSS", () => {
      expect(html).not.toContain("cp-action");
      expect(css).not.toContain("cp-action");
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
