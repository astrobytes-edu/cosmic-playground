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

  it("includes pressure curve plot with uPlot on log-log axes", () => {
    expect(html).toContain('id="pressureCurvePlot"');
    expect(mainTs).toContain("createEosPlot");
    expect(mainTs).toContain("distr: 3"); // log scale
    expect(mainTs).toContain("pressureCurveData");
  });

  it("includes regime-map as Canvas 2D with legend and detail text", () => {
    expect(html).toContain('id="regimeMapCanvas"');
    expect(html).toMatch(/<canvas[^>]*id="regimeMapCanvas"/);
    expect(html).toContain('id="regimeDetail"');
    expect(html).toContain('id="regimeSummary"');
    expect(html).toContain("regime-map__legend");
    expect(html).toContain("<i>P</i><sub>gas</sub> dominant");
    expect(mainTs).toContain("renderRegimeMap");
    expect(mainTs).toContain("invalidateRegimeGrid");
  });

  it("uses Canvas 2D regime map with grid caching", () => {
    const regimeMapTs = fs.readFileSync(path.resolve(__dirname, "regimeMap.ts"), "utf-8");
    expect(regimeMapTs).toContain("renderRegimeMap");
    expect(regimeMapTs).toContain("invalidateRegimeGrid");
    expect(regimeMapTs).toContain("evaluateRegimeGrid");
  });

  it("renders diagnostic inequalities with LaTeX formatting", () => {
    expect(html).toContain("$m_u$");
    expect(mainTs).toContain("x_F \\\\ll 1");
    expect(mainTs).toContain("T/T_F \\\\ll 1");
    expect(mainTs).toContain("renderMathIfChanged(degRegimeValue)");
    expect(mainTs).toContain("renderMathIfChanged(fermiRegimeValue)");
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

  it("includes three-column comparison view on Tab 2", () => {
    expect(html).toContain('id="colGas"');
    expect(html).toContain('id="colRadiation"');
    expect(html).toContain('id="colDegeneracy"');
    expect(html).toContain("compare-column__canvas");
    expect(html).toContain("compare-column__equation");
    expect(html).toContain("compare-grid");
  });

  it("imports mechanism animation classes", () => {
    expect(mainTs).toContain("GasPressureAnimation");
    expect(mainTs).toContain("RadiationPressureAnimation");
    expect(mainTs).toContain("DegeneracyPressureAnimation");
  });

  it("uses equation formatters and scaling challenges from logic module", () => {
    expect(mainTs).toContain("gasEquationLatex");
    expect(mainTs).toContain("radEquationLatex");
    expect(mainTs).toContain("degEquationLatex");
    expect(mainTs).toContain("SCALING_CHALLENGES");
    expect(mainTs).toContain("checkScalingAnswer");
  });

  it("includes shared controls and presets on Tab 2", () => {
    expect(html).toContain('id="compareT"');
    expect(html).toContain('id="compareRho"');
    expect(html).toContain('id="compareX"');
    expect(html).toContain('id="compareY"');
    expect(html).toContain("compare-preset");
    expect(mainTs).toContain("syncCompareSliders");
  });

  it("does not import Plotly anywhere", () => {
    expect(mainTs).not.toContain("plotly");
    expect(mainTs).not.toContain("mountPlot");
    expect(mainTs).not.toContain("PlotSpec");
  });

  it("uses two-tab layout with WAI-ARIA tab markup", () => {
    expect(html).toContain('role="tablist"');
    const tabButtons = html.match(/role="tab"/g) || [];
    expect(tabButtons.length).toBe(2);
    expect(html).toContain('id="tab-explore"');
    expect(html).toContain('id="tab-understand"');
    expect(html).toContain('id="panel-explore"');
    expect(html).toContain('id="panel-understand"');
    const tabPanels = html.match(/role="tabpanel"/g) || [];
    expect(tabPanels.length).toBe(2);
  });

  it("initializes tabs via initTabs from runtime", () => {
    expect(mainTs).toContain("initTabs");
    expect(mainTs).toMatch(/initTabs\s*\(/);
  });

  it("includes entry animations on shell sections", () => {
    expect(css).toContain("cp-slide-up");
    expect(css).toContain("cp-fade-in");
    expect(css).toMatch(/\.cp-demo__controls\s*\{[^}]*animation/);
    expect(css).toMatch(/\.cp-demo__readouts\s*\{[^}]*animation/);
  });

  it("constrains chart containers with aspect-ratio instead of unbounded min-height", () => {
    expect(css).toMatch(/\.pressure-plot__surface\s*\{[^}]*aspect-ratio/);
    expect(css).toMatch(/\.regime-map__surface\s*\{[^}]*aspect-ratio/);
    expect(css).toMatch(/\.compare-column__canvas\s*\{[^}]*aspect-ratio/);
    // Verify no unbounded 24rem min-height remains
    expect(css).not.toMatch(/min-height:\s*24rem/);
  });

  it("includes Scaling Law Detective challenge on Tab 2", () => {
    expect(html).toContain('id="scalingChallenge"');
    expect(html).toContain("scaling-detective");
    expect(html).toContain("Scaling Law Detective");
    // main.ts wires the challenge UI
    expect(mainTs).toContain("renderChallenge");
    expect(mainTs).toContain("SCALING_CHALLENGES");
  });

  /* ──────────────────────────────────────────────────
   * Phase 3 feature contracts (regression protection)
   * ────────────────────────────────────────────────── */

  it("includes pedagogical bridge captions on Tab 2 animation columns", () => {
    expect(html).toContain("compare-column__caption");
    // Each of the 3 columns should have a caption
    const captions = html.match(/compare-column__caption/g) || [];
    expect(captions.length).toBeGreaterThanOrEqual(3);
    // Captions contain actual pedagogical content (not empty)
    expect(html).toMatch(/compare-column__caption[^<]*>[^<]+momentum/);
    expect(html).toMatch(/compare-column__caption[^<]*>[^<]+T\^4/);
    expect(html).toMatch(/compare-column__caption[^<]*>[^<]+Pauli/);
  });

  it("makes equation toggle accessible with keyboard and ARIA", () => {
    // All three equation divs need tabindex, role, and aria-label
    const eqIds = ["compareGasEq", "compareRadEq", "compareDegEq"];
    for (const id of eqIds) {
      const pattern = new RegExp(`id="${id}"[^>]*tabindex="0"[^>]*role="button"[^>]*aria-label=`);
      expect(html).toMatch(pattern);
    }
  });

  it("includes dominance-switch pulse animation in CSS and JS wiring", () => {
    expect(css).toContain("@keyframes dominance-pulse");
    expect(css).toContain(".pressure-card.is-newly-dominant");
    expect(mainTs).toContain("is-newly-dominant");
    expect(mainTs).toContain("prevDominantChannel");
  });

  it("styles preset buttons with :focus-visible for keyboard navigation", () => {
    expect(css).toMatch(/\.preset:focus-visible/);
  });

  it("dims radiation card when LTE closure is questionable", () => {
    expect(css).toMatch(/\[data-lte="caution"\]/);
    expect(css).toMatch(/opacity:\s*0\.55/);
    expect(mainTs).toContain('dataset.lte');
  });

  it("uses progressive disclosure with nested model notes accordion", () => {
    expect(html).toContain("cp-accordion--nested");
    expect(html).toContain("Technical details");
    expect(html).toContain("model-notes__simple");
    // Beginner summary should mention all three channels
    expect(html).toMatch(/model-notes__simple[\s\S]*Gas pressure/);
    expect(html).toMatch(/model-notes__simple[\s\S]*Radiation pressure/);
    expect(html).toMatch(/model-notes__simple[\s\S]*Degeneracy pressure/);
  });

  it("guided tour covers Tab 2 with tab-switching support", () => {
    // Tour should have 4 steps (including one that switches to Tab 2)
    expect(mainTs).toContain("switchTab");
    expect(mainTs).toContain('switchTab: "understand"');
    expect(mainTs).toContain("scaling-detective");
  });

  it("includes tour replay button and localStorage persistence", () => {
    expect(html).toContain('id="startTour"');
    expect(mainTs).toContain("eos-lab-toured");
    expect(mainTs).toContain("localStorage");
  });

  it("includes contextual suggestion in stage summary wired from logic", () => {
    expect(html).toContain('id="trySuggestion"');
    expect(html).toContain("stage-summary__suggestion");
    expect(mainTs).toContain("getContextualSuggestion");
    expect(mainTs).toContain("trySuggestion");
  });

  /* ──────────────────────────────────────────────────
   * Component system contracts (cp-chip, cp-toggle)
   * ────────────────────────────────────────────────── */

  it("uses cp-chip for sidebar preset buttons (not cp-button)", () => {
    // Sidebar presets should be chips, not rectangular buttons
    const sidebarPresets = html.match(/class="cp-chip preset"/g) || [];
    expect(sidebarPresets.length).toBeGreaterThanOrEqual(6);
    // Must NOT use cp-button--outline for presets
    expect(html).not.toMatch(/preset[^"]*cp-button--outline/);
  });

  it("uses cp-chip for Tab 2 compare-preset buttons", () => {
    const comparePresets = html.match(/class="cp-chip preset compare-preset"/g) || [];
    expect(comparePresets.length).toBeGreaterThanOrEqual(6);
  });

  it("uses cp-chip-group containers for preset grids", () => {
    expect(html).toContain("cp-chip-group--grid");
    expect(html).toContain("cp-chip-group");
  });

  it("uses cp-toggle for solar profile checkbox", () => {
    expect(html).toMatch(/class="cp-toggle"[\s\S]*?id="showSolarProfile"/);
    // Must NOT use demo-specific overlay-toggle class
    expect(html).not.toContain("regime-map__overlay-toggle");
  });

  it("has zero cp-action references in HTML and main.ts", () => {
    expect(html).not.toContain("cp-action");
    expect(mainTs).not.toContain("cp-action");
  });
});
