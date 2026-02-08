import { describe, it, expect } from "vitest";
import {
  normalizeAngle,
  shortestAngleDelta,
  formatFraction,
  formatDay,
  formatApproxTime,
  computeApproxRiseSet,
  snapToCardinalPhase,
  computeOrbitalPosition,
  computePhaseViewPath,
  computeReadoutData,
  computeTimelineState,
  PHASE_ANGLES,
  SNAP_DEGREES,
  ORBITAL_CENTER,
  ORBITAL_RADIUS,
  MOON_RADIUS,
  PHASE_MOON_RADIUS,
  type MoonPhaseCallbacks,
} from "./logic";

/* ------------------------------------------------------------------ */
/*  Mock callbacks (avoid importing @cosmic/physics)                  */
/* ------------------------------------------------------------------ */

function mockCallbacks(overrides?: Partial<MoonPhaseCallbacks>): MoonPhaseCallbacks {
  return {
    illuminationFractionFromPhaseAngleDeg: (angleDeg: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      return (1 + Math.cos(rad)) / 2;
    },
    phaseNameFromPhaseAngleDeg: (angleDeg: number) => {
      if (angleDeg < 22.5 || angleDeg >= 337.5) return "Full Moon";
      if (angleDeg < 67.5) return "Waning Gibbous";
      if (angleDeg < 112.5) return "Third Quarter";
      if (angleDeg < 157.5) return "Waning Crescent";
      if (angleDeg < 202.5) return "New Moon";
      if (angleDeg < 247.5) return "Waxing Crescent";
      if (angleDeg < 292.5) return "First Quarter";
      return "Waxing Gibbous";
    },
    daysSinceNewFromPhaseAngleDeg: (angleDeg: number) => {
      const normalized = ((angleDeg % 360) + 360) % 360;
      const daysFraction = ((normalized - 180 + 360) % 360) / 360;
      return daysFraction * 29.53;
    },
    waxingWaningFromPhaseAngleDeg: (angleDeg: number) => {
      const normalized = ((angleDeg % 360) + 360) % 360;
      const daysFraction = ((normalized - 180 + 360) % 360) / 360;
      const days = daysFraction * 29.53;
      return days < 29.53 / 2 ? "Waxing" : "Waning";
    },
    synodicMonthDays: 29.53,
    ...overrides,
  };
}

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

