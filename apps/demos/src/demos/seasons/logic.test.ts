import { describe, it, expect } from "vitest";
import {
  clamp,
  formatNumber,
  formatDateFromDayOfYear,
  seasonFromPhaseNorth,
  oppositeSeason,
  orbitPosition,
  axisEndpoint,
  diskMarkerY,
} from "./logic";

describe("Seasons -- UI Logic", () => {
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it("clamps to min", () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });
    it("clamps to max", () => {
      expect(clamp(11, 0, 10)).toBe(10);
    });
    it("handles min === max", () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  describe("formatNumber", () => {
    it("formats with specified digits", () => {
      expect(formatNumber(3.14159, 2)).toBe("3.14");
    });
    it("rounds correctly", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });
    it("returns em-dash for NaN", () => {
      expect(formatNumber(NaN, 1)).toBe("\u2014");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatNumber(Infinity, 1)).toBe("\u2014");
    });
    it("returns em-dash for -Infinity", () => {
      expect(formatNumber(-Infinity, 1)).toBe("\u2014");
    });
  });

  describe("formatDateFromDayOfYear", () => {
    it("day 1 is Jan 1", () => {
      expect(formatDateFromDayOfYear(1)).toBe("Jan 1");
    });
    it("day 31 is Jan 31", () => {
      expect(formatDateFromDayOfYear(31)).toBe("Jan 31");
    });
    it("day 32 is Feb 1", () => {
      expect(formatDateFromDayOfYear(32)).toBe("Feb 1");
    });
    it("day 59 is Feb 28", () => {
      expect(formatDateFromDayOfYear(59)).toBe("Feb 28");
    });
    it("day 60 is Mar 1", () => {
      expect(formatDateFromDayOfYear(60)).toBe("Mar 1");
    });
    it("day 80 is Mar 21 (March equinox anchor)", () => {
      expect(formatDateFromDayOfYear(80)).toBe("Mar 21");
    });
    it("day 172 is Jun 21 (approx June solstice)", () => {
      expect(formatDateFromDayOfYear(172)).toBe("Jun 21");
    });
    it("day 365 is Dec 31", () => {
      expect(formatDateFromDayOfYear(365)).toBe("Dec 31");
    });
    it("clamps day < 1 to Jan 1", () => {
      expect(formatDateFromDayOfYear(0)).toBe("Jan 1");
    });
    it("clamps day > 365 to Dec 31", () => {
      expect(formatDateFromDayOfYear(400)).toBe("Dec 31");
    });
  });

  describe("seasonFromPhaseNorth", () => {
    it("returns Spring at March equinox (day 80)", () => {
      expect(seasonFromPhaseNorth(80)).toBe("Spring");
    });
    it("returns Summer at June solstice (day 172)", () => {
      expect(seasonFromPhaseNorth(172)).toBe("Summer");
    });
    it("returns Autumn at September equinox (day 266)", () => {
      expect(seasonFromPhaseNorth(266)).toBe("Autumn");
    });
    it("returns Winter at December solstice (day 356)", () => {
      expect(seasonFromPhaseNorth(356)).toBe("Winter");
    });
    it("returns Winter in January (day 15)", () => {
      expect(seasonFromPhaseNorth(15)).toBe("Winter");
    });
  });

  describe("oppositeSeason", () => {
    it("Spring <-> Autumn", () => {
      expect(oppositeSeason("Spring")).toBe("Autumn");
      expect(oppositeSeason("Autumn")).toBe("Spring");
    });
    it("Summer <-> Winter", () => {
      expect(oppositeSeason("Summer")).toBe("Winter");
      expect(oppositeSeason("Winter")).toBe("Summer");
    });
  });

  describe("orbitPosition", () => {
    it("returns (orbitR, 0) at angle 0 and distance 1.0 AU", () => {
      const pos = orbitPosition(0, 1.0, 140);
      expect(pos.x).toBeCloseTo(140, 5);
      expect(pos.y).toBeCloseTo(0, 5);
    });
    it("returns (0, orbitR) at angle pi/2 and distance 1.0 AU", () => {
      const pos = orbitPosition(Math.PI / 2, 1.0, 140);
      expect(pos.x).toBeCloseTo(0, 5);
      expect(pos.y).toBeCloseTo(140, 5);
    });
    it("clamps distance scaling to 0.95-1.05 range", () => {
      const posLow = orbitPosition(0, 0.5, 140);
      expect(posLow.x).toBeCloseTo(0.95 * 140, 5);
      const posHigh = orbitPosition(0, 2.0, 140);
      expect(posHigh.x).toBeCloseTo(1.05 * 140, 5);
    });
  });

  describe("axisEndpoint", () => {
    it("returns vertical axis for 0 deg tilt", () => {
      const end = axisEndpoint(0, 120);
      expect(end.x).toBeCloseTo(0, 5);
      expect(end.y).toBeCloseTo(-120, 5);
    });
    it("tilts axis for 23.5 deg tilt", () => {
      const end = axisEndpoint(23.5, 120);
      expect(end.x).toBeLessThan(0);
      expect(end.y).toBeLessThan(0);
    });
  });

  describe("diskMarkerY", () => {
    it("returns 0 for 0 deg angle", () => {
      expect(diskMarkerY(0, 92)).toBeCloseTo(0, 5);
    });
    it("returns negative (up) for positive angle (northern latitude)", () => {
      expect(diskMarkerY(40, 92)).toBeLessThan(0);
    });
    it("returns positive (down) for negative angle (southern latitude)", () => {
      expect(diskMarkerY(-40, 92)).toBeGreaterThan(0);
    });
    it("scales with disk radius", () => {
      const y1 = diskMarkerY(45, 92);
      const y2 = diskMarkerY(45, 184);
      expect(Math.abs(y2)).toBeCloseTo(Math.abs(y1) * 2, 2);
    });
  });
});
