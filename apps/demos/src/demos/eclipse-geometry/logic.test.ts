import { describe, it, expect, vi } from "vitest";
import { AstroConstants } from "@cosmic/physics";
import {
  clamp,
  formatNumber,
  formatSignedBeta,
  phaseInfo,
  outcomeLabel,
  computeDerived,
  buildStationRow,
  formatSimSummary,
  formatSimTable,
  DISTANCE_PRESETS_KM,
  snapToNearestPreset,
  svgPointToAngleDeg,
  buildBetaCurvePath,
  sliderToYears,
  yearsToSlider,
  formatYearsLabel,
  checkWhyNotEveryMonth,
  checkEclipseStatistics,
  contextualMessage,
  eclipseArcExtentDeg,
  buildArcPath,
  totalSolarPreset,
  lunarEclipsePreset,
  noEclipsePreset,
} from "./logic";
import type { EclipseModelCallbacks, EclipseDemoState, SimulationSummaryInput } from "./logic";

/* ------------------------------------------------------------------ */
/*  Stub physics model for DI                                         */
/* ------------------------------------------------------------------ */

/**
 * Minimal reimplementation of the physics model callbacks.
 * This avoids importing the eclipse model from @cosmic/physics in these tests (DI pattern);
 * the real model is tested in packages/physics.
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

const EM_DASH = "—";
const TROPICAL_YEAR_DAYS = 365.2422;

/* ================================================================== */
/*  Utility                                                           */
/* ================================================================== */

describe("clamp", () => {
  it.each([
    ["inside the range", 5, 0, 10, 5],
    ["below the minimum", -3, 0, 10, 0],
    ["above the maximum", 15, 0, 10, 10],
    ["a degenerate range", 5, 3, 3, 3],
  ])("%s", (_case, value, min, max, expected) => {
    expect(clamp(value, min, max)).toBe(expected);
  });
});

describe("formatNumber", () => {
  it("rounds through toFixed (IEEE 754: 5.145 is stored just below the tie)", () => {
    expect(formatNumber(3.14159, 2)).toBe("3.14");
    expect(formatNumber(5.145, 2)).toBe("5.14");
    expect(formatNumber(5.155, 2)).toBe("5.16");
    expect(formatNumber(2.725, 0)).toBe("3");
    expect(formatNumber(0, 3)).toBe("0.000");
    expect(formatNumber(-1.5, 1)).toBe("-1.5");
  });

  it.each([NaN, Infinity, -Infinity])("returns an em dash for %s", (value) => {
    expect(formatNumber(value, 2)).toBe(EM_DASH);
  });
});

describe("formatSignedBeta", () => {
  it.each([
    [2.5, 3, "+2.500"],
    [-1.23, 3, "-1.230"],
    [0, 3, "0.000"], // exactly zero carries no sign
    [5.145, 2, "+5.14"], // rounds like formatNumber
    [-3.7, 1, "-3.7"],
  ])("formatSignedBeta(%f, %i) = %s", (beta, decimals, expected) => {
    expect(formatSignedBeta(beta, decimals)).toBe(expected);
  });
});

/* ================================================================== */
/*  Phase and outcome labels                                          */
/* ================================================================== */

describe("phaseInfo", () => {
  // [phase angle (deg), label, isNew, isFull]. Both flags are asserted on every row, and
  // waxing and waning phases are sampled at asymmetric angles so a swap cannot pass.
  const cases: Array<[number, string, boolean, boolean]> = [
    [0, "New Moon", true, false],
    [8, "New Moon", true, false],
    [10, "New Moon", true, false], // the +/-10 deg window is inclusive
    [11, "Waxing crescent", false, false],
    [355, "New Moon", true, false], // wraps past 360
    [349, "Waning crescent", false, false],
    [-5, "New Moon", true, false], // negative input is normalised first
    [30, "Waxing crescent", false, false],
    [90, "First quarter", false, false],
    [101, "Waxing gibbous", false, false],
    [120, "Waxing gibbous", false, false],
    [172, "Full Moon", false, true],
    [180, "Full Moon", false, true],
    [210, "Waning gibbous", false, false],
    [270, "Third quarter", false, false],
    [320, "Waning crescent", false, false],
  ];

  it.each(cases)("%f deg is %s", (angle, label, isNew, isFull) => {
    expect(phaseInfo(angle, angularSeparationDeg, normalizeAngleDeg)).toEqual({
      label,
      isNew,
      isFull,
    });
  });
});

