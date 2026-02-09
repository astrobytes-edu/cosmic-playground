import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Parallax Distance
 *
 * Invariants:
 *   1. Uses composable shell layout primitives.
 *   2. Preserves two-panel causality pedagogy (cause -> observable).
 *   3. Keeps distance-first + capture-first controls.
 *   4. Maintains axis-aware geometry and detector nodes.
 *   5. Uses inferred readouts (p_hat, d_hat) rather than p-as-input framing.
 *   6. Keeps runtime wiring and token-first CSS constraints.
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
    it("contains explicit cause and observable panel titles", () => {
      expect(html).toContain("Cause: Orbit Geometry (Top View)");
      expect(html).toContain("Observable: Detector/Sky Shift");
    });

    it("contains capture-first causality microcopy", () => {
      expect(html).toContain("Watch the causal chain:");
      expect(html).toContain("Capture two moments to infer parallax.");
      expect(html).toContain("Parallax is not star motion");
    });
  });

  describe("Distance-first controls", () => {
    it("includes distance controls in pc and ly plus distance range", () => {
      expect(html).toContain('id="distancePcInput"');
      expect(html).toContain('id="distanceLyInput"');
      expect(html).toContain('id="distancePcRange"');
    });

    it("includes live orbit + capture controls", () => {
      expect(html).toContain('id="playPauseOrbit"');
      expect(html).toContain('id="captureEpochA"');
      expect(html).toContain('id="captureEpochB"');
      expect(html).toContain('id="swapCaptures"');
      expect(html).toContain('id="clearCaptures"');
      expect(html).toContain('id="orbitPhaseScrub"');
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
    it("includes axis-aware orbit geometry nodes", () => {
      expect(html).toContain('id="orbitPath"');
      expect(html).toContain('id="sun"');
      expect(html).toContain('id="targetDirectionLine"');
      expect(html).toContain('id="parallaxAxisLine"');
      expect(html).toContain('id="earthNow"');
      expect(html).toContain('id="earthCaptureA"');
      expect(html).toContain('id="earthCaptureB"');
      expect(html).toContain('id="rayNow"');
      expect(html).toContain('id="rayCaptureA"');
      expect(html).toContain('id="rayCaptureB"');
      expect(html).toContain('id="baseline"');
    });

    it("includes detector nodes for overlay, difference, and uncertainty", () => {
      expect(html).toContain('id="backgroundStars"');
      expect(html).toContain('id="detectorMeasurementAxis"');
      expect(html).toContain('id="detectorNow"');
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
      expect(unitSpans.length).toBeGreaterThanOrEqual(5);
    });

    it("labels inferred p_hat and inferred d_hat with distance-first framing", () => {
      expect(html).toContain("Measured shift $\\Delta\\theta$");
      expect(html).toContain("Inferred parallax $\\hat p$");
      expect(html).toContain("True distance (set) $d_{\\rm true}$");
      expect(html).toContain("Inferred distance (measured) $\\hat d$");
      expect(html).toContain("Equivalent Jan-Jul shift $2\\hat p$ (derived)");
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
