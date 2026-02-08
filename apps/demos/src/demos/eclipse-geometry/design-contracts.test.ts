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
      expect(css).toMatch(/\.cp-demo__sidebar[\s\S]*?animation.*cp-slide-up/);
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

    it("readout strip exists as horizontal strip div", () => {
      expect(html).toMatch(/class="cp-readout-strip[^"]*cp-demo__readouts"/);
    });
  });

  describe("Readouts strip", () => {
    it("readout strip has accessible label", () => {
      expect(html).toMatch(/cp-readout-strip[^>]*aria-label="Readouts"/);
    });

    it("model callout lives in sidebar, not readout strip", () => {
      // Extract readout strip section (it's a div, not aside)
      const readoutsSection = html.match(
        /cp-readout-strip[\s\S]*?<\/div>\s*\n\s*\n/
      );
      expect(readoutsSection).not.toBeNull();
      expect(readoutsSection![0]).not.toContain("cp-callout");
      // But the model callout should exist somewhere (in the sidebar)
      expect(html).toContain('data-kind="model"');
    });

    it("readout strip has 6 readout items", () => {
      // Count .cp-readout divs inside the strip
      const strip = html.match(
        /class="cp-readout-strip[^"]*"[\s\S]*?<\/div>\s*\n\s*\n/
      );
      expect(strip).not.toBeNull();
      const readouts = strip![0].match(/class="cp-readout[\s" ]/g) || [];
      expect(readouts.length).toBe(6);
    });

    it("solar and lunar readouts have dot indicators", () => {
      expect(html).toMatch(/cp-readout--solar[\s\S]*?cp-readout__dot/);
      expect(html).toMatch(/cp-readout--lunar[\s\S]*?cp-readout__dot/);
    });
  });

  describe("Component migration: cp-chip + cp-button + cp-utility-toolbar", () => {
    it("no cp-action classes remain in HTML", () => {
      expect(html).not.toContain("cp-action");
    });

    it("phase buttons use cp-chip inside cp-chip-group", () => {
      expect(html).toMatch(/class="cp-chip-group[^"]*"/);
      expect(html).toMatch(/id="setNewMoon"[^>]*class="cp-chip"/);
      expect(html).toMatch(/id="setFullMoon"[^>]*class="cp-chip"/);
    });

    it("time control buttons use cp-button cp-button--ghost", () => {
      expect(html).toMatch(/id="animateMonth"[^>]*class="cp-button cp-button--ghost"/);
      expect(html).toMatch(/id="animateYear"[^>]*class="cp-button cp-button--ghost"/);
    });

    it("simulation control buttons use cp-button cp-button--ghost", () => {
      expect(html).toMatch(/id="runSimulation"[^>]*class="cp-button cp-button--ghost"/);
      expect(html).toMatch(/id="stopSimulation"[^>]*class="cp-button cp-button--ghost"/);
    });

    it("utility toolbar exists with correct role and aria-label", () => {
      expect(html).toMatch(/class="cp-utility-toolbar"[^>]*role="toolbar"/);
      expect(html).toMatch(/aria-label="Demo actions"/);
    });

    it("station, challenge, help, copy buttons use cp-utility-btn", () => {
      expect(html).toMatch(/id="stationMode"[^>]*class="cp-utility-btn"/);
      expect(html).toMatch(/id="challengeMode"[^>]*class="cp-utility-btn"/);
      expect(html).toMatch(/id="help"[^>]*class="cp-utility-btn"/);
      expect(html).toMatch(/id="copyResults"[^>]*class="cp-utility-btn"/);
    });

    it("popover nav contains links for exhibit, station card, and instructor notes", () => {
      const popover = html.match(/id="navPopover"[\s\S]*?<\/nav>/);
      expect(popover).not.toBeNull();
      expect(popover![0]).toContain("exhibits/eclipse-geometry/");
      expect(popover![0]).toContain("stations/eclipse-geometry/");
      expect(popover![0]).toContain("instructor/eclipse-geometry/");
    });

    it("main.ts imports and calls initPopovers", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain("initPopovers");
      expect(mainTs).toMatch(/initPopovers\s*\(/);
    });

    it("no old cp-actions wrapper remains", () => {
      expect(html).not.toContain('class="cp-actions"');
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

  describe("Shelf tabs", () => {
    it("shelf has 3 tab buttons with correct roles", () => {
      const tabs = html.match(/<button[^>]*role="tab"[^>]*>/g) || [];
      expect(tabs.length).toBe(3);
    });

    it("shelf has 3 tab panels with correct roles", () => {
      const panels = html.match(/<div[^>]*role="tabpanel"[^>]*>/g) || [];
      expect(panels.length).toBe(3);
    });

    it("tab buttons have aria-controls linking to panels", () => {
      expect(html).toMatch(/aria-controls="tab-notice"/);
      expect(html).toMatch(/aria-controls="tab-model"/);
      expect(html).toMatch(/aria-controls="tab-sim"/);
    });
  });

  describe("Eclipse window arcs", () => {
    it("8 arc path elements exist with correct classes", () => {
      const arcs = html.match(/<path[^>]*class="stage__arc[^"]*"/g) || [];
      expect(arcs.length).toBe(8);
    });

    it("arcs include solar and lunar types", () => {
      const solarArcs = html.match(/class="stage__arc stage__arc--solar"/g) || [];
      const lunarArcs = html.match(/class="stage__arc stage__arc--lunar"/g) || [];
      // 2 solar outer + 2 solar central + 2 lunar outer + 2 lunar central
      expect(solarArcs.length).toBe(2); // outer solar (non-central)
      expect(lunarArcs.length).toBe(2); // outer lunar (non-central)
    });

    it("eclipse arcs use design tokens in CSS", () => {
      expect(css).toMatch(/\.stage__arc--solar[\s\S]*?--cp-accent-rose/);
      expect(css).toMatch(/\.stage__arc--lunar[\s\S]*?--cp-accent\b/);
    });
  });

  describe("Contextual message element", () => {
    it("contextMessage element exists with aria-live", () => {
      expect(html).toMatch(/id="contextMessage"[^>]*aria-live="polite"/);
    });

    it("contextMessage has cp-context-message class", () => {
      expect(html).toMatch(/id="contextMessage"[^>]*class="[^"]*cp-context-message/);
    });
  });

  describe("Threshold bands", () => {
    it("3 band rect elements exist in beta panel", () => {
      const bands = html.match(/<rect[^>]*class="stage__band[^"]*"/g) || [];
      expect(bands.length).toBe(3);
    });

    it("2 band label elements exist", () => {
      const labels = html.match(/<text[^>]*class="stage__band-label[^"]*"/g) || [];
      expect(labels.length).toBe(2);
    });

    it("threshold bands use design tokens in CSS", () => {
      expect(css).toMatch(/\.stage__band--solar[\s\S]*?--cp-accent-rose/);
      expect(css).toMatch(/\.stage__band--lunar[\s\S]*?--cp-accent\b/);
    });
  });

  describe("Presets popover", () => {
    it("presetsPopover element exists with hidden attribute", () => {
      expect(html).toMatch(/id="presetsPopover"[^>]*hidden/);
    });

    it("presets popover contains preset buttons", () => {
      const popover = html.match(/id="presetsPopover"[\s\S]*?<\/div>\s*<\/div>/);
      expect(popover).not.toBeNull();
      expect(popover![0]).toContain("presetTotalSolar");
      expect(popover![0]).toContain("presetLunar");
      expect(popover![0]).toContain("presetNoEclipse");
      expect(popover![0]).toContain("presetSeason");
    });

    it("presets trigger button has aria-controls linking to popover", () => {
      expect(html).toMatch(/id="presetsBtn"[^>]*aria-controls="presetsPopover"/);
    });
  });

  describe("Sidebar layout (moon-phases shell)", () => {
    it("sidebar exists as aside with cp-demo__sidebar class", () => {
      expect(html).toMatch(/<aside[^>]*class="cp-demo__sidebar/);
    });

    it("no data-shell attribute remains", () => {
      expect(html).not.toContain("data-shell");
    });

    it("shelf section exists with cp-demo__shelf class", () => {
      expect(html).toMatch(/<section[^>]*class="cp-demo__shelf"/);
    });
  });
});