describe("outcomeLabel", () => {
  it.each([
    ["none", "None"],
    ["partial-solar", "Partial solar"],
    ["annular-solar", "Annular solar"],
    ["total-solar", "Total solar"],
    ["penumbral-lunar", "Penumbral lunar"],
    ["partial-lunar", "Partial lunar"],
    ["total-lunar", "Total lunar"],
    ["hypothetical", "hypothetical"], // unknown types pass through
  ])("maps %s to %s", (type, label) => {
    expect(outcomeLabel(type)).toBe(label);
  });
});

/* ================================================================== */
/*  computeDerived                                                    */
/* ================================================================== */

describe("computeDerived", () => {
  const BASE = {
    sunLonDeg: 0,
    moonLonDeg: 0,
    nodeLonDeg: 0,
    orbitalTiltDeg: 5.145,
    earthMoonDistanceKm: 384400,
  };
  const derive = (overrides: Partial<typeof BASE> = {}) =>
    computeDerived({ ...BASE, ...overrides }, stubModel);

  it("New Moon on the node is a total solar eclipse and not a lunar one", () => {
    const r = derive();
    expect(r.phaseAngleDeg).toBe(0);
    expect(r.betaDeg).toBeCloseTo(0, 10);
    expect(r.solarType).toBe("total-solar");
    expect(r.lunarType).toBe("none");
  });

  it("Full Moon on the opposite node is a total lunar eclipse and not a solar one", () => {
    const r = derive({ moonLonDeg: 180 });
    expect(r.phaseAngleDeg).toBe(180);
    expect(r.lunarType).toBe("total-lunar");
    expect(r.solarType).toBe("none");
  });

  it("beta follows the sign of the latitude and absBeta its magnitude", () => {
    const north = derive({ moonLonDeg: 90 });
    expect(north.betaDeg).toBeCloseTo(5.145, 6);
    expect(north.absBetaDeg).toBeCloseTo(5.145, 6);
    const south = derive({ moonLonDeg: 270 });
    expect(south.betaDeg).toBeCloseTo(-5.145, 6);
    expect(south.absBetaDeg).toBeCloseTo(5.145, 6);
  });

  it("no eclipse at New Moon when the node is a quarter orbit away", () => {
    const r = derive({ nodeLonDeg: 90 });
    expect(r.nearestNodeDeg).toBe(90);
    expect(r.solarType).toBe("none");
  });

  it("no eclipse away from syzygy even with the Moon exactly on a node", () => {
    const r = derive({ moonLonDeg: 45, nodeLonDeg: 45 });
    expect(r.solarType).toBe("none");
    expect(r.lunarType).toBe("none");
  });

  // The syzygy window is +/-5 deg about New (0) and Full (180); the edge is inclusive. The
  // node follows the Moon so beta = 0 and only the phase window decides the outcome.
  const syzygyWindowCases: Array<[number, "solarType" | "lunarType", boolean]> = [
    [5, "solarType", true],
    [5.01, "solarType", false],
    [355, "solarType", true],
    [354.99, "solarType", false],
    [175, "lunarType", true],
    [174.99, "lunarType", false],
    [185, "lunarType", true],
    [185.01, "lunarType", false],
  ];
  it.each(syzygyWindowCases)("Moon at %f deg: %s evaluated is %s", (moonLonDeg, key, expected) => {
    const r = derive({ moonLonDeg, nodeLonDeg: moonLonDeg });
    expect(r[key] !== "none").toBe(expected);
  });

  it("routes every input to the right model callback (asymmetric inputs)", () => {
    // Sun and Moon swapped would give 170, node and Moon swapped a different beta.
    const r = derive({
      sunLonDeg: 10,
      moonLonDeg: 200,
      nodeLonDeg: 50,
      orbitalTiltDeg: 3.0,
      earthMoonDistanceKm: 363300,
    });
    expect(r.phaseAngleDeg).toBe(190);
    expect(r.betaDeg).toBeCloseTo(3.0 * Math.sin((150 * Math.PI) / 180), 10);
    expect(r.nearestNodeDeg).toBe(30); // descending node at 230
    expect(r).toMatchObject({
      sunLonDeg: 10,
      moonLonDeg: 200,
      nodeLonDeg: 50,
      orbitalTiltDeg: 3.0,
      earthMoonDistanceKm: 363300,
    });
  });

  it("passes beta and the Earth-Moon distance to the eclipse-type callback of the right syzygy only", () => {
    // The stub ignores distance, so record the arguments instead.
    const solarEclipseType = vi.fn(stubModel.solarEclipseType);
    const lunarEclipseType = vi.fn(stubModel.lunarEclipseType);
    const model = { ...stubModel, solarEclipseType, lunarEclipseType };

    computeDerived({ ...BASE, earthMoonDistanceKm: 363300 }, model); // New Moon
    expect(solarEclipseType).toHaveBeenCalledTimes(1);
    expect(solarEclipseType.mock.calls[0][0].earthMoonDistanceKm).toBe(363300);
    expect(solarEclipseType.mock.calls[0][0].betaDeg).toBeCloseTo(0, 10);
    expect(lunarEclipseType).not.toHaveBeenCalled();

    computeDerived({ ...BASE, moonLonDeg: 180, earthMoonDistanceKm: 405500 }, model); // Full Moon
    expect(lunarEclipseType).toHaveBeenCalledTimes(1);
    expect(lunarEclipseType.mock.calls[0][0].earthMoonDistanceKm).toBe(405500);
    expect(solarEclipseType).toHaveBeenCalledTimes(1);
  });
});

