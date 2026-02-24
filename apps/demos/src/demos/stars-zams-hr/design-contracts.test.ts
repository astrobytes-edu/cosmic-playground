import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("HR Diagram Inference Lab -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const mainPath = path.resolve(__dirname, "main.ts");

  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");
  const mainTs = fs.readFileSync(mainPath, "utf-8");

  it("includes instrument shell markers and aria labels", () => {
    expect(html).toContain('id="cp-demo"');
    expect(html).toContain("cp-layer-instrument");
    expect(html).toContain('aria-label="HR Diagram Inference Lab instrument"');
  });

  it("includes utility toolbar controls and status live region", () => {
    expect(html).toContain('id="stationMode"');
    expect(html).toContain('id="help"');
    expect(html).toContain('id="copyResults"');
    expect(html).toMatch(/id="status"[^>]*role="status"/);
    expect(html).toMatch(/id="status"[^>]*aria-live="polite"/);
  });

  it("contains required staged-reveal controls", () => {
    expect(html).toContain('id="showRadiusLines"');
    expect(html).toContain('id="revealMassColors"');
    expect(html).toContain('id="massLegend"');
  });

  it("contains evolve-a-star controls and inference log controls", () => {
    expect(html).toContain('id="evolveMass"');
    expect(html).toContain('id="evolveTime"');
    expect(html).toContain('id="claimInput"');
    expect(html).toContain('id="addClaim"');
    expect(html).toContain('id="exportClaims"');
  });

  it("contains plot stage and persistent axis badges", () => {
    expect(html).toContain('id="hrCanvas"');
    expect(html).toContain("Brighter ↑");
    expect(html).toContain("Hotter ←");
  });

  it("keeps plot canvas keyboard-focusable with guidance text", () => {
    expect(html).toMatch(/id="hrCanvas"[^>]*tabindex="0"/);
    expect(html).toMatch(/id="hrCanvas"[^>]*aria-describedby="hrCanvasKeyboardHelp"/);
    expect(html).toContain('id="hrCanvasKeyboardHelp"');
    expect(html).toContain("Use arrow keys to move selection on the plot.");
  });

  it("wires shared runtime hooks", () => {
    expect(mainTs).toContain("createInstrumentRuntime");
    expect(mainTs).toContain("createDemoModes");
    expect(mainTs).toContain("initStarfield");
    expect(mainTs).toContain("initPopovers");
    expect(mainTs).toContain("initTabs");
  });

  it("imports physics model from @cosmic/physics", () => {
    expect(mainTs).toContain('from "@cosmic/physics"');
    expect(mainTs).toContain("HrInferencePopulationModel");
    expect(mainTs).toContain("ZamsTout1996Model");
  });

  it("does not use synthetic population generation to project evolve-track coordinates", () => {
    expect(mainTs).not.toContain("seed: `track-");
    expect(mainTs).not.toContain("N: 1");
  });

  it("keeps token-first styling and avoids hardcoded hex colors", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).toContain("var(--cp-");
  });
});
