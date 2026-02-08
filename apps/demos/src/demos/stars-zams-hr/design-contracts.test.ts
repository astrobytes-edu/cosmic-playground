import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Stars ZAMS HR -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Instrument shell contract", () => {
    it("includes instrument root markers", () => {
      expect(html).toContain('id="cp-demo"');
      expect(html).toContain("cp-layer-instrument");
      expect(html).toContain('aria-label="Stars ZAMS and HR instrument"');
    });

    it("contains required export controls", () => {
      expect(html).toContain('id="copyResults"');
      expect(html).toContain('id="status"');
      expect(html).toMatch(/id="status"[^>]*role="status"/);
      expect(html).toMatch(/id="status"[^>]*aria-live="polite"/);
      expect(html).toMatch(/id="status"[^>]*aria-atomic="true"/);
    });
  });

  describe("Starfield and runtime wiring", () => {
    it("contains a starfield canvas element", () => {
      expect(html).toContain('class="cp-starfield"');
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });

    it("main.ts initializes shared runtime hooks", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain("initStarfield");
      expect(mainTs).toMatch(/initStarfield\s*\(/);
      expect(mainTs).toContain("initPopovers");
      expect(mainTs).toMatch(/initPopovers\s*\(/);
      expect(mainTs).toContain("createDemoModes");
      expect(mainTs).toContain("createInstrumentRuntime");
    });
  });

  describe("Model architecture contract", () => {
    it("imports physics from @cosmic/physics", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain('from "@cosmic/physics"');
      expect(mainTs).toContain("ZamsTout1996Model");
    });

    it("does not hardcode model equations inline", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).not.toMatch(/function\s+tout/i);
      expect(mainTs).not.toMatch(/M\*\*11/);
    });
  });

  describe("Readout and controls contract", () => {
    it("readout values with units use cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(4);
    });

    it("preset buttons use cp-chip and aria-pressed", () => {
      const presetChips = html.match(/class="cp-chip preset"/g) || [];
      expect(presetChips.length).toBeGreaterThanOrEqual(8);
      const chipButtons = html.match(/<button[^>]*class="[^"]*cp-chip[^"]*"[^>]*>/g) || [];
      const missing = chipButtons.filter((tag) => !tag.includes("aria-pressed"));
      expect(missing).toEqual([]);
    });

    it("contains the H-R canvas stage element", () => {
      expect(html).toContain('id="hrCanvas"');
      expect(html).toMatch(/<canvas[^>]*id="hrCanvas"/);
    });
  });

  describe("Token-only styling contract", () => {
    it("has no legacy token aliases", () => {
      expect(css).not.toContain("--cp-warning");
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
    });

    it("has no hardcoded hex colors", () => {
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    });

    it("has no hardcoded rgba()/rgb() outside color-mix", () => {
      const lines = css.split("\n");
      const violations = lines.filter((line) => {
        if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return false;
        if (/(rgba?|hsla?)\s*\(/.test(line) && !line.includes("color-mix")) return true;
        return false;
      });
      expect(violations).toEqual([]);
    });
  });

  describe("Entry animation contract", () => {
    it("animates controls, stage, and drawer sections", () => {
      expect(css).toMatch(/\.cp-demo__controls[\s\S]*?animation.*cp-slide-up/);
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation.*cp-fade-in/);
      expect(css).toMatch(/\.cp-demo__drawer[\s\S]*?animation.*cp-fade-in/);
    });
  });
});