/* ================================================================== */
/*  Station row                                                       */
/* ================================================================== */

describe("buildStationRow", () => {
  const baseRow = {
    label: "Test case",
    phaseLabel: "New Moon",
    phaseAngleDeg: 2.5,
    absBetaDeg: 0.123,
    nearestNodeDeg: 5.67,
    orbitalTiltDeg: 5.145,
    earthMoonDistanceKm: 384400,
    outcome: "Total solar",
  };

  it("formats every field at its documented precision", () => {
    expect(buildStationRow(baseRow)).toEqual({
      case: "Test case",
      phase: "New Moon",
      phaseAngleDeg: "2.5",
      absBetaDeg: "0.123",
      nearestNodeDeg: "5.67",
      tiltDeg: "5.145",
      earthMoonDistanceKm: "384400",
      outcome: "Total solar",
    });
  });

  it("shows an em dash for non-finite angles", () => {
    const row = buildStationRow({
      ...baseRow,
      phaseAngleDeg: NaN,
      absBetaDeg: Infinity,
      nearestNodeDeg: -Infinity,
    });
    expect(row.phaseAngleDeg).toBe(EM_DASH);
    expect(row.absBetaDeg).toBe(EM_DASH);
    expect(row.nearestNodeDeg).toBe(EM_DASH);
  });

  it("rounds the distance to the nearest kilometre", () => {
    expect(buildStationRow({ ...baseRow, earthMoonDistanceKm: 384400.7 }).earthMoonDistanceKm).toBe(
      "384401"
    );
  });
});

/* ================================================================== */
/*  Simulation summary and table                                      */
/* ================================================================== */

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

describe("formatSimSummary", () => {
  it("renders the header, syzygy count and both eclipse-count lines, and no Examples section", () => {
    const km = Math.round(384400).toLocaleString(); // grouping separator is locale-dependent
    expect(formatSimSummary(baseSim, TROPICAL_YEAR_DAYS)).toBe(
      [
        `Simulated 10 year(s) @ distance=${km} km, i=5.145 deg`,
        "Syzygies checked: New=120, Full=120",
        "Solar eclipses: partial=3, annular=2, total=1",
        "Lunar eclipses: penumbral=4, partial=2, total=1",
      ].join("\n")
    );
  });

  it("appends an Examples section holding the first 10 sample events", () => {
    const sampleEvents = Array.from({ length: 15 }, (_, i) => `Event ${i}`);
    const lines = formatSimSummary({ ...baseSim, sampleEvents }, TROPICAL_YEAR_DAYS).split("\n");
    expect(lines.slice(4)).toEqual([
      "",
      "Examples:",
      ...sampleEvents.slice(0, 10).map((e) => `- ${e}`),
    ]);
  });
});

