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
    expect(mainTs).toContain("radiationDepartureEta");
  });
});