describe("Moon Phases -- UI Logic", () => {
  /* -------------------------------------------------------------- */
  /*  Constants                                                      */
  /* -------------------------------------------------------------- */

  describe("exported constants", () => {
    it("PHASE_ANGLES has 8 entries spanning 0-315", () => {
      expect(PHASE_ANGLES).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
    });

    it("SNAP_DEGREES is 5", () => {
      expect(SNAP_DEGREES).toBe(5);
    });

    it("ORBITAL_CENTER is (200, 200)", () => {
      expect(ORBITAL_CENTER).toEqual({ x: 200, y: 200 });
    });

    it("ORBITAL_RADIUS is 120", () => {
      expect(ORBITAL_RADIUS).toBe(120);
    });

    it("MOON_RADIUS is 15", () => {
      expect(MOON_RADIUS).toBe(15);
    });

    it("PHASE_MOON_RADIUS is 60", () => {
      expect(PHASE_MOON_RADIUS).toBe(60);
    });
  });

  /* -------------------------------------------------------------- */
  /*  normalizeAngle                                                 */
  /* -------------------------------------------------------------- */

  describe("normalizeAngle", () => {
    it("0 -> 0", () => {
      expect(normalizeAngle(0)).toBe(0);
    });

    it("360 -> 0", () => {
      expect(normalizeAngle(360)).toBe(0);
    });

    it("-90 -> 270", () => {
      expect(normalizeAngle(-90)).toBe(270);
    });

    it("450 -> 90", () => {
      expect(normalizeAngle(450)).toBe(90);
    });

    it("-360 -> 0 (negative zero is acceptable)", () => {
      expect(normalizeAngle(-360)).toBeCloseTo(0);
    });

    it("180 -> 180", () => {
      expect(normalizeAngle(180)).toBe(180);
    });
  });

  /* -------------------------------------------------------------- */
  /*  shortestAngleDelta                                             */
  /* -------------------------------------------------------------- */

  describe("shortestAngleDelta", () => {
    it("(0, 90) -> 90", () => {
      expect(shortestAngleDelta(0, 90)).toBe(90);
    });

    it("(350, 10) -> 20 (wraps forward)", () => {
      expect(shortestAngleDelta(350, 10)).toBe(20);
    });

    it("(10, 350) -> -20 (wraps backward)", () => {
      expect(shortestAngleDelta(10, 350)).toBe(-20);
    });

    it("(0, 180) -> -180 (ambiguous; formula yields -180)", () => {
      expect(shortestAngleDelta(0, 180)).toBe(-180);
    });

    it("(0, 0) -> 0", () => {
      expect(shortestAngleDelta(0, 0)).toBe(0);
    });
  });

  /* -------------------------------------------------------------- */
  /*  formatFraction                                                 */
  /* -------------------------------------------------------------- */

  describe("formatFraction", () => {
    it("formats 0.12345 to 3 decimal places", () => {
      expect(formatFraction(0.12345)).toBe("0.123");
    });

    it("formats 1 as 1.000", () => {
      expect(formatFraction(1)).toBe("1.000");
    });

    it("returns em dash for NaN", () => {
      expect(formatFraction(NaN)).toBe("\u2014");
    });

    it("returns em dash for Infinity", () => {
      expect(formatFraction(Infinity)).toBe("\u2014");
    });
  });

  /* -------------------------------------------------------------- */
  /*  formatDay                                                      */
  /* -------------------------------------------------------------- */

  describe("formatDay", () => {
    it("formats 7 as 7.0", () => {
      expect(formatDay(7)).toBe("7.0");
    });

    it("formats 14.76 as 14.8", () => {
      expect(formatDay(14.76)).toBe("14.8");
    });

    it("returns em dash for NaN", () => {
      expect(formatDay(NaN)).toBe("\u2014");
    });

    it("returns em dash for Infinity", () => {
      expect(formatDay(Infinity)).toBe("\u2014");
    });
  });

  /* -------------------------------------------------------------- */
  /*  formatApproxTime                                               */
  /* -------------------------------------------------------------- */

  describe("formatApproxTime", () => {
    it("0 -> ~12 AM (midnight)", () => {
      expect(formatApproxTime(0)).toBe("~12 AM");
    });

    it("6 -> ~6 AM", () => {
      expect(formatApproxTime(6)).toBe("~6 AM");
    });

    it("12 -> ~12 PM (noon)", () => {
      expect(formatApproxTime(12)).toBe("~12 PM");
    });

    it("18 -> ~6 PM", () => {
      expect(formatApproxTime(18)).toBe("~6 PM");
    });

    it("23.7 -> ~12 AM (rounds to 24 = 0)", () => {
      expect(formatApproxTime(23.7)).toBe("~12 AM");
    });

    it("13 -> ~1 PM", () => {
      expect(formatApproxTime(13)).toBe("~1 PM");
    });
  });

  /* -------------------------------------------------------------- */
  /*  computeApproxRiseSet                                           */
  /* -------------------------------------------------------------- */

  describe("computeApproxRiseSet", () => {
    it("Full Moon (0 deg): rises ~18h, sets ~6h", () => {
      const { riseHour, setHour } = computeApproxRiseSet(0);
      expect(riseHour).toBeCloseTo(18, 1);
      expect(setHour).toBeCloseTo(6, 1);
    });

    it("New Moon (180 deg): rises ~6h, sets ~18h", () => {
      const { riseHour, setHour } = computeApproxRiseSet(180);
      expect(riseHour).toBeCloseTo(6, 1);
      expect(setHour).toBeCloseTo(18, 1);
    });

    it("First Quarter (270 deg): rises ~12h (noon), sets ~0h (midnight)", () => {
      const { riseHour, setHour } = computeApproxRiseSet(270);
      expect(riseHour).toBeCloseTo(12, 1);
      expect(setHour).toBeCloseTo(0, 1);
    });

    it("Third Quarter (90 deg): rises ~0h (midnight), sets ~12h", () => {
      const { riseHour, setHour } = computeApproxRiseSet(90);
      expect(riseHour).toBeCloseTo(0, 1);
      expect(setHour).toBeCloseTo(12, 1);
    });
  });

  /* -------------------------------------------------------------- */
  /*  snapToCardinalPhase                                            */
  /* -------------------------------------------------------------- */

  describe("snapToCardinalPhase", () => {
    it("3 deg snaps to 0 (within 5 deg of Full Moon)", () => {
      expect(snapToCardinalPhase(3)).toBe(0);
    });

    it("87 deg snaps to 90 (within 5 deg of Third Quarter)", () => {
      expect(snapToCardinalPhase(87)).toBe(90);
    });

    it("183 deg snaps to 180 (within 5 deg of New Moon)", () => {
      expect(snapToCardinalPhase(183)).toBe(180);
    });

    it("267 deg snaps to 270 (within 5 deg of First Quarter)", () => {
      expect(snapToCardinalPhase(267)).toBe(270);
    });

    it("45 deg does not snap (too far from any cardinal)", () => {
      expect(snapToCardinalPhase(45)).toBe(45);
    });
  });

  /* -------------------------------------------------------------- */
  /*  computeOrbitalPosition                                         */
  /* -------------------------------------------------------------- */

  describe("computeOrbitalPosition", () => {
    const center = ORBITAL_CENTER;
    const r = ORBITAL_RADIUS;

    it("0 deg -> right of center (320, 200)", () => {
      const pos = computeOrbitalPosition(0, center, r);
      expect(pos.x).toBeCloseTo(320, 1);
      expect(pos.y).toBeCloseTo(200, 1);
    });

    it("90 deg -> top of center (200, 80)", () => {
      const pos = computeOrbitalPosition(90, center, r);
      expect(pos.x).toBeCloseTo(200, 1);
      expect(pos.y).toBeCloseTo(80, 1);
    });

    it("180 deg -> left of center (80, 200)", () => {
      const pos = computeOrbitalPosition(180, center, r);
      expect(pos.x).toBeCloseTo(80, 1);
      expect(pos.y).toBeCloseTo(200, 1);
    });
  });

  /* -------------------------------------------------------------- */
  /*  computePhaseViewPath                                           */
  /* -------------------------------------------------------------- */

  describe("computePhaseViewPath", () => {
    const r = PHASE_MOON_RADIUS;
    const cb = mockCallbacks();

    it("Full Moon (0 deg): returns full circle with A commands", () => {
      const path = computePhaseViewPath(0, r, cb);
      expect(path).toContain("A");
      expect(path).toContain("1 1");
      // Full circle: two half-arcs
      expect(path).toMatch(/M 0 -60 A 60 60 0 1 1 0 60 A 60 60 0 1 1 0 -60/);
    });

    it("New Moon (180 deg): returns empty string (illum < 0.01)", () => {
      const path = computePhaseViewPath(180, r, cb);
      expect(path).toBe("");
    });

    it("First Quarter (270 deg): path with squeeze near 0", () => {
      const path = computePhaseViewPath(270, r, cb);
      expect(path).not.toBe("");
      expect(path).toContain("M 0");
      // squeeze = r * cos(270 deg) ~ 0, so |squeeze| ~ 0
      // isWaxing = true (270 > 180), squeeze >= 0 -> flag 0 0 1
    });

    it("Waxing Crescent (225 deg): returns non-empty path", () => {
      const path = computePhaseViewPath(225, r, cb);
      expect(path).not.toBe("");
      expect(path).toContain("A");
    });

    it("Waning Gibbous (45 deg): returns non-empty path", () => {
      const path = computePhaseViewPath(45, r, cb);
      expect(path).not.toBe("");
      expect(path).toContain("A");
    });

    it("returns empty for angle with illum < 0.01 via callback", () => {
      const nearNew = mockCallbacks({
        illuminationFractionFromPhaseAngleDeg: () => 0.005,
      });
      const path = computePhaseViewPath(179, r, nearNew);
      expect(path).toBe("");
    });
  });

  /* -------------------------------------------------------------- */
  /*  computeReadoutData                                             */
  /* -------------------------------------------------------------- */

  describe("computeReadoutData", () => {
    const cb = mockCallbacks();

    it("Full Moon (0 deg): phaseName contains Full, illumPercent 100", () => {
      const data = computeReadoutData(0, cb);
      expect(data.phaseName).toContain("Full");
      expect(data.illumPercent).toBe("100");
    });

    it("New Moon (180 deg): phaseName contains New, illumPercent 0", () => {
      const data = computeReadoutData(180, cb);
      expect(data.phaseName).toContain("New");
      expect(data.illumPercent).toBe("0");
    });

    it("angleStr is rounded integer string", () => {
      const data = computeReadoutData(90, cb);
      expect(data.angleStr).toBe("90");
    });

    it("daysSinceNew is formatted with 1 decimal", () => {
      const data = computeReadoutData(270, cb);
      // 270 deg: daysFraction = (270 - 180 + 360) % 360 / 360 = 90/360 = 0.25
      // days = 0.25 * 29.53 = 7.3825
      expect(data.daysSinceNew).toBe("7.4");
    });

    it("ariaValueText contains phase name and illumination", () => {
      const data = computeReadoutData(0, cb);
      expect(data.ariaValueText).toContain("Full Moon");
      expect(data.ariaValueText).toContain("100%");
      expect(data.ariaValueText).toContain("illuminated");
    });
  });

  /* -------------------------------------------------------------- */
  /*  computeTimelineState                                           */
  /* -------------------------------------------------------------- */

  describe("computeTimelineState", () => {
    const cb = mockCallbacks();

    it("Waxing phase (225 deg): directionText contains WAXING, directionClass empty", () => {
      const state = computeTimelineState(225, PHASE_ANGLES, cb);
      expect(state.directionText).toContain("WAXING");
      expect(state.directionClass).toBe("");
    });

    it("Waning phase (45 deg): directionText contains WANING, directionClass waning", () => {
      const state = computeTimelineState(45, PHASE_ANGLES, cb);
      expect(state.directionText).toContain("WANING");
      expect(state.directionClass).toBe("waning");
    });

    it("dayText contains Day and synodic month", () => {
      const state = computeTimelineState(225, PHASE_ANGLES, cb);
      expect(state.dayText).toContain("Day");
      expect(state.dayText).toContain("29.53");
    });

    it("activePhaseAngle identifies nearest phase within 22.5 deg", () => {
      // 225 is exactly at Waxing Crescent
      const state = computeTimelineState(225, PHASE_ANGLES, cb);
      expect(state.activePhaseAngle).toBe(225);
    });

    it("activePhaseAngle is null when not near any phase", () => {
      // 23 deg is 23 from 0 and 22 from 45 -- 22 < 22.5 so it matches 45.
      // Use 22.6 deg instead: 22.6 from 0, 22.4 from 45 -- 22.4 < 22.5 so still matches 45.
      // Use a value exactly between: shortestAngleDelta(22.5, 0)=22.5 (not < 22.5) and
      // shortestAngleDelta(22.5, 45)=22.5 (not < 22.5). So 22.5 matches neither.
      const state = computeTimelineState(22.5, PHASE_ANGLES, cb);
      expect(state.activePhaseAngle).toBeNull();
    });
  });
});
