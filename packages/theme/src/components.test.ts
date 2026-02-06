import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const componentsDir = path.resolve(__dirname, "../styles/components");

function readComponent(name: string): string {
  return fs.readFileSync(path.join(componentsDir, name), "utf-8");
}

/** Check that CSS contains no hardcoded hex color literals (except inside comments). */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function assertNoColorLiterals(css: string, filename: string): void {
  const clean = stripComments(css);
  // Allow rgba() only in scroll-shadow (background-attachment trick needs it)
  if (filename !== "scroll-shadow.css") {
    const hexMatches = clean.match(/#[0-9a-f]{3,8}\b/gi);
    if (hexMatches) {
      throw new Error(
        `${filename} contains hardcoded hex colors: ${hexMatches.join(", ")}. Use var(--cp-*) tokens instead.`
      );
    }
  }
}

describe("Component CSS — Popover", () => {
  const css = readComponent("popover.css");

  it("defines .cp-popover-anchor selector", () => {
    expect(css).toContain(".cp-popover-anchor");
  });

  it("defines .cp-popover selector", () => {
    expect(css).toContain(".cp-popover {");
  });

  it("uses z-index token", () => {
    expect(css).toContain("var(--cp-z-dropdown)");
  });

  it("uses panel background token", () => {
    expect(css).toContain("var(--cp-instr-panel-bg");
  });

  it("uses backdrop-filter with webkit prefix", () => {
    expect(css).toContain("backdrop-filter: blur(");
    expect(css).toContain("-webkit-backdrop-filter: blur(");
  });

  it("uses elevation shadow token", () => {
    expect(css).toContain("var(--cp-elevation-3)");
  });

  it("uses cp-pop-in animation", () => {
    expect(css).toContain("cp-pop-in");
  });

  it("hides with [hidden] attribute", () => {
    expect(css).toContain(".cp-popover[hidden]");
  });

  it("defines .cp-popover__body with overflow", () => {
    expect(css).toContain(".cp-popover__body");
    expect(css).toContain("overflow: auto");
  });

  it("uses token-based border radius", () => {
    expect(css).toContain("var(--cp-r-2)");
  });

  it("contains no hardcoded color literals", () => {
    assertNoColorLiterals(css, "popover.css");
  });
});

describe("Component CSS — Tabs", () => {
  const css = readComponent("tabs.css");

  it("defines .cp-tabs tablist", () => {
    expect(css).toContain(".cp-tabs {");
  });

  it("defines .cp-tab with transparent background", () => {
    expect(css).toContain(".cp-tab {");
    expect(css).toContain("background: transparent");
  });

  it("defines active state via aria-selected", () => {
    expect(css).toContain('[aria-selected="true"]');
  });

  it("uses accent token for active tab", () => {
    expect(css).toContain("var(--cp-accent)");
  });

  it("defines .cp-tab-panel with hidden support", () => {
    expect(css).toContain(".cp-tab-panel[hidden]");
  });

  it("uses transition tokens", () => {
    expect(css).toContain("var(--cp-transition-fast)");
  });

  it("uses font tokens", () => {
    expect(css).toContain("var(--cp-text-sm)");
    expect(css).toContain("var(--cp-font-semibold)");
  });

  it("includes focus-visible outline", () => {
    expect(css).toContain(":focus-visible");
  });

  it("contains no hardcoded color literals", () => {
    assertNoColorLiterals(css, "tabs.css");
  });
});

describe("Component CSS — Playbar", () => {
  const css = readComponent("playbar.css");

  it("defines .cp-playbar with grid-area: playbar", () => {
    expect(css).toContain("grid-area: playbar");
  });

  it("uses panel background token", () => {
    expect(css).toContain("var(--cp-instr-panel-bg");
  });

  it("uses backdrop-filter with webkit prefix", () => {
    expect(css).toContain("backdrop-filter: blur(");
    expect(css).toContain("-webkit-backdrop-filter: blur(");
  });

  it("defines transport buttons with 44px touch target", () => {
    expect(css).toContain(".cp-playbar__btn");
    expect(css).toContain("min-height: 44px");
  });

  it("defines timeline range input with flex", () => {
    expect(css).toContain(".cp-playbar__timeline");
    expect(css).toContain("flex: 1");
  });

  it("defines phase readout with monospace font", () => {
    expect(css).toContain("var(--cp-font-mono)");
  });

  it("includes disabled state styling", () => {
    expect(css).toContain(".cp-playbar__btn:disabled");
  });

  it("contains no hardcoded color literals", () => {
    assertNoColorLiterals(css, "playbar.css");
  });
});

describe("Component CSS — Bottom Sheet", () => {
  const css = readComponent("bottom-sheet.css");

  it("defines .cp-bottom-sheet as fixed position", () => {
    expect(css).toContain("position: fixed");
  });

  it("uses z-index token", () => {
    expect(css).toContain("var(--cp-z-sticky)");
  });

  it("defines three snap states via data-snap", () => {
    expect(css).toContain('[data-snap="collapsed"]');
    expect(css).toContain('[data-snap="half"]');
    expect(css).toContain('[data-snap="full"]');
  });

  it("uses transform for snap positions (CSS owns geometry)", () => {
    expect(css).toContain("translateY(calc(100% - 10svh))");
    expect(css).toContain("translateY(50%)");
    expect(css).toContain("translateY(10%)");
  });

  it("uses panel background token", () => {
    expect(css).toContain("var(--cp-instr-panel-bg");
  });

  it("uses backdrop-filter with webkit prefix", () => {
    expect(css).toContain("backdrop-filter: blur(");
    expect(css).toContain("-webkit-backdrop-filter: blur(");
  });

  it("defines drag handle with touch-action: none", () => {
    expect(css).toContain("touch-action: none");
  });

  it("hides on desktop (>= 1024px)", () => {
    expect(css).toContain("min-width: 1024px");
    expect(css).toMatch(/\.cp-bottom-sheet[\s\S]*?display:\s*none/);
  });

  it("uses will-change: transform", () => {
    expect(css).toContain("will-change: transform");
  });

  it("contains no hardcoded color literals", () => {
    assertNoColorLiterals(css, "bottom-sheet.css");
  });
});

describe("Component CSS — Utility Toolbar", () => {
  const css = readComponent("utility-toolbar.css");

  it("defines .cp-utility-toolbar as flex row", () => {
    expect(css).toContain(".cp-utility-toolbar");
    expect(css).toContain("display: flex");
  });

  it("defines .cp-utility-btn with transparent background", () => {
    expect(css).toContain(".cp-utility-btn {");
    expect(css).toContain("background: transparent");
  });

  it("icon buttons have 44px touch target", () => {
    expect(css).toContain("min-width: 44px");
    expect(css).toContain("min-height: 44px");
  });

  it("includes hover state", () => {
    expect(css).toContain(".cp-utility-btn:hover");
  });

  it("includes focus-visible outline", () => {
    expect(css).toContain(":focus-visible");
  });

  it("defines SVG icon sizing", () => {
    expect(css).toContain(".cp-utility-btn svg");
  });

  it("contains no hardcoded color literals", () => {
    assertNoColorLiterals(css, "utility-toolbar.css");
  });
});

describe("Component CSS — Readout Strip", () => {
  const css = readComponent("readout-strip.css");

  it("defines .cp-readout-strip with grid-area: readouts", () => {
    expect(css).toContain("grid-area: readouts");
  });

  it("uses flex-wrap for multiple readouts", () => {
    expect(css).toContain("flex-wrap: wrap");
  });

  it("uses panel background token", () => {
    expect(css).toContain("var(--cp-instr-panel-bg");
  });

  it("uses backdrop-filter with webkit prefix", () => {
    expect(css).toContain("backdrop-filter: blur(");
    expect(css).toContain("-webkit-backdrop-filter: blur(");
  });

  it("strips readout item background/border inside strip", () => {
    expect(css).toContain(".cp-readout-strip .cp-readout");
    expect(css).toMatch(/\.cp-readout-strip\s+\.cp-readout[\s\S]*?background:\s*transparent/);
  });

  it("contains no hardcoded color literals", () => {
    assertNoColorLiterals(css, "readout-strip.css");
  });
});

describe("Component CSS — Scroll Shadow", () => {
  const css = readComponent("scroll-shadow.css");

  it("defines .cp-scroll-shadow selector", () => {
    expect(css).toContain(".cp-scroll-shadow {");
  });

  it("uses background-attachment: local for scroll tracking", () => {
    expect(css).toContain("local");
  });

  it("uses background-attachment: scroll for fixed shadows", () => {
    expect(css).toContain("scroll");
  });

  it("uses --cp-bg1 token for gradient", () => {
    expect(css).toContain("var(--cp-bg1)");
  });

  it("uses radial-gradient for shadow edges", () => {
    expect(css).toContain("radial-gradient(");
  });
});
