import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Hydrostatic Equilibrium Explorer -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const mainPath = path.resolve(__dirname, "main.ts");
  const sharedMathPath = path.resolve(__dirname, "../../shared/mathText.ts");

  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");
  const mainTs = fs.readFileSync(mainPath, "utf-8");
  const sharedMathTs = fs.readFileSync(sharedMathPath, "utf-8");

  it("contains required play markers and canonical shell regions", () => {
    expect(html).toContain('id="cp-demo"');
    expect(html).toContain('id="copyResults"');
    expect(html).toContain('id="status"');
    expect(html).toContain("cp-demo__controls");
    expect(html).toContain("cp-demo__stage");
    expect(html).toContain("cp-demo__readouts");
    expect(html).toContain("cp-demo__drawer cp-drawer");
    expect(html).toContain('data-shell="viz-first"');
    expect(html).toContain("cp-layer-instrument");
  });

  it("includes KaTeX, starfield, tabs, and navigation popover wiring", () => {
    expect(html).toContain("katex.min.css");
    expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('id="tab-explore"');
    expect(html).toContain('id="tab-understand"');
    expect(html).toContain('id="panel-explore"');
    expect(html).toContain('id="panel-understand"');
    expect(html).toContain("cp-popover-trigger");
    expect(html).toContain('href="../../exhibits/hydrostatic-equilibrium-explorer/"');
    expect(html).toContain('href="../../stations/hydrostatic-equilibrium-explorer/"');
    expect(html).toContain('href="../../instructor/hydrostatic-equilibrium-explorer/"');
  });

  it("includes the required hydrostatic stage surfaces", () => {
    expect(html).toContain('id="starShellView"');
    expect(html).toContain('id="profilePlot"');
    expect(html).toContain('id="reasoningLadder"');
    expect(html).toContain('id="shellScopeBadge"');
    expect(html).toContain('id="profileScopeBadge"');
    expect(html).toContain('id="thermalBridgeCard"');
    expect(html).toContain('id="synthesisCard"');
    expect(html).toContain('id="synthesisLocal"');
    expect(html).toContain('id="synthesisGlobal"');
    expect(html).toContain('id="synthesisThermal"');
    expect(html).toContain('id="equationGravityCard"');
    expect(html).toContain('id="equationHydroCard"');
    expect(html).toContain('id="equationPressureScaleCard"');
    expect(html).toContain('id="equationTemperatureCard"');
    expect(html).toContain('id="shellNarrative"');
    expect(html).toContain('id="profileTabGroup"');
  });

  it("includes required control ids and preset buttons", () => {
    const requiredIds = [
      "massSlider",
      "radiusSlider",
      "shellRadiusSlider",
      "muSlider",
      "densityModelUniform",
      "densityModelCentral",
      "supportModeBalanced",
      "supportModeUnder",
      "supportModeOver",
      "modeStudent",
      "modeInstructor",
      "presetSunLike",
      "presetSameMassSmallerRadius",
      "presetMassiveMainSequence",
      "presetCompactToy",
      "presetUnderSupported",
      "presetOverSupported"
    ];

    for (const id of requiredIds) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("routes dynamic math through the shared math-text helper instead of ad-hoc raw rendering", () => {
    expect(sharedMathTs).toContain("renderMathText");
    expect(mainTs).toContain('from "../../shared/mathText"');
    expect(mainTs).not.toContain("renderMath(challengeChoices)");
  });

  it("includes a visible challenge panel with check/next/hint controls", () => {
    expect(html).toContain('id="challengeCard"');
    expect(html).toContain('id="challengePrompt"');
    expect(html).toContain('id="challengeChoices"');
    expect(html).toContain('id="challengeFeedback"');
    expect(html).toContain('id="checkChallenge"');
    expect(html).toContain('id="nextChallenge"');
    expect(html).toContain('id="challengeHint"');
  });

  it("includes accordion pedagogy layers and explicit toy-model limitation copy", () => {
    expect(html).toContain("What to notice");
    expect(html).toContain("Model notes");
    expect(html).toContain("Support is not fusion");
    expect(html).toContain("Derivation sketches");
    expect(html).toContain("toy models");
    expect(html).toContain("pressure gradient");
  });

  it("keeps token-first styling and shared shell imports", () => {
    expect(css).toContain("stub-demo.css");
    expect(css).toContain("var(--cp-");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("initializes runtime helpers and shared physics/model layers", () => {
    expect(mainTs).toContain('from "@cosmic/runtime"');
    expect(mainTs).toContain('from "@cosmic/physics"');
    expect(mainTs).toContain("HydrostaticEquilibriumModel");
    expect(mainTs).toContain("createDemoModes");
    expect(mainTs).toContain("ChallengeEngine");
    expect(mainTs).toContain("initMath");
    expect(mainTs).toContain("initTabs");
    expect(mainTs).toContain("initPopovers");
    expect(mainTs).toContain("initStarfield");
    expect(mainTs).toContain("setLiveRegionText");
  });

  it("keeps every required q('#id') lookup backed by a real element in the HTML", () => {
    const requiredIds = Array.from(mainTs.matchAll(/q<[^>]+>\("#([^"]+)"\)/g), (match) => match[1]);

    for (const id of requiredIds) {
      expect(html).toContain(`id="${id}"`);
    }
  });
});
