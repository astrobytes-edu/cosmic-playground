import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MoonPhasesModel } from "@cosmic/physics";
import {
  UMBRA_APEX_X,
  UMBRA_HALF_WIDTH_AT_TIP,
  UMBRA_TIP_X,
  gradeQuarterChallenge,
  gradeShadowChallenge,
  umbraConePath
} from "./challenges";

// Convention (CLAUDE.md): 0 = full, 90 = third quarter, 180 = new, 270 = first quarter.
const grade = (which: "first" | "third", angleDeg: number) =>
  gradeQuarterChallenge(which, angleDeg, MoonPhasesModel);

describe("quarter challenges grade on the waxing/waning sense, not on f alone", () => {
  it("First Quarter accepts 270 and rejects 90 (the opposite quarter)", () => {
    expect(grade("first", 270).correct).toBe(true);
    const wrong = grade("first", 90);
    expect(wrong.correct).toBe(false);
    expect(wrong.message).toMatch(/Third Quarter/);
  });

  it("Third Quarter accepts 90 and rejects 270 (the opposite quarter)", () => {
    expect(grade("third", 90).correct).toBe(true);
    const wrong = grade("third", 270);
    expect(wrong.correct).toBe(false);
    expect(wrong.message).toMatch(/First Quarter/);
  });

  it("the opposite-quarter rejection is a teaching 'close', not a bare miss", () => {
    expect(grade("first", 90).close).toBe(true);
    expect(grade("third", 270).close).toBe(true);
  });

  it("a waxing angle far from the quarter is not accepted (the sense alone is not enough)", () => {
    // alpha = 200 is Waxing but f is about 0.03.
    expect(grade("first", 200).correct).toBe(false);
    // alpha = 160 is Waning but f is about 0.03.
    expect(grade("third", 160).correct).toBe(false);
  });

  it("accepts the f = 0.5 +/- 0.03 band (|delta alpha| < 3.4 deg) on the right side only", () => {
    for (const d of [-3, 3]) {
      expect(grade("first", 270 + d).correct).toBe(true);
      expect(grade("third", 90 + d).correct).toBe(true);
    }
    // 6 deg off: |f - 0.5| = 0.052, inside the 0.08 "close" band but not correct.
    for (const d of [-6, 6]) {
      const r = grade("first", 270 + d);
      expect([r.correct, r.close]).toEqual([false, true]);
    }
  });

  it("says no valid state for a non-finite angle", () => {
    expect(grade("first", Number.NaN)).toEqual({
      correct: false,
      close: false,
      message: "No valid state yet."
    });
  });
});

describe("shadow challenge tests the drawn Moon against the drawn umbra", () => {
  const shadow = (angleDeg: number, showShadow = true) =>
    gradeShadowChallenge({ angleDeg, showShadow });

  it("asks for the shadow toggle first", () => {
    const r = shadow(0, false);
    expect(r.correct).toBe(false);
    expect(r.message).toMatch(/shadow toggle/);
  });

  it("accepts the Moon at full phase (alpha = 0 and 360)", () => {
    expect(shadow(0).correct).toBe(true);
    expect(shadow(360).correct).toBe(true);
  });

  it("rejects alpha = 29, which the old 30 degree window accepted (94% lit gibbous)", () => {
    expect(shadow(29).correct).toBe(false);
    expect(shadow(331).correct).toBe(false);
  });

  it("the accepted window is a few degrees wide, not 30 (roughly |alpha| <= 11)", () => {
    expect(shadow(8).correct).toBe(true);
    expect(shadow(352).correct).toBe(true);
    expect(shadow(14).correct).toBe(false);
    expect(shadow(346).correct).toBe(false);
  });

  it("rejects the Moon on the Sun side of Earth", () => {
    expect(shadow(180).correct).toBe(false);
  });

  it("the success message states the real umbra scale and the node condition", () => {
    const r = shadow(0);
    expect(r.message).toMatch(/0\.69/);
    expect(r.message).toMatch(/node/);
  });
});

describe("index.html draws the umbra from the constants the grader uses", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const html = readFileSync(join(here, "index.html"), "utf8");

  it("umbra-cone path equals umbraConePath()", () => {
    const m = html.match(/id="umbra-cone"\s+d="([^"]+)"/);
    expect(m?.[1]).toBe(umbraConePath());
  });

  it("constants match the drawing: apex 225, tip 380, half-width 15", () => {
    expect([UMBRA_APEX_X, UMBRA_TIP_X, UMBRA_HALF_WIDTH_AT_TIP]).toEqual([225, 380, 15]);
  });
});