describe("formatSimTable", () => {
  it("counts eclipses by body and reports whole years", () => {
    const { rows, summary } = formatSimTable(baseSim, TROPICAL_YEAR_DAYS);
    expect(rows).toEqual([]);
    expect(summary).toEqual({ solarCount: 6, lunarCount: 7, years: 10 }); // 3+2+1, 4+2+1
  });

  it.each([
    [10.4, 10],
    [10.6, 11],
  ])("rounds %f simulated years to %i", (years, expected) => {
    const sim = { ...baseSim, totalDays: years * TROPICAL_YEAR_DAYS };
    expect(formatSimTable(sim, TROPICAL_YEAR_DAYS).summary.years).toBe(expected);
  });

  it("parses the strings main.ts emits into structured rows", () => {
    const sim: SimulationSummaryInput = {
      ...baseSim,
      sampleEvents: [
        "Year 1.50: Solar Total solar (abs(beta)=0.300 deg, Delta~0 deg)",
        "Year 3.22: Lunar Penumbral lunar (abs(beta)=1.200 deg, Delta~180 deg)",
        "Year 4.80: Solar Partial solar (abs(beta)=1.200 deg, Delta~0 deg)",
      ],
    };
    expect(formatSimTable(sim, TROPICAL_YEAR_DAYS).rows).toEqual([
      { year: 1.5, type: "Total solar", details: "abs(beta)=0.300 deg, Delta~0 deg", category: "solar" },
      {
        year: 3.22,
        type: "Penumbral lunar",
        details: "abs(beta)=1.200 deg, Delta~180 deg",
        category: "lunar",
      },
      { year: 4.8, type: "Partial solar", details: "abs(beta)=1.200 deg, Delta~0 deg", category: "solar" },
    ]);
  });

  it("keeps an unparseable event as a fallback row instead of dropping it", () => {
    const sim = { ...baseSim, sampleEvents: ["This is not a valid event string"] };
    expect(formatSimTable(sim, TROPICAL_YEAR_DAYS).rows).toEqual([
      { year: 0, type: "This is not a valid event string", details: "", category: "solar" },
    ]);
  });
});

/* ================================================================== */
/*  Distance presets                                                  */
/* ================================================================== */

describe("DISTANCE_PRESETS_KM", () => {
  it("holds the perigee, mean and apogee Earth-Moon distances in km", () => {
    expect(DISTANCE_PRESETS_KM).toEqual({ perigee: 363300, mean: 384400, apogee: 405500 });
  });
});

describe("snapToNearestPreset", () => {
  it.each([
    [0, "perigee"],
    [363000, "perigee"],
    [363300, "perigee"],
    [373849, "perigee"], // just below the perigee/mean midpoint, 373850
    [373851, "mean"],
    [384000, "mean"],
    [384400, "mean"],
    [394949, "mean"], // just below the mean/apogee midpoint, 394950
    [394951, "apogee"],
    [405500, "apogee"],
    [406000, "apogee"],
    [1e6, "apogee"],
  ])("%f km snaps to %s", (km, expected) => {
    expect(snapToNearestPreset(km)).toBe(expected);
  });
});

/* ================================================================== */
/*  SVG geometry                                                      */
/* ================================================================== */

