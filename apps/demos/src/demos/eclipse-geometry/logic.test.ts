import { describe, it, expect } from "vitest";
import {
  clamp,
  formatNumber,
  phaseInfo,
  outcomeLabel,
  computeDerived,
  buildStationRow,
  formatSimSummary,
  SYZYGY_TOLERANCE_DEG,
  DISTANCE_PRESETS_KM,
  snapToNearestPreset,
  svgPointToAngleDeg,
  buildBetaCurvePath,
  sliderToYears,
  yearsToSlider,
  formatYearsLabel,
  checkWhyNotEveryMonth,
  checkEclipseStatistics,
} from "./logic";
import type { EclipseModelCallbacks, SimulationSummaryInput } from "./logic";

/* ------------------------------------------------------------------ */
/*  Stub physics model for DI                                         */
/* ------------------------------------------------------------------ */

/**
 * Minimal reimplementation of the physics model callbacks.
 * This avoids importing @cosmic/physics in tests (DI pattern).
 */
function normalizeAngleDeg(a: number): number {
  return ((a % 360) + 360) % 360;
}

function angularSeparationDeg(a: number, b: number): number {
  const d = Math.abs(normalizeAngleDeg(a) - normalizeAngleDeg(b));
  return d > 180 ? 360 - d : d;
}

const stubModel: EclipseModelCallbacks = {
  phaseAngleDeg: ({ moonLonDeg, sunLonDeg }) =>
    normalizeAngleDeg(moonLonDeg - sunLonDeg),
  eclipticLatitudeDeg: ({ tiltDeg, moonLonDeg, nodeLonDeg }) =>
    tiltDeg * Math.sin(((moonLonDeg - nodeLonDeg) * Math.PI) / 180),
  nearestNodeDistanceDeg: ({ moonLonDeg, nodeLonDeg }) =>
    Math.min(
      angularSeparationDeg(moonLonDeg, nodeLonDeg),
      angularSeparationDeg(moonLonDeg, normalizeAngleDeg(nodeLonDeg + 180))
    ),
  angularSeparationDeg,
  solarEclipseType: ({ betaDeg }) => {
    const abs = Math.abs(betaDeg);
    if (abs < 0.5) return { type: "total-solar" };
    if (abs < 1.0) return { type: "annular-solar" };
    if (abs < 1.5) return { type: "partial-solar" };
    return { type: "none" };
  },
  lunarEclipseType: ({ betaDeg }) => {
    const abs = Math.abs(betaDeg);
    if (abs < 0.5) return { type: "total-lunar" };
    if (abs < 1.0) return { type: "partial-lunar" };
    if (abs < 1.5) return { type: "penumbral-lunar" };
    return { type: "none" };
  },
};

/* ================================================================== */
/*  Tests                                                             */
/* ================================================================== */

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps below minimum", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("clamps above maximum", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles min === max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it("handles edge: value === min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("handles edge: value === max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("formatNumber", () => {
  it("formats finite numbers with requested digits", () => {
    expect(formatNumber(3.14159, 2)).toBe("3.14");
  });

  it("rounds correctly via toFixed", () => {
    // toFixed uses IEEE 754 rounding: 5.145 is stored as 5.14499...
    // so toFixed(2) rounds down to "5.14"
    expect(formatNumber(5.145, 2)).toBe("5.14");
    expect(formatNumber(5.155, 2)).toBe("5.16");
    expect(formatNumber(2.725, 0)).toBe("3");
  });

  it("returns em-dash for NaN", () => {
    expect(formatNumber(NaN, 2)).toBe("\u2014");
  });

  it("returns em-dash for Infinity", () => {
    expect(formatNumber(Infinity, 2)).toBe("\u2014");
  });

  it("returns em-dash for -Infinity", () => {
    expect(formatNumber(-Infinity, 2)).toBe("\u2014");
  });

  it("formats zero correctly", () => {
    expect(formatNumber(0, 3)).toBe("0.000");
  });

  it("formats negative numbers", () => {
    expect(formatNumber(-1.5, 1)).toBe("-1.5");
  });

  it("handles 0 digits", () => {
    expect(formatNumber(2.725, 0)).toBe("3");
  });
});

