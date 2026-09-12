import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const STYLES = join(import.meta.dirname, "..", "styles");
const shell = readFileSync(join(STYLES, "demo-shell.css"), "utf8");
const instrument = readFileSync(join(STYLES, "layer-instrument.css"), "utf8");

/** Declarations of the first rule written exactly as `selector {`, searching from `from`. "" if absent. */
function ruleBody(css: string, selector: string, from = 0): string {
  const at = css.indexOf(`${selector} {`, from);
  if (at < 0) return "";
  const open = css.indexOf("{", at);
  return css.slice(open + 1, css.indexOf("}", open));
}

describe("orbit shell (design section 4)", () => {
  it("puts the stage and dock in the left column and the instrument on the right", () => {
    const body = ruleBody(shell, '.cp-demo[data-shell="orbit"]');
    expect(body).toMatch(/"viz\s+readouts"/);
    expect(body).toMatch(/"sidebar\s+readouts"/);
    expect(body).toMatch(/"shelf\s+shelf"/);
    expect(body).toContain("minmax(0, 1fr)");
  });

  it("stacks stage, instrument, dock and drawer at 1024px and below, after the generic mobile rule", () => {
    const generic = shell.indexOf("@media (max-width: 1024px)");
    const orbitMobile = shell.indexOf("@media (max-width: 1024px)", generic + 1);
    expect(orbitMobile).toBeGreaterThan(generic);
    expect(ruleBody(shell, '.cp-demo[data-shell="orbit"]', orbitMobile)).toMatch(/"viz"\s+"readouts"\s+"sidebar"\s+"shelf"/);
  });

  it("stops the dock from being a sticky, height-capped sidebar", () => {
    const body = ruleBody(shell, '.cp-demo[data-shell="orbit"] .cp-demo__controls');
    expect(body).toContain("position: relative");
    expect(body).toContain("max-height: none");
  });

  it("paints glass panels from tokens only", () => {
    const body = ruleBody(instrument, '.cp-layer-instrument[data-shell="orbit"] .cp-panel');
    expect(body).toContain("var(--cp-instr-glass-bg)");
    expect(body).toContain("blur(var(--cp-instr-glass-blur))");
    expect(body).toContain("-webkit-backdrop-filter: blur(var(--cp-instr-glass-blur))");
    expect(body).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it("sets panel headers and readout labels in sentence case", () => {
    expect(ruleBody(instrument, '.cp-layer-instrument[data-shell="orbit"] .cp-panel-header')).toContain("text-transform: none");
    expect(ruleBody(instrument, '.cp-layer-instrument[data-shell="orbit"] .cp-readout__label')).toContain("text-transform: none");
  });
});
