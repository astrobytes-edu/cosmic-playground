import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Seasons
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

describe("Seasons -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("sun uses --cp-celestial-sun tokens, not --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__sun[\s\S]*?--cp-warning/);
      expect(html).not.toContain('stop-color="var(--cp-warning)"');
    });

    it("earth uses --cp-celestial-earth, not --cp-accent3 or --cp-chart-1", () => {
      expect(css).not.toMatch(/\.stage__earth[\s\S]*?--cp-accent3/);
      expect(html).not.toContain('stop-color="var(--cp-chart-1)"');
    });

    it("orbit uses --cp-celestial-orbit, not --cp-accent3", () => {
      expect(css).not.toMatch(/\.stage__orbit[\s\S]*?--cp-accent3/);
    });

    it("axis uses semantic token, not --cp-accent3", () => {
      expect(css).not.toMatch(/\.stage__axis[\s\S]*?--cp-accent3/);
    });

    it("sun rays use --cp-celestial-sun, not --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__ray[\s\S]*?--cp-warning/);
    });

    it("subsolar marker uses --cp-celestial-sun, not --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__markerSun[\s\S]*?--cp-warning/);
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
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:deg|h|AU)\)/.test(l));
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
      expect(mainTs).not.toMatch(/function\s+sunDeclination/);
    });
  });

  describe("Component contracts", () => {
    it("uses cp-chip for anchor date buttons", () => {
      const chips = html.match(/class="cp-chip"/g) || [];
      expect(chips.length).toBeGreaterThanOrEqual(4);
    });

    it("uses cp-chip-group for anchor row", () => {
      expect(html).toContain("cp-chip-group");
    });

    it("uses cp-utility-toolbar for actions", () => {
      expect(html).toContain("cp-utility-toolbar");
    });

    it("has zero cp-action references", () => {
      expect(html).not.toContain("cp-action");
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

  describe("Globe view elements", () => {
    it("SVG contains a terminator ellipse", () => {
      expect(html).toContain('id="terminator"');
      expect(html).toMatch(/<ellipse[^>]*id="terminator"/);
    });

    it("SVG contains latitude band ellipses (equator, tropics, arctic circles)", () => {
      expect(html).toContain('id="equator-band"');
      expect(html).toContain('id="tropic-n"');
      expect(html).toContain('id="tropic-s"');
      expect(html).toContain('id="arctic-n"');
      expect(html).toContain('id="arctic-s"');
    });

    it("SVG contains a globe axis line", () => {
      expect(html).toContain('id="globe-axis"');
      expect(html).toMatch(/<line[^>]*id="globe-axis"/);
    });

    it("SVG contains a globe latitude marker", () => {
      expect(html).toContain('id="globe-marker"');
      expect(html).toMatch(/<circle[^>]*id="globe-marker"/);
    });

    it("SVG contains an ecliptic line", () => {
      expect(html).toContain('id="globe-ecliptic"');
    });

    it("SVG contains a celestial equator ellipse", () => {
      expect(html).toContain('id="globe-equator"');
    });
  });

  describe("Overlay toggles", () => {
    it("overlay chip buttons have data-overlay attributes", () => {
      const overlayBtns = html.match(/<button[^>]*data-overlay="[^"]*"[^>]*>/g) || [];
      expect(overlayBtns.length).toBe(7);
    });

    it("overlay chip buttons have aria-pressed attributes", () => {
      const overlayBtns = html.match(/<button[^>]*data-overlay="[^"]*"[^>]*>/g) || [];
      const missing = overlayBtns.filter((tag) => !tag.includes("aria-pressed"));
      expect(missing, "overlay buttons missing aria-pressed").toEqual([]);
    });

    it("overlay group has accessible fieldset with legend", () => {
      expect(html).toContain('aria-label="Overlays"');
      expect(html).toMatch(/<legend[^>]*>.*overlays.*<\/legend>/i);
    });
  });

  describe("Latitude slider", () => {
    it("latitude slider exists with min -90 and max 90", () => {
      expect(html).toContain('id="latitude"');
      expect(html).toMatch(/id="latitude"[^>]*min="-90"/);
      expect(html).toMatch(/id="latitude"[^>]*max="90"/);
    });
  });

  describe("Tilt slider range", () => {
    it("tilt slider max is 90 (not 45)", () => {
      expect(html).toMatch(/id="tilt"[^>]*max="90"/);
      expect(html).not.toMatch(/id="tilt"[^>]*max="45"/);
    });
  });

  describe("Tabbed shelf layout", () => {
    it("shelf uses role=tablist with three tab buttons", () => {
      expect(html).toContain('role="tablist"');
      const tabs = html.match(/role="tab"/g) || [];
      expect(tabs.length).toBe(3);
    });

    it("tab panels have role=tabpanel and matching aria-labelledby", () => {
      const panels = html.match(/role="tabpanel"/g) || [];
      expect(panels.length).toBe(3);
      expect(html).toContain('aria-labelledby="tab-btn-notice"');
      expect(html).toContain('aria-labelledby="tab-btn-model"');
      expect(html).toContain('aria-labelledby="tab-btn-overlays"');
    });
  });

  describe("Readout strip layout", () => {
    it("has a cp-readout-strip section", () => {
      expect(html).toContain("cp-readout-strip");
    });
  });

  describe("Context message", () => {
    it("context message element has aria-live=polite", () => {
      expect(html).toContain('id="contextMessage"');
      expect(html).toMatch(/id="contextMessage"[^>]*aria-live="polite"/);
    });
  });

  describe("Orbit panel features", () => {
    it("SVG contains distance line element", () => {
      expect(html).toContain('id="distanceLine"');
    });

    it("SVG contains Polaris axis group", () => {
      expect(html).toContain('id="polarisGroup"');
      expect(html).toContain('id="polarisAxis"');
    });

    it("SVG contains season labels", () => {
      expect(html).toContain('class="stage__seasonLabel"');
      const labels = html.match(/class="stage__seasonLabel"/g) || [];
      expect(labels.length).toBe(4);
    });

    it("SVG contains perihelion and aphelion markers", () => {
      expect(html).toContain(">Peri<");
      expect(html).toContain(">Aph<");
    });
  });

  describe("Globe panel features", () => {
    it("SVG contains sunlight rays group", () => {
      expect(html).toContain('id="sunlightRays"');
    });

    it("SVG contains day-length arc paths", () => {
      expect(html).toContain('id="dayArc"');
      expect(html).toContain('id="nightArc"');
    });

    it("SVG contains hour grid group", () => {
      expect(html).toContain('id="hourGrid"');
    });
  });

  describe("Season color coding CSS", () => {
    it("CSS has season color classes using accent tokens", () => {
      expect(css).toMatch(/\.season--summer[\s\S]*?--cp-accent-amber/);
      expect(css).toMatch(/\.season--winter[\s\S]*?--cp-accent-ice/);
      expect(css).toMatch(/\.season--spring[\s\S]*?--cp-accent-green/);
      expect(css).toMatch(/\.season--autumn[\s\S]*?--cp-accent-green/);
    });
  });

  describe("Latitude band color differentiation", () => {
    it("equator band uses green accent", () => {
      expect(css).toMatch(/\.stage__lat-band--equator[\s\S]*?--cp-accent-green/);
    });

    it("tropic bands use amber accent", () => {
      expect(css).toMatch(/\.stage__lat-band--tropic[\s\S]*?--cp-accent-amber/);
    });

    it("arctic bands use ice accent", () => {
      expect(css).toMatch(/\.stage__lat-band--arctic[\s\S]*?--cp-accent-ice/);
    });
  });
});