describe("svgPointToAngleDeg", () => {
  // SVG rendering convention: 0 = right, angles increase clockwise on screen (y points down).
  it.each([
    ["right", 10, 0, 0],
    ["lower right", 10, 10, 45],
    ["below", 0, 10, 90],
    ["lower left", -10, 10, 135],
    ["left", -10, 0, 180],
    ["upper left", -10, -10, 225],
    ["above", 0, -10, 270],
    ["upper right", 10, -10, 315],
  ])("a point %s of the centre is at %f deg", (_where, dx, dy, expected) => {
    expect(svgPointToAngleDeg(0, 0, dx, dy)).toBeCloseTo(expected, 5);
  });

  it("measures from a non-zero centre", () => {
    // (120, 50) from centre (100, 60): dx = 20, dy = -10, atan2(-10, 20) = -26.565 deg.
    expect(svgPointToAngleDeg(100, 60, 120, 50)).toBeCloseTo(360 - 26.565, 2);
  });

  it("inverts the orbit rendering x = r cos(a), y = r sin(a)", () => {
    for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const rad = (angle * Math.PI) / 180;
      expect(svgPointToAngleDeg(0, 0, 140 * Math.cos(rad), 140 * Math.sin(rad))).toBeCloseTo(angle, 3);
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

  /** Parse "M x,y L x,y ..." into numeric points. */
  const parsePoints = (path: string) =>
    path.replace("M ", "").split(" L ").map((p) => {
      const [x, y] = p.split(",").map(parseFloat);
      return { x, y };
    });

  it.each([
    [undefined, 72], // default sampling
    [36, 36],
  ])("steps=%s gives one moveto and %i lineto segments", (steps, expectedSegments) => {
    const path = buildBetaCurvePath({ ...baseArgs, steps });
    expect(path.startsWith("M ")).toBe(true);
    expect(path.match(/ L /g)).toHaveLength(expectedSegments);
  });

  it("is a flat line on the centre when the tilt is 0", () => {
    for (const { y } of parsePoints(buildBetaCurvePath({ ...baseArgs, tiltDeg: 0 }))) {
      expect(y).toBeCloseTo(100, 2);
    }
  });

  it("spans the panel in x and plots positive beta above the centre line (smaller SVG y)", () => {
    const points = parsePoints(buildBetaCurvePath(baseArgs));
    expect(points[0].x).toBeCloseTo(0, 1);
    expect(points[points.length - 1].x).toBeCloseTo(200, 1);

    // Moon 90 deg past the node (a quarter of the way along) is the northern extreme.
    expect(points[18].x).toBeCloseTo(50, 1);
    expect(points[18].y).toBeCloseTo(100 - 5.145 * 10, 1);
    // ... and 270 deg past the node is the southern extreme, below the centre line.
    expect(points[54].y).toBeCloseTo(100 + 5.145 * 10, 1);
  });
});

describe("eclipseArcExtentDeg", () => {
  it("is 180 (eclipses possible everywhere) at zero tilt, without consulting the physics callback", () => {
    const deltaLambdaFromBetaDeg = vi.fn((_a: { tiltDeg: number; betaDeg: number }) => 0);
    expect(eclipseArcExtentDeg({ tiltDeg: 0, thresholdBetaDeg: 1.5, deltaLambdaFromBetaDeg })).toBe(180);
    expect(deltaLambdaFromBetaDeg).not.toHaveBeenCalled();
  });

  it("otherwise returns the callback's longitude offset for (tilt, threshold beta)", () => {
    const deltaLambdaFromBetaDeg = vi.fn((_a: { tiltDeg: number; betaDeg: number }) => 16.97);
    const extent = eclipseArcExtentDeg({ tiltDeg: 5.145, thresholdBetaDeg: 1.5, deltaLambdaFromBetaDeg });
    expect(extent).toBe(16.97);
    expect(deltaLambdaFromBetaDeg).toHaveBeenCalledTimes(1);
    expect(deltaLambdaFromBetaDeg).toHaveBeenCalledWith({ tiltDeg: 5.145, betaDeg: 1.5 });
  });
});

describe("buildArcPath", () => {
  const circle = { cx: 200, cy: 200, r: 140 };

  it("sweeps clockwise on screen from the start to the end angle (asymmetric 15 to 75 deg)", () => {
    // Angles are measured clockwise from 3 o'clock with SVG y pointing down:
    // (200 + 140 cos 15, 200 + 140 sin 15) -> (200 + 140 cos 75, 200 + 140 sin 75).
    expect(buildArcPath({ ...circle, centerAngleDeg: 45, halfExtentDeg: 30 })).toBe(
      "M 335.23 236.23 A 140 140 0 0 1 236.23 335.23"
    );
  });

  it("sets the large-arc flag only when the swept arc exceeds 180 deg", () => {
    expect(buildArcPath({ ...circle, centerAngleDeg: 0, halfExtentDeg: 90 })).toBe(
      "M 200.00 60.00 A 140 140 0 0 1 200.00 340.00"
    );
    expect(buildArcPath({ ...circle, centerAngleDeg: 0, halfExtentDeg: 100 })).toMatch(/ A 140 140 0 1 1 /);
  });

  it("returns an empty path for zero extent", () => {
    expect(buildArcPath({ ...circle, centerAngleDeg: 90, halfExtentDeg: 0 })).toBe("");
  });

  it("draws the full circle as two semicircles from 3 o'clock for an extent of 180 deg", () => {
    expect(buildArcPath({ ...circle, centerAngleDeg: 45, halfExtentDeg: 180 })).toBe(
      "M 340 200 A 140 140 0 1 1 60 200 A 140 140 0 1 1 340 200"
    );
  });
});

/* ================================================================== */
/*  Eclipse presets                                                   */
/* ================================================================== */

describe("eclipse presets", () => {
  it.each([0, 90, 350])("totalSolarPreset puts the Moon and the node on the Sun (sun at %f deg)", (sun) => {
    expect(totalSolarPreset({ sunLonDeg: sun })).toEqual({ moonLonDeg: sun, nodeLonDeg: sun });
  });

  it.each([
    [0, 180],
    [200, 20],
    [350, 170], // wraps past 360
  ])("lunarEclipsePreset opposes the Sun (sun at %f deg, Moon at %f deg) with the node on the Sun", (sun, moon) => {
    expect(lunarEclipsePreset({ sunLonDeg: sun })).toEqual({ moonLonDeg: moon, nodeLonDeg: sun });
  });

  it.each([
    [0, 90],
    [300, 30], // wraps past 360
  ])("noEclipsePreset puts the Moon 90 deg from the node at %f deg", (node, moon) => {
    expect(noEclipsePreset({ sunLonDeg: 0, nodeLonDeg: node })).toEqual({ moonLonDeg: moon });
  });

  // The presets exist to deliver the outcome their labels promise, so check them end to end
  // through computeDerived, at several Sun/node longitudes rather than only at 0.
  const derive = (args: { sunLonDeg: number; moonLonDeg: number; nodeLonDeg: number }) =>
    computeDerived({ ...args, orbitalTiltDeg: 5.145, earthMoonDistanceKm: 384400 }, stubModel);

  it.each([0, 37, 200])("total solar and lunar presets produce their eclipse (sun at %f deg)", (sunLonDeg) => {
    expect(derive({ sunLonDeg, ...totalSolarPreset({ sunLonDeg }) }).solarType).toBe("total-solar");
    expect(derive({ sunLonDeg, ...lunarEclipsePreset({ sunLonDeg }) }).lunarType).toBe("total-lunar");
  });

  it.each([
    [0, 0],
    [0, 90],
    [123, 45],
  ])("the no-eclipse preset yields no eclipse (sun %f deg, node %f deg)", (sunLonDeg, nodeLonDeg) => {
    const r = derive({ sunLonDeg, nodeLonDeg, ...noEclipsePreset({ sunLonDeg, nodeLonDeg }) });
    expect(r.solarType).toBe("none");
    expect(r.lunarType).toBe("none");
  });
});

/* ================================================================== */
/*  Slider <-> simulated years                                        */
/* ================================================================== */

describe("sliderToYears", () => {
  it.each([
    [0, 1],
    [100 / 3, 10],
    [200 / 3, 100],
    [100, 1000],
  ])("slider %f maps to %f years", (slider, years) => {
    expect(sliderToYears(slider)).toBeCloseTo(years, 5);
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
  it.each([
    [1, 0],
    [10, 100 / 3],
    [1000, 100],
    [0, 0], // below one year clamps to the slider minimum
    [-5, 0],
  ])("%f years maps to slider %f", (years, slider) => {
    expect(yearsToSlider(years)).toBeCloseTo(slider, 5);
  });

  it("round-trips with sliderToYears", () => {
    for (const v of [0, 10, 25, 50, 75, 100]) {
      expect(yearsToSlider(sliderToYears(v))).toBeCloseTo(v, 3);
    }
  });
});

describe("formatYearsLabel", () => {
  it("rounds to whole years", () => {
    expect(formatYearsLabel(10)).toBe("10");
    expect(formatYearsLabel(10.7)).toBe("11");
    expect(formatYearsLabel(3.14)).toBe("3");
  });

  it("groups thousands with the locale separator", () => {
    expect(formatYearsLabel(1000)).toMatch(/^1[,.\s]?000$/);
  });
});

/* ================================================================== */
/*  Challenge checks                                                  */
/* ================================================================== */

describe("checkWhyNotEveryMonth", () => {
  const check = (phaseAngleDeg: number, lunarType: string) =>
    checkWhyNotEveryMonth({ phaseAngleDeg, lunarType, angularSep: angularSeparationDeg });

  it("is correct at a Full Moon with no lunar eclipse", () => {
    expect(check(180, "none")).toMatchObject({ correct: true, close: true });
  });

  it("is close but not correct at a Full Moon that still has an eclipse", () => {
    expect(check(180, "total-lunar")).toMatchObject({ correct: false, close: true });
  });

  it("is neither correct nor close away from Full Moon", () => {
    expect(check(90, "none")).toMatchObject({ correct: false, close: false });
  });

  it.each([
    [165, true], // 15 deg before Full: the window edge is inclusive
    [195, true], // ... and 15 deg after
    [164.9, false],
    [195.1, false],
  ])("phase %f deg counts as near Full Moon: %s", (phaseAngleDeg, near) => {
    // A lunar-eclipse-free state is "correct" only when the phase is near Full Moon.
    expect(check(phaseAngleDeg, "none").correct).toBe(near);
  });
});

describe("checkEclipseStatistics", () => {
  const counts = {
    solar: { partial: 5, annular: 3, total: 1 },
    lunar: { penumbral: 8, partial: 3, total: 1 },
    newWindows: 130,
    fullWindows: 130,
  };
  const check = (yearsSimulated: number, totalEclipses = 21) =>
    checkEclipseStatistics({ yearsSimulated, totalEclipses, counts });

  it.each([
    [9, true, true], // 9 years is the first run long enough for statistics
    [8.99, false, true],
    [5, false, true], // 5 years is the first "close" run
    [4.99, false, false],
  ])("a %f-year run: correct=%s, close=%s", (years, correct, close) => {
    expect(check(years)).toMatchObject({ correct, close });
  });

  it("is wrong, and not close, when a long run found no eclipses", () => {
    const none = { ...counts, solar: { partial: 0, annular: 0, total: 0 }, lunar: { penumbral: 0, partial: 0, total: 0 } };
    expect(checkEclipseStatistics({ yearsSimulated: 20, totalEclipses: 0, counts: none })).toMatchObject({
      correct: false,
      close: false,
    });
  });

  it("reports the solar and lunar breakdown with each count in its own slot", () => {
    const { message } = check(15);
    expect(message).toContain("Over 15 years");
    expect(message).toContain("9 solar (5P + 3A + 1T)");
    expect(message).toContain("12 lunar (8Pen + 3P + 1T)");
  });
});

/* ================================================================== */
/*  contextualMessage                                                 */
/* ================================================================== */

/** Helper: build an EclipseDemoState with sensible defaults,
 *  overriding only the fields relevant to each test. */
function makeState(overrides: Partial<EclipseDemoState> = {}): EclipseDemoState {
  return {
    moonLonDeg: 0,
    sunLonDeg: 0,
    nodeLonDeg: 0,
    orbitalTiltDeg: 5.145,
    earthMoonDistanceKm: 384400,
    phaseAngleDeg: 90,
    betaDeg: 3,
    absBetaDeg: 3,
    nearestNodeDeg: 60,
    solarType: "none",
    lunarType: "none",
    ...overrides,
  };
}

// contextualMessage returns math source ($...$), written to the page with setMathText. The
// messages that carry numbers are asserted exactly so the math source cannot drift.
describe("contextualMessage", () => {
  it("announces a solar eclipse with the distance to the nearest node", () => {
    const state = makeState({ phaseAngleDeg: 1, absBetaDeg: 0.3, nearestNodeDeg: 2.34, solarType: "total-solar" });
    expect(contextualMessage(state)).toBe(
      "Total solar eclipse! Moon at New Moon, 2.3$^{\\circ}$ from nearest node."
    );
  });

  it("announces a lunar eclipse with the distance to the nearest node", () => {
    const state = makeState({ phaseAngleDeg: 179, absBetaDeg: 0.5, nearestNodeDeg: 4.56, lunarType: "partial-lunar" });
    expect(contextualMessage(state)).toBe(
      "Partial lunar eclipse! Moon at Full Moon, 4.6$^{\\circ}$ from nearest node."
    );
  });

  it("says how far |beta| is above the solar threshold when it is just out of reach", () => {
    const state = makeState({ phaseAngleDeg: 1, absBetaDeg: 1.8, nearestNodeDeg: 10 });
    expect(contextualMessage(state, { solarPartialDeg: 1.5 })).toBe(
      "Almost! $|\\beta|$ = 1.80$^{\\circ}$ — needs to be below 1.5$^{\\circ}$ for a solar eclipse."
    );
  });

  it("says how far |beta| is above the lunar threshold when it is just out of reach", () => {
    // 2.05 deg is outside the solar window (1.5 to 2.0) but inside the lunar one (1.6 to 2.1).
    const state = makeState({ phaseAngleDeg: 179, absBetaDeg: 2.05, nearestNodeDeg: 10 });
    expect(contextualMessage(state, { solarPartialDeg: 1.5, lunarPenumbralDeg: 1.6 })).toBe(
      "Almost! $|\\beta|$ = 2.05$^{\\circ}$ — needs to be below 1.6$^{\\circ}$ for a lunar eclipse."
    );
  });

  it("blames the distance from a node when New or Full Moon misses", () => {
    const state = makeState({ phaseAngleDeg: 2, absBetaDeg: 3.5, nearestNodeDeg: 40 });
    expect(contextualMessage(state)).toBe(
      "Moon is 3.5$^{\\circ}$ from the ecliptic — too far from a node for an eclipse."
    );
  });

  it("points out a node crossing that is not at New or Full Moon", () => {
    const state = makeState({ phaseAngleDeg: 90, nearestNodeDeg: 5 });
    expect(contextualMessage(state)).toContain("near a node but not at New/Full");
  });

  it("asks for a New or Full phase when the Moon is only somewhat near a node", () => {
    // nearestNodeDeg must be above 20 (not "near") and below 40 to reach this branch.
    const state = makeState({ phaseAngleDeg: 90, absBetaDeg: 1.0, nearestNodeDeg: 30 });
    expect(contextualMessage(state)).toContain("require New or Full Moon");
  });

  it("stays silent when nothing is close to an alignment", () => {
    const state = makeState({ phaseAngleDeg: 90, absBetaDeg: 4, nearestNodeDeg: 60 });
    expect(contextualMessage(state)).toBe("");
  });
});

/* ================================================================== */
/*  Month-length constants driving the animation                      */
/* ================================================================== */

describe("lunar and solar period constants", () => {
  it("satisfy the synodic identity 1/P_syn = 1/P_sid - 1/P_year (the phase advances at the Moon rate minus the Sun rate)", () => {
    const { MEAN_TROPICAL_YEAR_DAYS, MEAN_SIDEREAL_MONTH_DAYS, MEAN_SYNODIC_MONTH_DAYS } = AstroConstants.TIME;
    const moonRate = 360 / MEAN_SIDEREAL_MONTH_DAYS; // deg/day
    const sunRate = 360 / MEAN_TROPICAL_YEAR_DAYS;
    expect(moonRate - sunRate).toBeCloseTo(360 / MEAN_SYNODIC_MONTH_DAYS, 3);
  });
});