describe("phaseInfo", () => {
  it("returns New Moon near 0 degrees", () => {
    const result = phaseInfo(0, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("New Moon");
    expect(result.isNew).toBe(true);
    expect(result.isFull).toBe(false);
  });

  it("returns New Moon within 10 degrees", () => {
    const result = phaseInfo(8, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("New Moon");
    expect(result.isNew).toBe(true);
  });

  it("returns Full Moon near 180 degrees", () => {
    const result = phaseInfo(180, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("Full Moon");
    expect(result.isFull).toBe(true);
    expect(result.isNew).toBe(false);
  });

  it("returns Full Moon within 10 degrees", () => {
    const result = phaseInfo(172, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("Full Moon");
    expect(result.isFull).toBe(true);
  });

  it("returns First quarter near 90 degrees", () => {
    const result = phaseInfo(90, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("First quarter");
    expect(result.isNew).toBe(false);
    expect(result.isFull).toBe(false);
  });

  it("returns Third quarter near 270 degrees", () => {
    const result = phaseInfo(270, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("Third quarter");
  });

  it("returns Waxing crescent between New and First (30 deg)", () => {
    const result = phaseInfo(30, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("Waxing crescent");
  });

  it("returns Waxing gibbous between First and Full (120 deg)", () => {
    const result = phaseInfo(120, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("Waxing gibbous");
  });

  it("returns Waning gibbous between Full and Third (210 deg)", () => {
    const result = phaseInfo(210, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("Waning gibbous");
  });

  it("returns Waning crescent between Third and New (320 deg)", () => {
    const result = phaseInfo(320, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("Waning crescent");
  });

  it("handles wrapping: 355 deg is near New Moon", () => {
    const result = phaseInfo(355, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("New Moon");
    expect(result.isNew).toBe(true);
  });

  it("handles negative angles", () => {
    // -5 deg normalizes to 355, within 10 of 0 => New Moon
    const result = phaseInfo(-5, angularSeparationDeg, normalizeAngleDeg);
    expect(result.label).toBe("New Moon");
    expect(result.isNew).toBe(true);
  });
});

describe("outcomeLabel", () => {
  it('maps "none" to "None"', () => {
    expect(outcomeLabel("none")).toBe("None");
  });

  it('maps "partial-solar" to "Partial solar"', () => {
    expect(outcomeLabel("partial-solar")).toBe("Partial solar");
  });

  it('maps "annular-solar" to "Annular solar"', () => {
    expect(outcomeLabel("annular-solar")).toBe("Annular solar");
  });

  it('maps "total-solar" to "Total solar"', () => {
    expect(outcomeLabel("total-solar")).toBe("Total solar");
  });

  it('maps "penumbral-lunar" to "Penumbral lunar"', () => {
    expect(outcomeLabel("penumbral-lunar")).toBe("Penumbral lunar");
  });

  it('maps "partial-lunar" to "Partial lunar"', () => {
    expect(outcomeLabel("partial-lunar")).toBe("Partial lunar");
  });

  it('maps "total-lunar" to "Total lunar"', () => {
    expect(outcomeLabel("total-lunar")).toBe("Total lunar");
  });

  it("passes through unknown types", () => {
    expect(outcomeLabel("hypothetical")).toBe("hypothetical");
  });
});

describe("computeDerived", () => {
  it("returns correct phase angle for Full Moon", () => {
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 180,
        nodeLonDeg: 0,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    expect(result.phaseAngleDeg).toBe(180);
  });

  it("returns correct phase angle for New Moon", () => {
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 0,
        nodeLonDeg: 0,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    expect(result.phaseAngleDeg).toBe(0);
  });

  it("computes beta from ecliptic latitude", () => {
    // Moon at 90 deg from ascending node with 5 deg tilt
    // beta = tilt * sin(90) = 5.145
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 90,
        nodeLonDeg: 0,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    expect(result.betaDeg).toBeCloseTo(5.145, 2);
    expect(result.absBetaDeg).toBeCloseTo(5.145, 2);
  });

  it("beta is zero when Moon is at node", () => {
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 0,
        nodeLonDeg: 0,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    expect(result.betaDeg).toBeCloseTo(0, 10);
  });

  it("detects solar eclipse at New Moon near node", () => {
    // New Moon (moonLon = sunLon = 0), Moon at node => beta ~ 0 => total solar
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 0,
        nodeLonDeg: 0,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    expect(result.solarType).toBe("total-solar");
    expect(result.lunarType).toBe("none"); // Not Full Moon
  });

  it("detects lunar eclipse at Full Moon near node", () => {
    // Full Moon (moonLon=180, sunLon=0), Moon at descending node (nodeLon+180=180)
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 180,
        nodeLonDeg: 0,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    // beta = tilt * sin(180-0) = tilt * sin(180) ~ 0
    expect(result.lunarType).toBe("total-lunar");
    expect(result.solarType).toBe("none"); // Not New Moon
  });

  it("returns no eclipse when Moon is far from node at New Moon", () => {
    // New Moon (moonLon = sunLon = 0), node at 90 => nearest node = 90
    // beta = tilt * sin(0 - 90) = -tilt, abs(beta) ~ 5.145 => above threshold
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 0,
        nodeLonDeg: 90,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    expect(result.solarType).toBe("none");
  });

  it("returns no eclipse when phase is not syzygy", () => {
    // Moon at 45 degrees (neither New nor Full)
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 45,
        nodeLonDeg: 45,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    expect(result.solarType).toBe("none");
    expect(result.lunarType).toBe("none");
  });

  it("computes nearest node distance", () => {
    // Moon at 30 deg, node at 0 => nearest = min(30, |30-180|=150) = 30
    const result = computeDerived(
      {
        sunLonDeg: 0,
        moonLonDeg: 30,
        nodeLonDeg: 0,
        orbitalTiltDeg: 5.145,
        earthMoonDistanceKm: 384400,
      },
      stubModel
    );
    expect(result.nearestNodeDeg).toBeCloseTo(30, 0);
  });

  it("preserves input parameters in output", () => {
    const args = {
      sunLonDeg: 10,
      moonLonDeg: 200,
      nodeLonDeg: 50,
      orbitalTiltDeg: 3.0,
      earthMoonDistanceKm: 363300,
    };
    const result = computeDerived(args, stubModel);
    expect(result.sunLonDeg).toBe(10);
    expect(result.moonLonDeg).toBe(200);
    expect(result.nodeLonDeg).toBe(50);
    expect(result.orbitalTiltDeg).toBe(3.0);
    expect(result.earthMoonDistanceKm).toBe(363300);
  });
});

describe("SYZYGY_TOLERANCE_DEG", () => {
  it("equals 5 degrees", () => {
    expect(SYZYGY_TOLERANCE_DEG).toBe(5);
  });
});

describe("buildStationRow", () => {
  it("formats a station row correctly", () => {
    const row = buildStationRow({
      label: "Test case",
      phaseLabel: "New Moon",
      phaseAngleDeg: 2.5,
      absBetaDeg: 0.123,
      nearestNodeDeg: 5.67,
      orbitalTiltDeg: 5.145,
      earthMoonDistanceKm: 384400,
      outcome: "Total solar",
    });
    expect(row.case).toBe("Test case");
    expect(row.phase).toBe("New Moon");
    expect(row.phaseAngleDeg).toBe("2.5");
    expect(row.absBetaDeg).toBe("0.123");
    expect(row.nearestNodeDeg).toBe("5.67");
    expect(row.tiltDeg).toBe("5.145");
    expect(row.earthMoonDistanceKm).toBe("384400");
    expect(row.outcome).toBe("Total solar");
  });

  it("handles non-finite values gracefully", () => {
    const row = buildStationRow({
      label: "Edge",
      phaseLabel: "Unknown",
      phaseAngleDeg: NaN,
      absBetaDeg: Infinity,
      nearestNodeDeg: -Infinity,
      orbitalTiltDeg: 5.0,
      earthMoonDistanceKm: 384400,
      outcome: "None",
    });
    expect(row.phaseAngleDeg).toBe("\u2014");
    expect(row.absBetaDeg).toBe("\u2014");
    expect(row.nearestNodeDeg).toBe("\u2014");
  });

  it("rounds distance to nearest integer", () => {
    const row = buildStationRow({
      label: "Test",
      phaseLabel: "Full Moon",
      phaseAngleDeg: 180,
      absBetaDeg: 0,
      nearestNodeDeg: 0,
      orbitalTiltDeg: 5.0,
      earthMoonDistanceKm: 384400.7,
      outcome: "None",
    });
    expect(row.earthMoonDistanceKm).toBe("384401");
  });
});

describe("formatSimSummary", () => {
  const TROPICAL_YEAR_DAYS = 365.2422;

  const baseSim: SimulationSummaryInput = {
    totalDays: 10 * TROPICAL_YEAR_DAYS,
    earthMoonDistanceKm: 384400,
    orbitalTiltDeg: 5.145,
    counts: {
      solar: { partial: 3, annular: 2, total: 1 },
      lunar: { penumbral: 4, partial: 2, total: 1 },
      newWindows: 120,
      fullWindows: 120,
    },
    sampleEvents: [],
  };

  it("shows simulation years", () => {
    const result = formatSimSummary(baseSim, TROPICAL_YEAR_DAYS);
    expect(result).toContain("Simulated 10 year(s)");
  });

  it("includes distance and tilt", () => {
    const result = formatSimSummary(baseSim, TROPICAL_YEAR_DAYS);
    expect(result).toContain("i=5.145 deg");
  });

  it("includes syzygy counts", () => {
    const result = formatSimSummary(baseSim, TROPICAL_YEAR_DAYS);
    expect(result).toContain("New=120");
    expect(result).toContain("Full=120");
  });

  it("includes solar eclipse counts", () => {
    const result = formatSimSummary(baseSim, TROPICAL_YEAR_DAYS);
    expect(result).toContain("partial=3");
    expect(result).toContain("annular=2");
    expect(result).toContain("total=1");
  });

  it("includes lunar eclipse counts", () => {
    const result = formatSimSummary(baseSim, TROPICAL_YEAR_DAYS);
    expect(result).toContain("penumbral=4");
  });

  it("shows sample events when present", () => {
    const sim = {
      ...baseSim,
      sampleEvents: ["Year 1.50: Solar Total solar"],
    };
    const result = formatSimSummary(sim, TROPICAL_YEAR_DAYS);
    expect(result).toContain("Examples:");
    expect(result).toContain("- Year 1.50: Solar Total solar");
  });

  it("limits sample events to 10", () => {
    const sim = {
      ...baseSim,
      sampleEvents: Array.from({ length: 15 }, (_, i) => `Event ${i}`),
    };
    const result = formatSimSummary(sim, TROPICAL_YEAR_DAYS);
    const eventLines = result.split("\n").filter((l) => l.startsWith("- "));
    expect(eventLines.length).toBe(10);
  });

  it("omits Examples section when no events", () => {
    const result = formatSimSummary(baseSim, TROPICAL_YEAR_DAYS);
    expect(result).not.toContain("Examples:");
  });
});

describe("DISTANCE_PRESETS_KM", () => {
  it("has perigee < mean < apogee", () => {
    expect(DISTANCE_PRESETS_KM.perigee).toBeLessThan(DISTANCE_PRESETS_KM.mean);
    expect(DISTANCE_PRESETS_KM.mean).toBeLessThan(DISTANCE_PRESETS_KM.apogee);
  });

  it("perigee is 363300 km", () => {
    expect(DISTANCE_PRESETS_KM.perigee).toBe(363300);
  });

  it("mean is 384400 km", () => {
    expect(DISTANCE_PRESETS_KM.mean).toBe(384400);
  });

  it("apogee is 405500 km", () => {
    expect(DISTANCE_PRESETS_KM.apogee).toBe(405500);
  });
});

describe("snapToNearestPreset", () => {
  it("snaps to perigee for close values", () => {
    expect(snapToNearestPreset(363000)).toBe("perigee");
  });

  it("snaps to mean for close values", () => {
    expect(snapToNearestPreset(384000)).toBe("mean");
  });

  it("snaps to apogee for close values", () => {
    expect(snapToNearestPreset(406000)).toBe("apogee");
  });

  it("snaps to exact preset values", () => {
    expect(snapToNearestPreset(363300)).toBe("perigee");
    expect(snapToNearestPreset(384400)).toBe("mean");
    expect(snapToNearestPreset(405500)).toBe("apogee");
  });

  it("snaps boundary between perigee and mean", () => {
    const midpoint = (363300 + 384400) / 2;
    // Right at midpoint, should snap to one or the other consistently
    const result = snapToNearestPreset(midpoint);
    expect(["perigee", "mean"]).toContain(result);
  });

  it("handles extreme values", () => {
    expect(snapToNearestPreset(0)).toBe("perigee");
    expect(snapToNearestPreset(1e6)).toBe("apogee");
  });
});

describe("svgPointToAngleDeg", () => {
  // The function uses SVG rendering convention: 0=right, angles increase
  // clockwise (matching cos(a) for x, sin(a) for y in SVG coords).

  it("returns 0 for point directly to the right", () => {
    expect(svgPointToAngleDeg(0, 0, 10, 0)).toBeCloseTo(0, 5);
  });

  it("returns 90 for point directly below (SVG y-down = clockwise 90)", () => {
    // In SVG rendering: sin(90) = 1 => y = center + r => below center
    expect(svgPointToAngleDeg(0, 0, 0, 10)).toBeCloseTo(90, 5);
  });

  it("returns 180 for point directly to the left", () => {
    expect(svgPointToAngleDeg(0, 0, -10, 0)).toBeCloseTo(180, 5);
  });

  it("returns 270 for point directly above (SVG y-up = clockwise 270)", () => {
    // In SVG rendering: sin(270) = -1 => y = center - r => above center
    expect(svgPointToAngleDeg(0, 0, 0, -10)).toBeCloseTo(270, 5);
  });

  it("returns 315 for upper-right diagonal (clockwise from right)", () => {
    // dx=10, dy=-10 => atan2(-10, 10) = -45 => +360 = 315
    expect(svgPointToAngleDeg(0, 0, 10, -10)).toBeCloseTo(315, 5);
  });

  it("returns 225 for upper-left diagonal", () => {
    // dx=-10, dy=-10 => atan2(-10, -10) = -135 => +360 = 225
    expect(svgPointToAngleDeg(0, 0, -10, -10)).toBeCloseTo(225, 5);
  });

  it("works with non-zero center coordinates", () => {
    // Point at (120, 50) relative to center (100, 60) => dx=20, dy=-10
    // atan2(-10, 20) ~ -26.57 deg => +360 = 333.43 deg
    expect(svgPointToAngleDeg(100, 60, 120, 50)).toBeCloseTo(360 - 26.565, 1);
  });

  it("always returns a value in [0, 360)", () => {
    const angles = [
      svgPointToAngleDeg(0, 0, 10, 0),
      svgPointToAngleDeg(0, 0, 0, -10),
      svgPointToAngleDeg(0, 0, -10, 0),
      svgPointToAngleDeg(0, 0, 0, 10),
    ];
    for (const a of angles) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(360);
    }
  });

  it("round-trips with orbit rendering convention", () => {
    // Rendering: x = cx + r*cos(angle), y = cy + r*sin(angle)
    // Drag should recover the same angle from (x, y)
    for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const rad = (angle * Math.PI) / 180;
      const r = 140;
      const x = r * Math.cos(rad);
      const y = r * Math.sin(rad);
      expect(svgPointToAngleDeg(0, 0, x, y)).toBeCloseTo(angle, 3);
    }
  });
});

describe("buildBetaCurvePath", () => {
  /** Simple ecliptic latitude model: tilt * sin(moonLon - nodeLon) */
  const eclipticLatDeg = (moonLonDeg: number, tiltDeg: number, nodeLonDeg: number) =>
    tiltDeg * Math.sin(((moonLonDeg - nodeLonDeg) * Math.PI) / 180);

  const baseArgs = {
    tiltDeg: 5.145,
    nodeLonDeg: 0,
    panelX: 0,
    panelWidth: 200,
    panelCenterY: 100,
    yScale: 10,
    eclipticLatDeg,
  };

  it("starts with M (moveto)", () => {
    const path = buildBetaCurvePath(baseArgs);
    expect(path).toMatch(/^M/);
  });

  it("contains the expected number of L segments", () => {
    // default steps = 72 => 1 M + 72 L = 73 points total => 72 L commands
    const path = buildBetaCurvePath(baseArgs);
    const lCount = (path.match(/ L /g) || []).length;
    expect(lCount).toBe(72);
  });

  it("respects custom steps parameter", () => {
    const path = buildBetaCurvePath({ ...baseArgs, steps: 36 });
    const lCount = (path.match(/ L /g) || []).length;
    expect(lCount).toBe(36);
  });

  it("produces a flat line when tilt is 0", () => {
    const path = buildBetaCurvePath({ ...baseArgs, tiltDeg: 0 });
    // All y values should be at panelCenterY (100)
    const points = path.replace("M ", "").split(" L ").map((p) => {
      const [, y] = p.split(",");
      return parseFloat(y);
    });
    for (const y of points) {
      expect(y).toBeCloseTo(100, 2);
    }
  });

  it("y-values reflect sinusoidal shape (extremes at tilt amplitude)", () => {
    const path = buildBetaCurvePath(baseArgs);
    const points = path.replace("M ", "").split(" L ").map((p) => {
      const [, y] = p.split(",");
      return parseFloat(y);
    });
    const minY = Math.min(...points);
    const maxY = Math.max(...points);
    // Amplitude = tilt * yScale = 5.145 * 10 = 51.45
    // Positive beta (above ecliptic) => smaller y in SVG (negated)
    // So: min y ~ panelCenterY - amplitude, max y ~ panelCenterY + amplitude
    expect(minY).toBeCloseTo(100 - 5.145 * 10, 0);
    expect(maxY).toBeCloseTo(100 + 5.145 * 10, 0);
  });

  it("x-values span from panelX to panelX + panelWidth", () => {
    const path = buildBetaCurvePath(baseArgs);
    const points = path.replace("M ", "").split(" L ").map((p) => {
      const [x] = p.split(",");
      return parseFloat(x);
    });
    expect(points[0]).toBeCloseTo(0, 1);
    expect(points[points.length - 1]).toBeCloseTo(200, 1);
  });
});

describe("sliderToYears", () => {
  it("maps 0 to 1 year", () => {
    expect(sliderToYears(0)).toBeCloseTo(1, 5);
  });

  it("maps 100 to 1000 years", () => {
    expect(sliderToYears(100)).toBeCloseTo(1000, 5);
  });

  it("maps 33.333 to ~10 years", () => {
    expect(sliderToYears(100 / 3)).toBeCloseTo(10, 0);
  });

  it("maps 66.667 to ~100 years", () => {
    expect(sliderToYears(200 / 3)).toBeCloseTo(100, 0);
  });

  it("is monotonically increasing", () => {
    let prev = sliderToYears(0);
    for (let v = 1; v <= 100; v++) {
      const cur = sliderToYears(v);
      expect(cur).toBeGreaterThan(prev);
      prev = cur;
    }
  });
});

describe("yearsToSlider", () => {
  it("maps 1 year to 0", () => {
    expect(yearsToSlider(1)).toBeCloseTo(0, 5);
  });

  it("maps 1000 years to 100", () => {
    expect(yearsToSlider(1000)).toBeCloseTo(100, 5);
  });

  it("maps 10 years to ~33.3", () => {
    expect(yearsToSlider(10)).toBeCloseTo(100 / 3, 1);
  });

  it("round-trips with sliderToYears", () => {
    for (const v of [0, 10, 25, 50, 75, 100]) {
      const years = sliderToYears(v);
      expect(yearsToSlider(years)).toBeCloseTo(v, 3);
    }
  });

  it("clamps values below 1 to slider 0", () => {
    expect(yearsToSlider(0)).toBe(0);
    expect(yearsToSlider(-5)).toBe(0);
  });
});

describe("formatYearsLabel", () => {
  it("formats small values without commas", () => {
    expect(formatYearsLabel(10)).toBe("10");
  });

  it("formats 1000 with locale string", () => {
    // Note: toLocaleString is locale-dependent, but 1000 is commonly "1,000"
    const result = formatYearsLabel(1000);
    expect(result).toMatch(/1[,.]?000/);
  });

  it("rounds to nearest integer", () => {
    expect(formatYearsLabel(10.7)).toBe("11");
    expect(formatYearsLabel(3.14)).toBe("3");
  });
});

describe("checkWhyNotEveryMonth", () => {
  it("correct when Full Moon and no lunar eclipse", () => {
    const result = checkWhyNotEveryMonth({
      phaseAngleDeg: 180,
      lunarType: "none",
      angularSep: angularSeparationDeg,
    });
    expect(result.correct).toBe(true);
  });

  it("close when Full Moon but eclipse present", () => {
    const result = checkWhyNotEveryMonth({
      phaseAngleDeg: 180,
      lunarType: "total-lunar",
      angularSep: angularSeparationDeg,
    });
    expect(result.correct).toBe(false);
    expect(result.close).toBe(true);
  });

  it("wrong when not near Full Moon", () => {
    const result = checkWhyNotEveryMonth({
      phaseAngleDeg: 90,
      lunarType: "none",
      angularSep: angularSeparationDeg,
    });
    expect(result.correct).toBe(false);
    expect(result.close).toBe(false);
  });

  it("accepts Full Moon within tolerance (175 deg)", () => {
    const result = checkWhyNotEveryMonth({
      phaseAngleDeg: 175,
      lunarType: "none",
      angularSep: angularSeparationDeg,
    });
    expect(result.correct).toBe(true);
  });

  it("rejects phase angle far from Full Moon (140 deg)", () => {
    const result = checkWhyNotEveryMonth({
      phaseAngleDeg: 140,
      lunarType: "none",
      angularSep: angularSeparationDeg,
    });
    expect(result.correct).toBe(false);
  });
});

describe("checkEclipseStatistics", () => {
  const baseCounts = {
    solar: { partial: 5, annular: 3, total: 1 },
    lunar: { penumbral: 8, partial: 3, total: 1 },
    newWindows: 130,
    fullWindows: 130,
  };

  it("correct when >= 9 years and eclipses found", () => {
    const result = checkEclipseStatistics({
      yearsSimulated: 10,
      totalEclipses: 21,
      counts: baseCounts,
    });
    expect(result.correct).toBe(true);
  });

  it("wrong when < 9 years", () => {
    const result = checkEclipseStatistics({
      yearsSimulated: 5,
      totalEclipses: 10,
      counts: baseCounts,
    });
    expect(result.correct).toBe(false);
  });

  it("wrong when no eclipses detected", () => {
    const result = checkEclipseStatistics({
      yearsSimulated: 20,
      totalEclipses: 0,
      counts: {
        ...baseCounts,
        solar: { partial: 0, annular: 0, total: 0 },
        lunar: { penumbral: 0, partial: 0, total: 0 },
      },
    });
    expect(result.correct).toBe(false);
  });

  it("close when years is between 5 and 9", () => {
    const result = checkEclipseStatistics({
      yearsSimulated: 7,
      totalEclipses: 10,
      counts: baseCounts,
    });
    expect(result.correct).toBe(false);
    expect(result.close).toBe(true);
  });

  it("provides a message with eclipse breakdown", () => {
    const result = checkEclipseStatistics({
      yearsSimulated: 15,
      totalEclipses: 21,
      counts: baseCounts,
    });
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe("string");
  });
});

/* ------------------------------------------------------------------ */
/*  animate-month rate constants (physics identity)                    */
/* ------------------------------------------------------------------ */

describe("animate-month rate constants", () => {
  it("PHASE_RATE equals MOON_RATE minus SUN_RATE (synodic identity)", () => {
    // Synodic rate = sidereal moon rate - sun rate
    // This is the fundamental relationship: 1/P_syn = 1/P_sid - 1/P_orb
    const sunRate = 360 / 365.2422; // deg/day (tropical year)
    const moonRate = 360 / 27.321661; // deg/day (sidereal month)
    const synodicRate = 360 / 29.530589; // deg/day (synodic month)
    expect(moonRate - sunRate).toBeCloseTo(synodicRate, 2);
  });
});
