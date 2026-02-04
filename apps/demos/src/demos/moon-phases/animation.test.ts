import { describe, expect, test } from "vitest";
import { nextAngleDeg, degreesPerSecondFromSpeed } from "./animation";

describe("moon-phases animation helpers", () => {
  test("degreesPerSecond scales with speed", () => {
    const base = degreesPerSecondFromSpeed(1, 29.53);
    const fast = degreesPerSecondFromSpeed(5, 29.53);
    expect(fast).toBeCloseTo(base * 5, 6);
  });

  test("nextAngleDeg uses current speed per step", () => {
    const synodic = 29.53;
    const step1 = nextAngleDeg({
      angleDeg: 0,
      deltaSeconds: 1,
      speed: 1,
      synodicMonthDays: synodic
    });
    const step2 = nextAngleDeg({
      angleDeg: step1,
      deltaSeconds: 1,
      speed: 5,
      synodicMonthDays: synodic
    });

    const expectedStep1 = degreesPerSecondFromSpeed(1, synodic);
    const expectedStep2 = expectedStep1 + degreesPerSecondFromSpeed(5, synodic);

    expect(step1).toBeCloseTo(expectedStep1, 6);
    expect(step2).toBeCloseTo(expectedStep2, 6);
  });
});
