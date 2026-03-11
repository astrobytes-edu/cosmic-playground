import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Binary Orbits
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

const demoDir = __dirname;
const htmlPath = path.resolve(demoDir, "index.html");
const cssPath = path.resolve(demoDir, "style.css");
const mainPath = path.resolve(demoDir, "main.ts");

const html = fs.readFileSync(htmlPath, "utf-8");
const css = fs.readFileSync(cssPath, "utf-8");
const main = fs.readFileSync(mainPath, "utf-8");

describe("Binary Orbits -- Design System Contracts", () => {
  // -- Starfield ----------------------------------------------------------
  describe("Starfield contract", () => {
    it("HTML contains a starfield canvas element", () => {
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });

    it("main.ts imports and calls initStarfield", () => {
      expect(main).toContain("initStarfield");
      expect(main).toMatch(/initStarfield\s*\(/);
    });
  });

  // -- Readout unit separation --------------------------------------------
  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(6);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:AU|yr|years)\)/.test(l));
      expect(parenthesizedUnits.length).toBe(0);
    });
  });

  // -- No legacy token leakage --------------------------------------------
  describe("No legacy tokens", () => {
    it("CSS has no --cp-warning, --cp-accent2, --cp-accent3", () => {
      expect(css).not.toContain("--cp-warning");
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
    });

    it("HTML has no legacy tokens", () => {
      expect(html).not.toContain("--cp-accent2");
      expect(html).not.toContain("--cp-accent3");
      expect(html).not.toContain("--cp-warning");
    });

    it("main.ts has no legacy tokens", () => {
      expect(main).not.toContain("--cp-accent2");
      expect(main).not.toContain("--cp-accent3");
    });
  });

  // -- Entry animations ---------------------------------------------------
  describe("Entry animations", () => {
    it("controls have entry animation", () => {
      expect(css).toMatch(/\.cp-demo__controls[\s\S]*?animation.*cp-slide-up/);
    });

    it("stage has entry animation", () => {
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation.*cp-fade-in/);
    });

    it("drawer has entry animation", () => {
      expect(css).toMatch(/\.cp-demo__drawer[\s\S]*?animation.*cp-fade-in/);
    });
  });

  // -- No color literals --------------------------------------------------
  describe("No color literals in CSS", () => {
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

  // -- Architecture compliance --------------------------------------------
  describe("Architecture compliance", () => {
    it("main.ts imports physics from @cosmic/physics", () => {
      expect(main).toMatch(/from\s+["']@cosmic\/physics["']/);
    });

    it("main.ts imports from ./logic (humble object pattern)", () => {
      expect(main).toMatch(/from\s+["'].\/logic["']/);
    });

    it("canvas stage uses design-system tokens for background", () => {
      expect(css).toMatch(/#orbitCanvas[\s\S]*?background[\s\S]*?var\(--cp-/);
    });

    it("no inline physics equations in main.ts", () => {
      // computeModel and formatNumber should come from logic.ts
      expect(main).not.toMatch(/function\s+computeModel/);
      expect(main).not.toMatch(/function\s+formatNumber/);
    });
  });

  // -- Instrument layer ---------------------------------------------------
  describe("Instrument layer", () => {
    it("HTML has cp-layer-instrument on demo root", () => {
      expect(html).toContain("cp-layer-instrument");
    });

    it("readouts panel exists with aria-label", () => {
      expect(html).toMatch(/class="[^"]*cp-demo__readouts/);
      expect(html).toMatch(/aria-label="Readouts panel"/);
    });

    it("contains prediction gate, persistent outcome, invariant check, and RV panel", () => {
      expect(html).toContain("id=\"predictPanel\"");
      expect(html).toContain("id=\"predictionOutcome\"");
      expect(html).toContain("id=\"invariantCheck\"");
      expect(html).toContain("id=\"rvPanel\"");
      expect(html).toContain("id=\"rvCanvas\"");
      expect(html).toContain("id=\"spectrumPanel\"");
      expect(html).toContain("id=\"spectrumCanvas\"");
      expect(html).toContain("id=\"energyPanel\"");
      expect(html).toContain("id=\"energyCanvas\"");
      expect(html).toContain("id=\"rvChallengePanel\"");
    });

    it("stage view uses radiogroup + radio semantics", () => {
      expect(html).toContain("aria-label=\"Stage view\"");
      expect(html).toContain("id=\"viewOrbit\"");
      expect(html).toContain("id=\"viewRv\"");
      expect(html).toContain("id=\"viewSpectrum\"");
      expect(html).toContain("id=\"viewEnergy\"");
      expect(html).toMatch(/id="viewOrbit"[^>]*role="radio"/);
      expect(html).toMatch(/id="viewRv"[^>]*role="radio"/);
      expect(html).toMatch(/id="viewSpectrum"[^>]*role="radio"/);
      expect(html).toMatch(/id="viewEnergy"[^>]*role="radio"/);
    });

    it("includes spectroscopy controls and mass-inference readouts", () => {
      expect(html).toContain("id=\"spectroscopySb2\"");
      expect(html).toContain("id=\"spectroscopySb1\"");
      expect(html).toContain("id=\"elementH\"");
      expect(html).toContain("id=\"elementNa\"");
      expect(html).toContain("id=\"elementCa\"");
      expect(html).toContain("id=\"m1SiniValue\"");
      expect(html).toContain("id=\"m2SiniValue\"");
      expect(html).toContain("id=\"massFuncValue\"");
      expect(html).toContain("id=\"vsysValue\"");
    });
  });

  // -- Component contracts ------------------------------------------------
  describe("Component contracts", () => {
    it("uses cp-utility-toolbar for actions", () => {
      expect(html).toContain("cp-utility-toolbar");
    });

    it("has zero cp-action references in HTML and CSS", () => {
      expect(html).not.toContain("cp-action");
      expect(css).not.toContain("cp-action");
    });

    it("toolbar buttons use cp-utility-btn", () => {
      const utilityBtns = html.match(/class="cp-utility-btn"/g) || [];
      expect(utilityBtns.length).toBeGreaterThanOrEqual(3);
    });
  });

  // -- Panel translucency -------------------------------------------------
  describe("Panel translucency", () => {
    it("canvas background uses token-based radial-gradient", () => {
      expect(css).toMatch(/radial-gradient[\s\S]*?var\(--cp-/);
    });

    it("CSS does not override panel backgrounds with opaque colors", () => {
      expect(css).not.toMatch(/background:\s*(#|rgb|hsl)/);
    });
  });

  describe("SoTA hardening contracts", () => {
    it("includes reduced-motion media override", () => {
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    });

    it("includes invariant distractor controls", () => {
      expect(html).toContain("id=\"invariantEqualOffsets\"");
      expect(html).toContain("id=\"invariantEqualRv\"");
    });

    it("uses vector-explicit momentum language", () => {
      expect(html).toContain("Linear momentum magnitude check");
      expect(main).toContain("Net momentum vector = 0 in barycentric frame (equal and opposite momenta).");
    });

    it("contains RV challenge controls and lock hint text", () => {
      expect(html).toContain("id=\"rvChallengeStart\"");
      expect(html).toContain("id=\"rvChallengeClear\"");
      expect(html).toContain("id=\"rvChallengeReveal\"");
      expect(html).toContain("id=\"rvChallengeEnd\"");
      expect(html).toContain("id=\"rvChallengeLockHint\"");
      expect(html).toContain("Copy Results and station snapshots are locked");
    });

    it("explicitly honors hidden state for stage panels", () => {
      expect(css).toContain(".rv-panel[hidden]");
      expect(css).toContain("#orbitCanvas[hidden]");
      expect(css).toContain("#spectrumCanvas[hidden]");
      expect(css).toContain("display: none !important;");
    });

    it("help and export pathways mention spectroscopy and minimum-mass inference", () => {
      expect(main).toContain("Spectrum view maps those RVs onto Doppler-shifted absorption lines");
      expect(main).toContain("BinaryOrbitModel.massFunctionSolar");
      expect(main).toContain("BinaryOrbitModel.minimumMassesSolar");
    });
  });
});
