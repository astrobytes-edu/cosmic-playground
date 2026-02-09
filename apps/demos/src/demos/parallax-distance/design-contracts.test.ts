import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Parallax Distance
 *
 * Invariants:
 *   1. Uses composable layout primitives (sidebar, stage, readout strip, drawer)
 *   2. Uses explicit two-panel pedagogy (geometry cause + detector observable)
 *   3. Distance is the primary control; p is inferred in readouts
 *   4. Stage includes orbit-epoch geometry and detector-shift measurement nodes
 *   5. Keeps play-contract markers and runtime initialization hooks
 *   6. CSS remains token-first (no hex literals, no raw rgba() literals)
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

    it("keeps required play contract ids", () => {
      expect(html).toContain('id="cp-demo"');
      expect(html).toContain('id="copyResults"');
      expect(html).toContain('id="status"');
      expect(html).toContain("cp-demo__drawer");
    });

    it("uses tab semantics for pedagogical shelf", () => {
      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');
      expect(html).toContain('role="tabpanel"');
    });
  });

  describe("Two-panel pedagogy", () => {
    it("contains explicit left and right panel titles", () => {
      expect(html).toContain("View from Above (orbit geometry)");
      expect(html).toContain("As Seen on the Sky / Detector (observable shift)");
    });

    it("contains microcopy with causal steps", () => {
      expect(html).toContain("Set a distance, then drag Earth around the orbit.");
      expect(html).toContain("Use blink/overlay and read $2p\\rightarrow p\\rightarrow d$.");
      expect(html).toContain("Parallax is not the star moving - it's the viewing direction changing.");
    });
  });

  describe("Distance-first controls", () => {
    it("includes distance controls in pc and ly plus distance range", () => {
      expect(html).toContain('id="distancePcInput"');
      expect(html).toContain('id="distanceLyInput"');
      expect(html).toContain('id="distancePcRange"');
    });

    it("includes phase presets and orbital phase slider", () => {
      expect(html).toContain('id="phasePresetJan"');
      expect(html).toContain('id="phasePresetApr"');
      expect(html).toContain('id="phasePresetJul"');
      expect(html).toContain('id="phasePresetOct"');
      expect(html).toContain('id="phaseDeg"');
    });

    it("includes baseline, detector-mode, blink, sigma, and exaggeration controls", () => {
      expect(html).toContain('id="showBaseline"');
      expect(html).toContain('id="detectorModeOverlay"');
      expect(html).toContain('id="detectorModeDifference"');
      expect(html).toContain('id="blinkMode"');
      expect(html).toContain('id="sigmaMas"');
      expect(html).toContain('id="exaggeration"');
    });
  });

  describe("Stage geometry and detector nodes", () => {
    it("includes orbit geometry nodes", () => {
      expect(html).toContain('id="orbitPath"');
      expect(html).toContain('id="sun"');
      expect(html).toContain('id="earthEpochAGroup"');
      expect(html).toContain('id="earthEpochA"');
      expect(html).toContain('id="earthEpochB"');
      expect(html).toContain('id="rayEpochA"');
      expect(html).toContain('id="rayEpochB"');
      expect(html).toContain('id="baseline"');
    });

    it("includes detector nodes for overlay, difference, and uncertainty", () => {
      expect(html).toContain('id="backgroundStars"');
      expect(html).toContain('id="detectorMarkerEpochA"');
      expect(html).toContain('id="detectorMarkerEpochB"');
      expect(html).toContain('id="differenceVector"');
      expect(html).toContain('id="errorCircleEpochA"');
      expect(html).toContain('id="errorCircleEpochB"');
      expect(html).toContain('id="scatterEpochA"');
      expect(html).toContain('id="scatterEpochB"');
    });
  });

  describe("Readout units and inference framing", () => {
    it("keeps readout unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(4);
    });

    it("labels inferred p and inferred d instead of p-as-input framing", () => {
      expect(html).toContain("Inferred parallax $p$");
      expect(html).toContain("Inferred distance $d$ in parsecs");
      expect(html).toContain("Inferred distance $d$ in light-years");
    });
  });

  describe("Runtime and architecture compliance", () => {
    it("wires runtime helpers and starfield/tabs/popovers", () => {
      expect(mainTs).toContain("createDemoModes");
      expect(mainTs).toContain("createInstrumentRuntime");
      expect(mainTs).toContain("initStarfield");
      expect(mainTs).toContain("initPopovers");
      expect(mainTs).toContain("initTabs");
    });

    it("imports physics and data packages, not hardcoded formulas in DOM", () => {
      expect(mainTs).toContain('from "@cosmic/physics"');
      expect(mainTs).toContain('from "@cosmic/data-astr101"');
    });
  });

  describe("Token-first color invariants", () => {
    it("contains no legacy token aliases", () => {
      expect(css).not.toContain("--cp-warning");
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
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
});
