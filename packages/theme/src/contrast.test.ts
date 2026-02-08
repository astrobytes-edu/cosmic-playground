// packages/theme/src/contrast.test.ts
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// WCAG 2.1 AA contrast helpers
// ---------------------------------------------------------------------------

/** Relative luminance per WCAG 2.1 */
function luminance(hex: string): number {
  const rgb = hex.replace(/^#/, "").match(/[A-Fa-f0-9]{2}/g)!.map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/** WCAG contrast ratio (always >= 1) */
function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Resolved token values
// ---------------------------------------------------------------------------

// Museum (dark) backgrounds
const BG0 = "#0f1115";  // --cp-bg0  (ink)
const BG1 = "#171b22";  // --cp-bg1  (slate)

// Text tokens — resolved from color-mix(in srgb, #ffffff P%, --cp-bg0)
const TEXT  = "#e2e2e3"; // --cp-text   (88%)
const TEXT2 = "#a9a9ab"; // --cp-text2  (64%)
const MUTED = "#7d7e81"; // --cp-muted  (46%)
const FAINT = "#5c5d60"; // --cp-faint  (32%) — placeholder/disabled only

// Instrument-layer accent tokens (direct hex values from tokens.css)
const AMBER = "#FFB86C"; // --cp-accent-amber (readout values)
const ICE   = "#8BE9FD"; // --cp-accent-ice   (readout units)
const GREEN = "#50FA7B"; // --cp-accent-green
const ROSE  = "#FF79C6"; // --cp-accent-rose

// Museum accents
const TEAL   = "#2f8c8d"; // --cp-accent
const PINK   = "#b07a93"; // --cp-pink
const VIOLET = "#6d7794"; // --cp-violet

// Paper theme (light) — used in EOS Lab station mode and print
const PAPER_BG = "#fafaff";

// ---------------------------------------------------------------------------
// Paper theme (light background)
// ---------------------------------------------------------------------------

describe("Paper theme contrast ratios", () => {
  it("success color has 4.5:1+ contrast on paper bg", () => {
    const successColor = "#047857"; // darker emerald
    expect(contrastRatio(successColor, PAPER_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("warning color has 4.5:1+ contrast on paper bg", () => {
    const warningColor = "#b45309"; // darker amber
    expect(contrastRatio(warningColor, PAPER_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("danger color has 4.5:1+ contrast on paper bg", () => {
    const dangerColor = "#b91c1c"; // darker red
    expect(contrastRatio(dangerColor, PAPER_BG)).toBeGreaterThanOrEqual(4.5);
  });
});

// ---------------------------------------------------------------------------
// Dark theme — normal text (4.5:1 minimum)
// ---------------------------------------------------------------------------

describe("Dark theme — normal text contrast (>= 4.5:1)", () => {
  it("--cp-text on --cp-bg0", () => {
    expect(contrastRatio(TEXT, BG0)).toBeGreaterThanOrEqual(4.5);
  });

  it("--cp-text2 on --cp-bg0", () => {
    expect(contrastRatio(TEXT2, BG0)).toBeGreaterThanOrEqual(4.5);
  });

  it("--cp-muted on --cp-bg0 (labels, captions)", () => {
    expect(contrastRatio(MUTED, BG0)).toBeGreaterThanOrEqual(4.5);
  });

  it("--cp-text on --cp-bg1 (panel text on slate)", () => {
    expect(contrastRatio(TEXT, BG1)).toBeGreaterThanOrEqual(4.5);
  });
});

// ---------------------------------------------------------------------------
// Dark theme — instrument readout tokens (4.5:1)
// ---------------------------------------------------------------------------

describe("Dark theme — instrument readout contrast (>= 4.5:1)", () => {
  it("--cp-accent-amber (readout values) on --cp-bg0", () => {
    expect(contrastRatio(AMBER, BG0)).toBeGreaterThanOrEqual(4.5);
  });

  it("--cp-accent-ice (readout units) on --cp-bg0", () => {
    expect(contrastRatio(ICE, BG0)).toBeGreaterThanOrEqual(4.5);
  });

  it("--cp-accent-green on --cp-bg0", () => {
    expect(contrastRatio(GREEN, BG0)).toBeGreaterThanOrEqual(4.5);
  });

  it("--cp-accent-rose on --cp-bg0", () => {
    expect(contrastRatio(ROSE, BG0)).toBeGreaterThanOrEqual(4.5);
  });
});

// ---------------------------------------------------------------------------
// Dark theme — accent colors used as text (4.5:1 normal, 3:1 large/UI)
// ---------------------------------------------------------------------------

describe("Dark theme — accent text contrast", () => {
  it("--cp-accent (teal links) on --cp-bg0 >= 4.5:1", () => {
    expect(contrastRatio(TEAL, BG0)).toBeGreaterThanOrEqual(4.5);
  });

  it("--cp-pink on --cp-bg0 >= 4.5:1", () => {
    expect(contrastRatio(PINK, BG0)).toBeGreaterThanOrEqual(4.5);
  });

  // --cp-violet is used for decorative accents and orbit colors (large/UI)
  it("--cp-violet on --cp-bg0 >= 3:1 (large text / UI components)", () => {
    expect(contrastRatio(VIOLET, BG0)).toBeGreaterThanOrEqual(3.0);
  });

  // --cp-faint is intentionally low-contrast for placeholders and disabled states
  it("--cp-faint on --cp-bg0 >= 2.5:1 (decorative / placeholder only)", () => {
    expect(contrastRatio(FAINT, BG0)).toBeGreaterThanOrEqual(2.5);
  });
});
