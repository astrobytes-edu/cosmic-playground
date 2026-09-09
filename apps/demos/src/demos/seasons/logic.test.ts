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
  formatDayLength,
  formatLatitude,
  projectLatitudeCircle,
  globeAxisScreen,
  projectObserverMarker,
  latitudeToGlobeY,
  latitudeBandEllipse,
  globeAxisEndpoints,
  animationProgress,
  easeInOutCubic,
  shortestDayDelta,
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
    it("default distExaggeration is 8", () => {
      // At 1.0 AU the exaggeration term is zero regardless of factor
      const pos = orbitPosition(0, 1.0, 150);
      expect(pos.x).toBeCloseTo(150, 5);
    });
    it("exaggerates perihelion distance visually", () => {
      // 0.983 AU, exag = 8 => rScaled = 150 * (1 + 8*(0.983-1)) = 150 * 0.864 = 129.6
      const pos = orbitPosition(0, 0.983, 150, 8);
      expect(pos.x).toBeCloseTo(129.6, 0);
      expect(pos.y).toBeCloseTo(0, 0);
    });
    it("exaggerates aphelion distance visually", () => {
      // 1.017 AU, exag = 8 => rScaled = 150 * (1 + 8*(1.017-1)) = 150 * 1.136 = 170.4
      const pos = orbitPosition(0, 1.017, 150, 8);
      expect(pos.x).toBeCloseTo(170.4, 0);
    });
    it("no exaggeration when factor is 0", () => {
      const pos = orbitPosition(0, 1.017, 150, 0);
      expect(pos.x).toBeCloseTo(150, 0);
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

  describe("formatDayLength", () => {
    it("formats 14.53 hours as 14h 32m", () => {
      expect(formatDayLength(14.53)).toBe("14h 32m");
    });
    it("formats 0 hours as 0h 00m", () => {
      expect(formatDayLength(0)).toBe("0h 00m");
    });
    it("formats 24 hours as 24h 00m", () => {
      expect(formatDayLength(24)).toBe("24h 00m");
    });
    it("formats 12.0 hours as 12h 00m", () => {
      expect(formatDayLength(12.0)).toBe("12h 00m");
    });
    it("rounds minutes correctly", () => {
      expect(formatDayLength(14.99)).toBe("14h 59m");
    });
    it("formats fractional hours near half", () => {
      expect(formatDayLength(6.5)).toBe("6h 30m");
    });
    it("formats small fractional hours", () => {
      expect(formatDayLength(1.25)).toBe("1h 15m");
    });

    it("rounds near 24h to 24h 00m without overflow minutes", () => {
      expect(formatDayLength(23.999)).toBe("24h 00m");
    });

    it("clamps negative values to 0h 00m", () => {
      expect(formatDayLength(-0.01)).toBe("0h 00m");
    });

    it("clamps values above 24h to 24h 00m", () => {
      expect(formatDayLength(24.2)).toBe("24h 00m");
    });

    it("returns em-dash for non-finite values", () => {
      expect(formatDayLength(Number.NaN)).toBe("\u2014");
    });
  });

  describe("formatLatitude", () => {
    it("formats 0 as equator", () => {
      expect(formatLatitude(0)).toBe("0\u00B0 (Equator)");
    });
    it("formats positive latitude as N", () => {
      expect(formatLatitude(45)).toBe("45\u00B0N");
    });
    it("formats negative latitude as S", () => {
      expect(formatLatitude(-30)).toBe("30\u00B0S");
    });
    it("formats 90 as 90N", () => {
      expect(formatLatitude(90)).toBe("90\u00B0N");
    });
    it("formats -90 as 90S", () => {
      expect(formatLatitude(-90)).toBe("90\u00B0S");
    });
    it("formats decimal latitude with one decimal place", () => {
      expect(formatLatitude(32.7)).toBe("32.7\u00B0N");
    });
    it("treats tiny values near zero as equator", () => {
      expect(formatLatitude(-0.01)).toBe("0\u00B0 (Equator)");
    });
  });

  // -----------------------------------------------------------------------
  // Globe projection helpers
  // -----------------------------------------------------------------------

  describe("globe projection", () => {
    const R = 150;
    const VIEW = 20;
    const OBLIQUITY = 23.44;

    /** Widest screen-x reached by a projected latitude circle. */
    const maxX = (e: { cx: number; rx: number; ry: number; rotationDeg: number }) => {
      const t = (e.rotationDeg * Math.PI) / 180;
      return e.cx + Math.hypot(e.rx * Math.cos(t), e.ry * Math.sin(t));
    };

    it("puts the axis vertical at an equinox", () => {
      const a = globeAxisScreen(0, VIEW, 180);
      expect(a.x2).toBeCloseTo(0, 6);
      expect(a.y2).toBeLessThan(0); // north pole is up
    });

    it("leans the north pole TOWARD the Sun at the June solstice", () => {
      // The Sun is drawn to the left, so toward it means negative x.
      expect(globeAxisScreen(OBLIQUITY, VIEW, 180).x2).toBeLessThan(0);
    });

    it("leans the north pole AWAY from the Sun at the December solstice", () => {
      expect(globeAxisScreen(-OBLIQUITY, VIEW, 180).x2).toBeGreaterThan(0);
    });

    it("holds the Arctic circle exactly tangent to the terminator at the June solstice", () => {
      // This is the definition of the Arctic Circle: at the solstice the Sun just
      // fails to set there, so the whole circle is lit and touches the terminator
      // (screen x = 0) at one point. Any drawing that moves the terminator off
      // centre, or tilts the axis by the obliquity instead of the declination,
      // breaks this.
      const arctic = projectLatitudeCircle(90 - OBLIQUITY, OBLIQUITY, VIEW, R);
      expect(maxX(arctic)).toBeCloseTo(0, 6);
    });

    it("keeps latitudes poleward of the Arctic circle wholly lit at the June solstice", () => {
      expect(maxX(projectLatitudeCircle(80, OBLIQUITY, VIEW, R))).toBeLessThan(0);
      expect(maxX(projectLatitudeCircle(90 - OBLIQUITY + 5, OBLIQUITY, VIEW, R))).toBeLessThan(0);
    });

    it("keeps the Arctic circle wholly DARK at the December solstice", () => {
      const arctic = projectLatitudeCircle(90 - OBLIQUITY, -OBLIQUITY, VIEW, R);
      const t = (arctic.rotationDeg * Math.PI) / 180;
      const minX = arctic.cx - Math.hypot(arctic.rx * Math.cos(t), arctic.ry * Math.sin(t));
      expect(minX).toBeCloseTo(0, 6);
    });

    it("splits the equator exactly in half at every season", () => {
      for (const dec of [-OBLIQUITY, -10, 0, 10, OBLIQUITY]) {
        const eq = projectLatitudeCircle(0, dec, VIEW, R);
        expect(eq.cx).toBeCloseTo(0, 6); // centred on the terminator
      }
    });

    it("shrinks a latitude circle toward the pole", () => {
      const eq = projectLatitudeCircle(0, 0, VIEW, R);
      const mid = projectLatitudeCircle(45, 0, VIEW, R);
      const high = projectLatitudeCircle(80, 0, VIEW, R);
      expect(eq.rx).toBeGreaterThan(mid.rx);
      expect(mid.rx).toBeGreaterThan(high.rx);
    });

    it("places the observer marker on the lit side in local summer", () => {
      expect(projectObserverMarker(45, OBLIQUITY, VIEW, R).cx).toBeLessThan(0);
    });
  });

  describe("latitudeToGlobeY", () => {
    it("maps equator (0 deg) to centre", () => {
      expect(latitudeToGlobeY(0, 200, 150)).toBeCloseTo(200, 0);
    });

    it("maps north pole (+90 deg) to top", () => {
      expect(latitudeToGlobeY(90, 200, 150)).toBeCloseTo(50, 0);
    });

    it("maps south pole (-90 deg) to bottom", () => {
      expect(latitudeToGlobeY(-90, 200, 150)).toBeCloseTo(350, 0);
    });

    it("northern latitudes are above centre (smaller y)", () => {
      expect(latitudeToGlobeY(45, 200, 150)).toBeLessThan(200);
    });

    it("southern latitudes are below centre (larger y)", () => {
      expect(latitudeToGlobeY(-45, 200, 150)).toBeGreaterThan(200);
    });

    it("is symmetric about equator", () => {
      const yN = latitudeToGlobeY(30, 200, 150);
      const yS = latitudeToGlobeY(-30, 200, 150);
      // Both should be equally distant from 200
      expect(200 - yN).toBeCloseTo(yS - 200, 5);
    });
  });

  describe("latitudeBandEllipse", () => {
    it("equator at zero tilt collapses to a horizontal line (ry = 0)", () => {
      const band = latitudeBandEllipse(0, 0, 200, 200, 150);
      expect(band.cy).toBeCloseTo(200, 0);
      expect(band.rx).toBeCloseTo(150, 0);
      expect(band.ry).toBeCloseTo(0, 0);
    });

    it("equator at 23.5 tilt has visible ry", () => {
      const band = latitudeBandEllipse(0, 23.5, 200, 200, 150);
      expect(band.ry).toBeGreaterThan(0);
      expect(band.rx).toBeCloseTo(150, 0); // equator radius = globe radius
    });

    it("tropic of Cancer at 23.5 tilt is above centre", () => {
      const band = latitudeBandEllipse(23.5, 23.5, 200, 200, 150);
      expect(band.cy).toBeLessThan(200);
    });

    it("tropic of Capricorn at 23.5 tilt is below centre", () => {
      const band = latitudeBandEllipse(-23.5, 23.5, 200, 200, 150);
      expect(band.cy).toBeGreaterThan(200);
    });

    it("arctic circle has smaller rx than equator (high latitude)", () => {
      const eq = latitudeBandEllipse(0, 23.5, 200, 200, 150);
      const arc = latitudeBandEllipse(66.5, 23.5, 200, 200, 150);
      expect(arc.rx).toBeLessThan(eq.rx);
    });

    it("90 deg tilt shows full circles (ry = rx)", () => {
      const band = latitudeBandEllipse(0, 90, 200, 200, 150);
      expect(band.ry).toBeCloseTo(band.rx, 1);
    });

    it("rx equals globe radius times cos(latitude)", () => {
      const lat = 45;
      const R = 150;
      const band = latitudeBandEllipse(lat, 23.5, 200, 200, R);
      expect(band.rx).toBeCloseTo(R * Math.cos((lat * Math.PI) / 180), 3);
    });
  });

  describe("globeAxisEndpoints", () => {
    it("at zero tilt the axis is vertical (dx = 0)", () => {
      const axis = globeAxisEndpoints(0, 200, 200, 180);
      expect(axis.x1).toBeCloseTo(200, 5); // south end
      expect(axis.x2).toBeCloseTo(200, 5); // north end
      expect(axis.y1).toBeGreaterThan(200); // south end below centre
      expect(axis.y2).toBeLessThan(200);    // north end above centre
    });

    it("at 23.5 tilt has non-zero dx (tilted axis)", () => {
      const axis = globeAxisEndpoints(23.5, 200, 200, 180);
      expect(axis.x2).toBeGreaterThan(200); // north end tilts right
      expect(axis.x1).toBeLessThan(200);    // south end tilts left
    });

    it("at 90 tilt the axis is horizontal", () => {
      const axis = globeAxisEndpoints(90, 200, 200, 180);
      expect(axis.y1).toBeCloseTo(200, 0); // both ends at centre height
      expect(axis.y2).toBeCloseTo(200, 0);
      expect(axis.x2 - axis.x1).toBeCloseTo(360, 0); // full horizontal span
    });

    it("axis span equals 2 * axisLength", () => {
      const len = 180;
      const axis = globeAxisEndpoints(23.5, 200, 200, len);
      const dx = axis.x2 - axis.x1;
      const dy = axis.y1 - axis.y2; // y1 > y2 (south below north)
      const span = Math.sqrt(dx * dx + dy * dy);
      expect(span).toBeCloseTo(2 * len, 1);
    });
  });

  // -----------------------------------------------------------------------
  // Animation helpers
  // -----------------------------------------------------------------------

  describe("animationProgress", () => {
    it("returns 0 at the start", () => {
      expect(animationProgress(0, 10000)).toBe(0);
    });

    it("returns 0.5 at the midpoint", () => {
      expect(animationProgress(5000, 10000)).toBeCloseTo(0.5);
    });

    it("returns 1 at the end", () => {
      expect(animationProgress(10000, 10000)).toBe(1);
    });

    it("clamps to 1 when elapsed exceeds duration", () => {
      expect(animationProgress(15000, 10000)).toBe(1);
    });

    it("clamps to 0 for negative elapsed", () => {
      expect(animationProgress(-100, 10000)).toBe(0);
    });

    it("returns correct fraction for arbitrary values", () => {
      expect(animationProgress(2500, 10000)).toBeCloseTo(0.25);
      expect(animationProgress(7500, 10000)).toBeCloseTo(0.75);
    });
  });

  describe("easeInOutCubic", () => {
    it("starts at 0", () => {
      expect(easeInOutCubic(0)).toBe(0);
    });

    it("ends at 1", () => {
      expect(easeInOutCubic(1)).toBe(1);
    });

    it("midpoint is 0.5", () => {
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });

    it("first half is slow start (value < linear)", () => {
      expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    });

    it("second half is slow end (value > linear)", () => {
      expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
    });

    it("is symmetric: f(t) + f(1-t) = 1", () => {
      for (const t of [0.1, 0.2, 0.3, 0.4]) {
        expect(easeInOutCubic(t) + easeInOutCubic(1 - t)).toBeCloseTo(1, 10);
      }
    });

    it("is monotonically increasing", () => {
      let prev = 0;
      for (let t = 0.05; t <= 1.0; t += 0.05) {
        const val = easeInOutCubic(t);
        expect(val).toBeGreaterThanOrEqual(prev);
        prev = val;
      }
    });
  });

  describe("shortestDayDelta", () => {
    it("returns positive delta for forward motion within half year", () => {
      // day 80 -> day 172 = +92
      expect(shortestDayDelta(80, 172)).toBeCloseTo(92, 5);
    });

    it("returns negative delta for backward motion within half year", () => {
      // day 172 -> day 80 = -92
      expect(shortestDayDelta(172, 80)).toBeCloseTo(-92, 5);
    });

    it("wraps forward across year boundary (350 -> 10)", () => {
      // day 350 -> day 10: forward 25.25 days (via year wrap)
      const delta = shortestDayDelta(350, 10);
      expect(delta).toBeGreaterThan(0);
      expect(delta).toBeCloseTo(25.25, 1);
    });

    it("wraps backward across year boundary (10 -> 350)", () => {
      // day 10 -> day 350: backward 25.25 days (via year wrap)
      const delta = shortestDayDelta(10, 350);
      expect(delta).toBeLessThan(0);
      expect(delta).toBeCloseTo(-25.25, 1);
    });

    it("returns 0 for same day", () => {
      expect(shortestDayDelta(100, 100)).toBe(0);
    });

    it("handles exactly half year (goes forward by convention)", () => {
      // At exactly half year, delta = yearLength/2 which is at boundary
      const delta = shortestDayDelta(0, 365.25 / 2);
      expect(Math.abs(delta)).toBeCloseTo(365.25 / 2, 5);
    });

    it("uses custom yearLength", () => {
      // With yearLength=360, day 350 -> day 10 = +20
      const delta = shortestDayDelta(350, 10, 360);
      expect(delta).toBeCloseTo(20, 5);
    });

    it("large forward jump wraps to short backward path", () => {
      // day 10 -> day 300: raw delta = 290, but backward path = -75.25
      const delta = shortestDayDelta(10, 300);
      expect(delta).toBeLessThan(0);
      expect(delta).toBeCloseTo(-75.25, 1);
    });
  });
});
