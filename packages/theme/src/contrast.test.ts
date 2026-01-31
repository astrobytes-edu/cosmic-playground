// packages/theme/src/contrast.test.ts
import { describe, it, expect } from "vitest";

// WCAG AA requires 4.5:1 for normal text, 3:1 for large text
function luminance(hex: string): number {
  const rgb = hex.match(/[A-Fa-f0-9]{2}/g)!.map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Paper theme contrast ratios", () => {
  const paperBg = "#fafaff";

  it("success color has 4.5:1+ contrast on paper bg", () => {
    const successColor = "#047857"; // darker emerald
    expect(contrastRatio(successColor, paperBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("warning color has 4.5:1+ contrast on paper bg", () => {
    const warningColor = "#b45309"; // darker amber
    expect(contrastRatio(warningColor, paperBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("danger color has 4.5:1+ contrast on paper bg", () => {
    const dangerColor = "#b91c1c"; // darker red
    expect(contrastRatio(dangerColor, paperBg)).toBeGreaterThanOrEqual(4.5);
  });
});
