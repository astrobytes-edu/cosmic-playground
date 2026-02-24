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

  it("includes playbar transport controls", () => {
    expect(html).toContain("cp-playbar");
    expect(html).toContain('id="btn-play"');
    expect(html).toContain('id="btn-pause"');
    expect(html).toContain('id="btn-step-back"');
    expect(html).toContain('id="btn-step-forward"');
    expect(html).toContain('id="btn-reset"');
    expect(html).toContain('id="speed-select"');
  });

  it("primary sliders expose tooltip readout hooks", () => {
    expect(html).toContain('id="haloMassSlider"');
    expect(html).toContain('id="radiusSlider"');
    expect(html).toContain('data-tooltip-source="#haloMassSliderValue"');
    expect(html).toContain('data-tooltip-source="#radiusSliderValue"');
  });

  it("defines at least three challenge scenarios", () => {
    const challengeArrays = Array.from(
      main.matchAll(/const\s+\w+\s*:\s*Challenge\[\]\s*=\s*\[(.*?)\];/gs),
    );
    const promptCount = challengeArrays.reduce((count, section) => {
      const prompts = section[1].match(/prompt:\s*"/g) || [];
      return count + prompts.length;
    }, 0);
    expect(promptCount).toBeGreaterThanOrEqual(3);
  });

  it("wires reduced-motion guard", () => {
    expect(main).toContain("prefers-reduced-motion");
    expect(main).toContain("matchMedia");
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

  // ── Structural contracts (aligned with golden reference) ──

  describe("Drawer accordion structure", () => {
    it("drawer uses cp-drawer class, not cp-panel", () => {
      expect(html).toContain("cp-demo__drawer cp-drawer");
      expect(html).not.toMatch(/cp-demo__drawer[^"]*cp-panel/);
    });

    it("drawer contains What to notice accordion", () => {
      expect(html).toContain("What to notice");
    });

    it("drawer contains Model notes accordion", () => {
      expect(html).toContain("Model notes");
    });

    it("has cross-reference links in Explore further accordion", () => {
      expect(html).toContain("Explore further");
      expect(html).toContain('href="../doppler-shift/"');
      expect(html).toContain('href="../spectral-lines/"');
    });
  });

  describe("Readout markup normalization", () => {
    it("readouts use cp-readout__value wrapper divs", () => {
      const valueWrappers = html.match(/class="cp-readout__value"/g) || [];
      expect(valueWrappers.length).toBeGreaterThanOrEqual(11);
    });

    it("readouts live in cp-demo__readouts region", () => {
      expect(html).toContain("cp-demo__readouts");
    });

    it("readouts have unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(11);
    });
  });

  describe("Misconception callout", () => {
    it("has dark matter vs dark energy misconception callout", () => {
      expect(html).toContain("misconception-callout");
      expect(html).toContain("dark energy");
    });
  });

  describe("CSS does not use custom drawer overrides", () => {
    it("CSS does not contain .cp-demo__drawer with border-top", () => {
      expect(css).not.toMatch(/\.cp-demo__drawer[\s\S]*?border-top/);
    });
  });
});
