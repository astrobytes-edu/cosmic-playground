import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Parallax Distance
 *
 * Invariants:
 *   1. Uses composable Moon-Phases-style primitives (sidebar, readout strip, tabs)
 *   2. Stage contains orbit + Jan/Jul + angle + detector shift geometry nodes
 *   3. A starfield canvas exists and main.ts initializes initStarfield
 *   4. Readout values separate units into .cp-readout__unit spans
 *   5. CSS stays token-first (no legacy alias leakage, no hex/rgba literals)
 *   6. Physics imports come from @cosmic/physics
 */

describe("Parallax Distance -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const mainPath = path.resolve(__dirname, "main.ts");

  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");
  const mainTs = fs.readFileSync(mainPath, "utf-8");

  describe("Composable layout primitives", () => {
    it("uses sidebar + stage + readout strip + shelf drawer marker", () => {
      expect(html).toContain("cp-demo__sidebar");
      expect(html).toContain("cp-demo__stage");
      expect(html).toContain("cp-readout-strip");
      expect(html).toContain("cp-demo__drawer");
    });

    it("uses tab semantics for pedagogical shelf", () => {
      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');
      expect(html).toContain('role="tabpanel"');
    });

    it("uses cp-utility-toolbar actions", () => {
      expect(html).toContain("cp-utility-toolbar");
    });
  });

  describe("Stage geometry contract", () => {
    it("includes orbit scaffold and observer baseline nodes", () => {
      expect(html).toContain('id="orbitPath"');
      expect(html).toContain('id="sun"');
      expect(html).toContain('id="earthJan"');
      expect(html).toContain('id="earthJul"');
      expect(html).toContain('id="baseline"');
    });

    it("includes parallax angle nodes", () => {
      expect(html).toContain('id="angleArc"');
      expect(html).toContain('id="angleLabel"');
      expect(html).toContain('id="star"');
      expect(html).toContain('id="starLabel"');
    });

    it("includes detector shift nodes", () => {
      expect(html).toContain('id="detectorTrack"');
      expect(html).toContain('id="detectorMarkerJan"');
      expect(html).toContain('id="detectorMarkerJul"');
      expect(html).toContain('id="detectorLabel"');
    });
  });

  describe("Starfield + runtime wiring", () => {
    it("contains starfield canvas", () => {
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });

    it("main.ts initializes starfield, popovers, and tabs", () => {
      expect(mainTs).toContain("initStarfield");
      expect(mainTs).toMatch(/initStarfield\s*\(/);
      expect(mainTs).toContain("initPopovers");
      expect(mainTs).toMatch(/initPopovers\s*\(/);
      expect(mainTs).toContain("initTabs");
      expect(mainTs).toMatch(/initTabs\s*\(/);
    });
  });

  describe("Readout unit separation", () => {
    it("includes unit spans for dimensional readouts", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("labels avoid parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((line) => /\((?:arcsec|pc|ly|mas)\)/.test(line));
      expect(parenthesizedUnits.length).toBe(0);
    });

    it("uses unit-explicit distance labels", () => {
      expect(html).toContain("Distance $d$ in parsecs");
      expect(html).toContain("Distance $d$ in light-years");
    });
  });

  describe("Jan/Jul visual encoding consistency", () => {
    it("uses explicit Jan/Jul earth and ray classes", () => {
      expect(html).toContain("stage__earth--jan");
      expect(html).toContain("stage__earth--jul");
      expect(html).toContain("stage__ray--jan");
      expect(html).toContain("stage__ray--jul");
    });

    it("maps Jan/Jul marker classes to accent tokens", () => {
      expect(css).toMatch(/\.stage__earth--jan[\s\S]*?--cp-accent-ice/);
      expect(css).toMatch(/\.stage__earth--jul[\s\S]*?--cp-accent-rose/);
      expect(css).toMatch(/\.stage__detector-dot--jan[\s\S]*?--cp-accent-ice/);
      expect(css).toMatch(/\.stage__detector-dot--jul[\s\S]*?--cp-accent-rose/);
    });
  });

  describe("Token-first color invariants", () => {
    it("sun, earth, and star classes use celestial tokens", () => {
      expect(css).toMatch(/\.stage__sun[\s\S]*?--cp-celestial-sun/);
      expect(css).toMatch(/\.stage__earth[\s\S]*?--cp-celestial-earth/);
      expect(css).toMatch(/\.stage__star[\s\S]*?--cp-celestial-star/);
      expect(css).toMatch(/\.stage__orbit[\s\S]*?--cp-celestial-orbit/);
    });

    it("contains no legacy token aliases", () => {
      expect(css).not.toContain("--cp-warning");
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
      expect(html).not.toContain("--cp-accent2");
      expect(html).not.toContain("--cp-accent3");
    });

    it("contains no hardcoded rgba() or hex literals", () => {
      const cssLines = css.split("\n");

      const rgbaViolations = cssLines.filter((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("/*") || trimmed.startsWith("*")) return false;
        return /rgba\s*\(/.test(line) && !line.includes("color-mix");
      });

      const hexViolations = cssLines.filter((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("/*") || trimmed.startsWith("*")) return false;
        return /#[0-9a-fA-F]{3,8}\b/.test(line);
      });

      expect(rgbaViolations).toEqual([]);
      expect(hexViolations).toEqual([]);
    });
  });

  describe("Architecture compliance", () => {
    it("imports physics from @cosmic/physics", () => {
      expect(mainTs).toContain('from "@cosmic/physics"');
      expect(mainTs).not.toMatch(/function\s+distanceParsec/);
    });
  });
});
