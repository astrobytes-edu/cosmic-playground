import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Galaxy Rotation -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const mainPath = path.resolve(__dirname, "main.ts");

  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");
  const main = fs.readFileSync(mainPath, "utf-8");

  it("contains required play markers", () => {
    expect(html).toContain('id="cp-demo"');
    expect(html).toContain('id="copyResults"');
    expect(html).toContain('id="status"');
    expect(html).toContain("cp-demo__drawer");
  });

  it("uses viz-first shell and instrument layer", () => {
    expect(html).toContain('data-shell="viz-first"');
    expect(html).toContain("cp-layer-instrument");
  });

  it("includes starfield canvas and runtime hook", () => {
    expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    expect(main).toContain("initStarfield");
  });

  it("includes required stage surfaces", () => {
    expect(html).toContain('id="galaxyView"');
    expect(html).toContain('id="rotationCanvas"');
    expect(html).toContain('id="insetToggle"');
  });

  it("contains required readout IDs", () => {
    const ids = [
      "radiusValue",
      "vTotalValue",
      "vKeplerianValue",
      "mEnclosedValue",
      "mVisibleValue",
      "mDarkValue",
      "darkVisRatioValue",
      "baryonFracValue",
      "deltaLambda21Value",
      "concValue",
      "rVirValue",
    ];
    for (const id of ids) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("includes utility toolbar + popover links", () => {
    expect(html).toContain("cp-utility-toolbar");
    expect(html).toContain("cp-popover-trigger");
    expect(html).toContain('href="../../exhibits/galaxy-rotation/"');
    expect(html).toContain('href="../../stations/galaxy-rotation/"');
    expect(html).toContain('href="../../instructor/galaxy-rotation/"');
  });

  it("contains challenge controls and copy lock hints", () => {
    expect(html).toContain('id="challengeModeBtn"');
    expect(html).toContain('id="challengePanel"');
    expect(html).toContain('id="copyChallengeEvidence"');
    expect(html).toContain('id="copyLockHint"');
    expect(main).toContain("ChallengeEngine");
  });

  it("loads KaTeX and includes equation content", () => {
    expect(html).toContain("katex.min.css");
    expect(html).toContain("V_{\\rm total}");
    expect(html).toContain("M_{\\rm dark}");
  });

  it("keeps token-first styling", () => {
    expect(css).toContain("stub-demo.css");
    expect(css).toContain("var(--cp-");
  });

  it("includes keyboard shortcut wiring", () => {
    expect(main).toContain("document.addEventListener(\"keydown\"");
    expect(main).toContain("case \"k\"");
    expect(main).toContain("case \"m\"");
    expect(main).toContain("case \"p\"");
    expect(main).toContain("case \"[\"");
    expect(main).toContain("case \"]\"");
    expect(main).toContain("case \"1\"");
    expect(main).toContain("case \"4\"");
  });
});
