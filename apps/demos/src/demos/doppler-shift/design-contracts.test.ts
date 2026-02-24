import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Doppler Shift -- Design System Contracts", () => {
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

  it("includes starfield canvas", () => {
    expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    expect(main).toContain("initStarfield");
  });

  it("has wave and spectrum visual elements", () => {
    expect(html).toContain('id="waveDiagram"');
    expect(html).toContain('id="spectrumCanvas"');
  });

  it("readouts use separate unit spans", () => {
    const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
    expect(unitSpans.length).toBeGreaterThanOrEqual(6);
  });

  it("includes utility toolbar + popover links", () => {
    expect(html).toContain("cp-utility-toolbar");
    expect(html).toContain("cp-popover-trigger");
    expect(html).toContain('href="../../exhibits/doppler-shift/"');
    expect(html).toContain('href="../../stations/doppler-shift/"');
    expect(html).toContain('href="../../instructor/doppler-shift/"');
  });

  it("contains mystery controls and copy-lock hint", () => {
    expect(html).toContain('id="mysterySpectrumBtn"');
    expect(html).toContain('id="mysteryPanel"');
    expect(html).toContain('id="copyChallengeEvidence"');
    expect(html).toContain('id="copyLockHint"');
    expect(html).toContain('id="formulaLimitIndicator"');
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
    expect(html).toContain('id="velocitySlider"');
    expect(html).toContain('id="redshiftSlider"');
    expect(html).toContain('data-tooltip-source="#velocityValue"');
    expect(html).toContain('data-tooltip-source="#redshiftValue"');
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

  it("contains redshift regime markers and representative-line helper affordances", () => {
    expect(html).toContain('id="redshiftRegimeTrack"');
    expect(html).toContain('id="regimeMarkerBlue"');
    expect(html).toContain('id="regimeMarkerRed"');
    expect(html).toContain('id="regimeMarkerCaption"');
    expect(html).toContain('id="repLineRuleChip"');
    expect(html).toContain('id="repLineRuleNote"');
  });

  it("loads KaTeX and includes equation content", () => {
    expect(html).toContain("katex.min.css");
    expect(html).toContain("lambda_{\\rm obs}");
    expect(html).toContain("beta");
  });

  it("keeps token-first styling", () => {
    expect(css).toContain("stub-demo.css");
    expect(css).toContain("var(--cp-");
  });

  it("includes entry animations", () => {
    expect(css).toMatch(/\.cp-demo__controls[\s\S]*cp-slide-up/);
    expect(css).toMatch(/\.cp-demo__stage[\s\S]*cp-fade-in/);
  });

  it("preserves hidden semantics for comparison readouts", () => {
    expect(css).toContain(".comparison-readouts[hidden]");
    expect(css).toContain("display: none;");
  });

  it("wires runtime helpers", () => {
    expect(main).toContain("createDemoModes");
    expect(main).toContain("buildDopplerExportPayload");
    expect(main).toContain("buildChallengeEvidenceText");
    expect(main).toContain("copyTextToClipboard");
    expect(main).toContain(".copyResults(");
  });
});
