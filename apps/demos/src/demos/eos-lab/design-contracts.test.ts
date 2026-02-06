import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("EOS Lab -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const mainPath = path.resolve(__dirname, "main.ts");

  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");
  const mainTs = fs.readFileSync(mainPath, "utf-8");

  it("keeps required instrument markers", () => {
    expect(html).toContain('id="cp-demo"');
    expect(html).toContain('id="copyResults"');
    expect(html).toContain('id="status"');
    expect(html).toContain("cp-demo__drawer");
  });

  it("uses viz-first shell layout for controls-stage-readouts", () => {
    expect(html).toContain('data-shell="viz-first"');
    expect(html).toContain("cp-demo__controls");
    expect(html).toContain("cp-demo__stage");
    expect(html).toContain("cp-demo__readouts");
  });

  it("includes starfield canvas and initialization", () => {
    expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    expect(mainTs).toContain("initStarfield");
    expect(mainTs).toMatch(/initStarfield\s*\(/);
  });

  it("imports model physics from @cosmic/physics", () => {
    expect(mainTs).toContain('from "@cosmic/physics"');
    expect(mainTs).toContain("StellarEosModel");
  });

  it("keeps readout unit separation with .cp-readout__unit spans", () => {
    const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
    expect(unitSpans.length).toBeGreaterThanOrEqual(3);
  });

  it("avoids hardcoded color literals in CSS", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    const lines = css.split("\n");
    const literalColorLines = lines.filter((line) => {
      if (line.includes("color-mix(")) return false;
      if (/rgba?\s*\(/.test(line)) return true;
      return /hsla?\s*\(/.test(line);
    });
    expect(literalColorLines).toEqual([]);
  });

  it("keeps radiation LTE framing visible in HTML copy", () => {
    expect(html).toContain("LTE");
    expect(html).toContain("eta_{\\rm rad}");
    expect(mainTs).toContain("radiationDepartureEta");
  });

  it("includes composition controls with computed Z display", () => {
    expect(html).toContain('id="xSlider"');
    expect(html).toContain('id="ySlider"');
    expect(html).toContain('id="zValue"');
    expect(mainTs).toContain("compositionFromXY");
  });

  it("includes regime-map scaffold and rendering hook", () => {
    expect(html).toContain('id="regimeMap"');
    expect(html).toContain('id="regimeGrid"');
    expect(html).toContain('id="regimeCurrentPoint"');
    expect(html).toContain('id="regimeDetail"');
    expect(html).toContain('id="regimeSummary"');
    expect(html).toContain("regime-map__legend");
    expect(mainTs).toContain("renderRegimeMap");
  });

  it("exports advanced diagnostics in copy-results payload", () => {
    expect(mainTs).toContain("x_F=p_F/(m_e c)");
    expect(mainTs).toContain("Fermi relativity regime");
    expect(mainTs).toContain("Sommerfeld factor");
    expect(mainTs).toContain("Neutron extension pressure");
  });

  it("does not claim a zero-T-only degeneracy implementation in deep-dive copy", () => {
    expect(html).not.toContain("v1 uses zero-$T$ electron degeneracy");
    expect(html).toContain("finite-$T$ Fermi-Dirac electrons are included");
  });

  it("caches regime-map field rendering between composition changes", () => {
    expect(mainTs).toContain("regimeMapCacheKey");
    expect(mainTs).toContain("buildRegimeMapField");
  });
});
