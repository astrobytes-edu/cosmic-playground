import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(__dirname);
const html = readFileSync(resolve(dir, "index.html"), "utf-8");
const css = readFileSync(resolve(dir, "style.css"), "utf-8");

describe("conservation-laws — Component contracts", () => {
  it("uses cp-chip for preset buttons", () => {
    const chips = html.match(/class="cp-chip preset"/g) || [];
    expect(chips.length).toBeGreaterThanOrEqual(4);
  });

  it("uses cp-chip-group container for presets", () => {
    expect(html).toContain("cp-chip-group");
  });

  it("uses cp-button--ghost for playback controls", () => {
    expect(html).toContain("cp-button--ghost");
  });

  it("uses cp-utility-toolbar for actions", () => {
    expect(html).toContain("cp-utility-toolbar");
  });

  it("has zero cp-action references", () => {
    expect(html).not.toContain("cp-action");
    expect(css).not.toContain("cp-action");
  });
});
