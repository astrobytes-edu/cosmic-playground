import { describe, it, expect } from "vitest";
import {
  formatNumber,
  clamp,
  geometryHintLabel,
  formatRetrogradeState,
  formatDuration,
  seriesIndexAtDay,
  findPrevNextStationary,
  nearestRetrogradeInterval,
  plotXFromDay,
  plotYFromDeg,
  dayFromPlotX,
  orbitEllipsePoints,
  buildOrbitPath,
  advanceCursor,
  projectToSkyView,
  zodiacLabelPositions,
  presetToConfig,
  resolveDistinctPair,
  isRetrogradeDurationComparisonComplete,
  retrogradeDurationIfActiveAtCursor,
  computeDisplayState,
  type RetroModelCallbacks,
} from "./logic";

describe("formatNumber", () => {
  it("formats finite numbers to fixed digits", () => {
    expect(formatNumber(3.14159, 2)).toBe("3.14");
  });
  it("returns dash for NaN", () => {
    expect(formatNumber(NaN, 2)).toBe("\u2014");
  });
  it("returns dash for Infinity", () => {
    expect(formatNumber(Infinity, 1)).toBe("\u2014");
  });
  it("handles zero", () => {
    expect(formatNumber(0, 3)).toBe("0.000");
  });
  it("handles negative numbers", () => {
    expect(formatNumber(-1.5, 1)).toBe("-1.5");
  });
});

describe("clamp", () => {
  it("returns value when in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("clamps to min", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
  it("clamps to max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it("handles equal min and max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe("geometryHintLabel", () => {
  it("returns inferior-planet for target inside observer", () => {
    expect(geometryHintLabel(1.0, 0.72)).toBe("Inferior-planet geometry");
  });
  it("returns superior-planet for target outside observer", () => {
    expect(geometryHintLabel(1.0, 1.52)).toBe("Superior-planet geometry");
  });
  it("returns empty for same orbit", () => {
    expect(geometryHintLabel(1.0, 1.0)).toBe("");
  });
});

describe("formatRetrogradeState", () => {
  it("returns Direct for positive slope", () => {
    expect(formatRetrogradeState(0.5)).toBe("Direct");
  });
  it("returns Retrograde for negative slope", () => {
    expect(formatRetrogradeState(-0.3)).toBe("Retrograde");
  });
  it("returns Stationary for zero slope", () => {
    expect(formatRetrogradeState(0)).toBe("Stationary");
  });
  it("returns dash for NaN", () => {
    expect(formatRetrogradeState(NaN)).toBe("\u2014");
  });
});

describe("formatDuration", () => {
  it("formats interval duration in days", () => {
    expect(formatDuration(100, 172.5)).toBe("72.5");
  });
  it("returns dash if either bound is NaN", () => {
    expect(formatDuration(NaN, 100)).toBe("\u2014");
  });
});

describe("seriesIndexAtDay", () => {
  it("maps cursor day to array index", () => {
    expect(seriesIndexAtDay(1.0, 0, 0.25)).toBe(4);
  });
  it("clamps to 0 for before window", () => {
    expect(seriesIndexAtDay(-1, 0, 0.25)).toBe(0);
  });
  it("rounds to nearest index", () => {
    expect(seriesIndexAtDay(0.3, 0, 0.25)).toBe(1);
  });
});

describe("findPrevNextStationary", () => {
  const days = [100, 200, 300];

  it("finds bracketing stationary days", () => {
    const result = findPrevNextStationary(days, 150);
    expect(result.prev).toBe(100);
    expect(result.next).toBe(200);
  });
  it("returns NaN prev when before first", () => {
    const result = findPrevNextStationary(days, 50);
    expect(result.prev).toBeNaN();
    expect(result.next).toBe(100);
  });
  it("returns NaN next when after last", () => {
    const result = findPrevNextStationary(days, 350);
    expect(result.prev).toBe(300);
    expect(result.next).toBeNaN();
  });
  it("handles empty array", () => {
    const result = findPrevNextStationary([], 100);
    expect(result.prev).toBeNaN();
    expect(result.next).toBeNaN();
  });
  it("handles exact match on stationary day", () => {
    const result = findPrevNextStationary(days, 200);
    expect(result.prev).toBe(200);
    expect(result.next).toBe(300);
  });
});

describe("nearestRetrogradeInterval", () => {
  const intervals = [
    { startDay: 100, endDay: 170 },
    { startDay: 400, endDay: 460 },
  ];

  it("returns containing interval when cursor is inside", () => {
    const result = nearestRetrogradeInterval(intervals, 130);
    expect(result).toEqual({ startDay: 100, endDay: 170 });
  });
  it("returns nearest interval when cursor is outside", () => {
    const result = nearestRetrogradeInterval(intervals, 250);
    expect(result).toEqual({ startDay: 100, endDay: 170 });
  });
  it("returns null for empty array", () => {
    expect(nearestRetrogradeInterval([], 100)).toBeNull();
  });
});

describe("plotXFromDay", () => {
  it("maps window start to xLeft", () => {
    expect(plotXFromDay(0, 0, 720, 60, 940)).toBeCloseTo(60);
  });
  it("maps window end to xRight", () => {
    expect(plotXFromDay(720, 0, 720, 60, 940)).toBeCloseTo(940);
  });
  it("maps midpoint to center", () => {
    expect(plotXFromDay(360, 0, 720, 60, 940)).toBeCloseTo(500);
  });
  it("supports asymmetric margins", () => {
    // left=64, right=980 (like main.ts: margin.left=64, W-margin.right=980)
    expect(plotXFromDay(0, 0, 720, 64, 980)).toBeCloseTo(64);
    expect(plotXFromDay(720, 0, 720, 64, 980)).toBeCloseTo(980);
  });
});

describe("plotYFromDeg", () => {
  it("maps yMax to yTop", () => {
    expect(plotYFromDeg(400, 0, 400, 30, 270)).toBeCloseTo(30);
  });
  it("maps yMin to yBottom", () => {
    expect(plotYFromDeg(0, 0, 400, 30, 270)).toBeCloseTo(270);
  });
  it("supports asymmetric margins", () => {
    // top=18, bottom=18+222=240 (like main.ts: mainTop=18, mainBottom=mainTop+mainH)
    expect(plotYFromDeg(400, 0, 400, 18, 240)).toBeCloseTo(18);
    expect(plotYFromDeg(0, 0, 400, 18, 240)).toBeCloseTo(240);
  });
});

describe("dayFromPlotX", () => {
  it("is the inverse of plotXFromDay (symmetric)", () => {
    const day = 250;
    const x = plotXFromDay(day, 0, 720, 60, 940);
    const recovered = dayFromPlotX(x, 0, 720, 60, 940);
    expect(recovered).toBeCloseTo(day, 1);
  });
  it("is the inverse of plotXFromDay (asymmetric)", () => {
    const day = 400;
    const x = plotXFromDay(day, 0, 720, 64, 980);
    const recovered = dayFromPlotX(x, 0, 720, 64, 980);
    expect(recovered).toBeCloseTo(day, 1);
  });
});

describe("orbitEllipsePoints", () => {
  it("generates correct number of points", () => {
    const pts = orbitEllipsePoints(1.0, 0.0, 0, 100);
    expect(pts.length).toBe(100);
  });
  it("circular orbit has constant radius", () => {
    const pts = orbitEllipsePoints(1.0, 0.0, 0, 64);
    for (const p of pts) {
      const r = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(r).toBeCloseTo(1.0, 10);
    }
  });
  it("eccentric orbit perihelion is at a(1-e)", () => {
    const a = 1.5;
    const e = 0.1;
    const pts = orbitEllipsePoints(a, e, 0, 360);
    const radii = pts.map((p) => Math.sqrt(p.x * p.x + p.y * p.y));
    const minR = Math.min(...radii);
    expect(minR).toBeCloseTo(a * (1 - e), 2);
  });
});

describe("buildOrbitPath", () => {
  it("returns SVG d attribute string starting with M", () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
    const d = buildOrbitPath(pts);
    expect(d).toMatch(/^M/);
    expect(d).toContain("L");
    expect(d).toContain("Z");
  });
});

describe("computeDisplayState", () => {
  // Stub model callbacks for testing
  const stubCallbacks: RetroModelCallbacks = {
    planetElements: (key: string) => {
      const elements: Record<string, { aAu: number; e: number; varpiDeg: number; L0Deg: number }> = {
        Earth: { aAu: 1.0, e: 0.017, varpiDeg: 103, L0Deg: 100 },
        Mars: { aAu: 1.52, e: 0.093, varpiDeg: 336, L0Deg: 355 },
        Venus: { aAu: 0.72, e: 0.007, varpiDeg: 132, L0Deg: 182 },
      };
      return elements[key] ?? elements["Earth"];
    },
  };

  const mockSeries = {
    observer: "Earth" as const,
    target: "Mars" as const,
    t0Day: 0,
    windowStartDay: 0,
    windowEndDay: 720,
    dtInternalDay: 0.25,
    timesDay: [0, 0.25, 0.5, 0.75, 1.0],
    lambdaWrappedDeg: [50, 50.1, 50.2, 50.3, 50.4],
    lambdaUnwrappedDeg: [50, 50.1, 50.2, 50.3, 50.4],
    dLambdaDtDegPerDay: [0.4, 0.4, 0.4, 0.4, 0.4],
    stationaryDays: [200, 280],
    retrogradeIntervals: [{ startDay: 200, endDay: 280 }],
  };

  it("returns display state with correct structure", () => {
    const state = computeDisplayState(mockSeries, 0.5, stubCallbacks);
    expect(state).toHaveProperty("cursorDay");
    expect(state).toHaveProperty("lambdaDeg");
    expect(state).toHaveProperty("dLambdaDt");
    expect(state).toHaveProperty("stateLabel");
    expect(state).toHaveProperty("geometryHint");
    expect(state).toHaveProperty("prevStationary");
    expect(state).toHaveProperty("nextStationary");
    expect(state).toHaveProperty("retroInterval");
  });

  it("labels direct motion correctly", () => {
    const state = computeDisplayState(mockSeries, 0.5, stubCallbacks);
    expect(state.stateLabel).toBe("Direct");
  });

  it("provides geometry hint for Earth-Mars", () => {
    const state = computeDisplayState(mockSeries, 0.5, stubCallbacks);
    expect(state.geometryHint).toBe("Superior-planet geometry");
  });

  it("provides inferior-planet hint for Earth-Venus", () => {
    const venusSeries = { ...mockSeries, target: "Venus" as const };
    const state = computeDisplayState(venusSeries, 0.5, stubCallbacks);
    expect(state.geometryHint).toBe("Inferior-planet geometry");
  });

  it("returns retrograde duration for cursor inside retrograde interval", () => {
    const state = computeDisplayState(mockSeries, 240, stubCallbacks);
    expect(state.retroDuration).toBe("80.0");
  });

  it("returns em dash for duration when no intervals exist", () => {
    const noRetro = { ...mockSeries, retrogradeIntervals: [] };
    const state = computeDisplayState(noRetro, 0, stubCallbacks);
    expect(state.retroDuration).toBe("\u2014");
  });
});

describe("resolveDistinctPair", () => {
  it("keeps observer/target when already distinct", () => {
    expect(resolveDistinctPair("Venus", "Earth")).toEqual({
      observer: "Venus",
      target: "Earth",
      adjusted: false,
    });
  });

  it("re-targets Earth observer away from Earth", () => {
    expect(resolveDistinctPair("Earth", "Earth")).toEqual({
      observer: "Earth",
      target: "Mars",
      adjusted: true,
    });
  });

  it("re-targets non-Earth observer to Earth when duplicated", () => {
    expect(resolveDistinctPair("Venus", "Venus")).toEqual({
      observer: "Venus",
      target: "Earth",
      adjusted: true,
    });
  });
});

describe("isRetrogradeDurationComparisonComplete", () => {
  it("returns false when only one target is present", () => {
    expect(isRetrogradeDurationComparisonComplete({ Mars: 74 })).toBe(false);
  });

  it("returns true when Mars and Venus durations are both finite", () => {
    expect(
      isRetrogradeDurationComparisonComplete({ Mars: 74, Venus: 42 }),
    ).toBe(true);
  });

  it("returns false when either duration is not finite", () => {
    expect(
      isRetrogradeDurationComparisonComplete({ Mars: Number.NaN, Venus: 42 }),
    ).toBe(false);
  });
});

describe("retrogradeDurationIfActiveAtCursor", () => {
  const intervals = [
    { startDay: 100, endDay: 170 },
    { startDay: 400, endDay: 460 },
  ];

  it("returns duration when cursor is inside a retrograde interval", () => {
    expect(retrogradeDurationIfActiveAtCursor(intervals, 120)).toBe(70);
  });

  it("returns null when cursor is outside all retrograde intervals", () => {
    expect(retrogradeDurationIfActiveAtCursor(intervals, 250)).toBeNull();
  });
});

// ── advanceCursor ──────────────────────────────────────────────

describe("advanceCursor", () => {
  it("advances by dt * speed", () => {
    expect(advanceCursor(100, 0.5, 5, 720)).toBeCloseTo(102.5);
  });

  it("clamps to windowEnd when overshooting", () => {
    expect(advanceCursor(718, 1.0, 5, 720)).toBe(720);
  });

  it("clamps to 0 when undershooting", () => {
    expect(advanceCursor(2, 1.0, -5, 720)).toBe(0);
  });

  it("returns current day when dt is 0", () => {
    expect(advanceCursor(100, 0, 10, 720)).toBe(100);
  });

  it("handles speed = 0 (paused)", () => {
    expect(advanceCursor(100, 0.5, 0, 720)).toBe(100);
  });

  it("handles negative speed (reverse playback)", () => {
    expect(advanceCursor(100, 0.5, -5, 720)).toBeCloseTo(97.5);
  });

  it("does not exceed windowEnd at boundary", () => {
    expect(advanceCursor(720, 0.016, 5, 720)).toBe(720);
  });

  it("reaches exactly windowEnd", () => {
    expect(advanceCursor(719, 0.2, 5, 720)).toBe(720);
  });

  it("handles very small dt (high frame rate)", () => {
    const result = advanceCursor(100, 0.001, 5, 720);
    expect(result).toBeCloseTo(100.005);
  });
});

// ── projectToSkyView ──────────────────────────────────────────

describe("projectToSkyView", () => {
  const W = 600;

  it("maps 0 deg to x = 0", () => {
    expect(projectToSkyView(0, W)).toBe(0);
  });

  it("maps 360 deg to x = viewWidth", () => {
    expect(projectToSkyView(360, W)).toBe(W);
  });

  it("maps 180 deg to x = viewWidth / 2", () => {
    expect(projectToSkyView(180, W)).toBe(W / 2);
  });

  it("maps 90 deg to x = viewWidth / 4", () => {
    expect(projectToSkyView(90, W)).toBe(W / 4);
  });

  it("maps 270 deg to x = 3/4 viewWidth", () => {
    expect(projectToSkyView(270, W)).toBe(W * 3 / 4);
  });

  it("is linear across the full range", () => {
    const x1 = projectToSkyView(100, W);
    const x2 = projectToSkyView(200, W);
    const x3 = projectToSkyView(300, W);
    expect(x2 - x1).toBeCloseTo(x3 - x2);
  });

  it("handles different view widths", () => {
    expect(projectToSkyView(180, 1000)).toBe(500);
    expect(projectToSkyView(180, 200)).toBe(100);
  });
});

// ── zodiacLabelPositions ──────────────────────────────────────

describe("zodiacLabelPositions", () => {
  const R = 200;
  const CX = 300;
  const CY = 250;

  it("returns exactly 12 labels", () => {
    const labels = zodiacLabelPositions(R, CX, CY);
    expect(labels.length).toBe(12);
  });

  it("includes all standard zodiac abbreviations", () => {
    const labels = zodiacLabelPositions(R, CX, CY);
    const names = labels.map((l) => l.label);
    expect(names).toEqual(["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir",
      "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"]);
  });

  it("places Aries near 15 deg (upper right in SVG)", () => {
    const labels = zodiacLabelPositions(R, CX, CY);
    const ari = labels.find((l) => l.label === "Ari")!;
    expect(ari.angleDeg).toBe(15);
    // At 15 deg: x = cx + R*cos(15) > cx, y = cy - R*sin(15) < cy
    expect(ari.x).toBeGreaterThan(CX);
    expect(ari.y).toBeLessThan(CY);
  });

  it("places Libra near 195 deg (lower left in SVG)", () => {
    const labels = zodiacLabelPositions(R, CX, CY);
    const lib = labels.find((l) => l.label === "Lib")!;
    expect(lib.angleDeg).toBe(195);
    // At 195 deg: x = cx + R*cos(195) < cx, y = cy - R*sin(195) > cy
    expect(lib.x).toBeLessThan(CX);
    expect(lib.y).toBeGreaterThan(CY);
  });

  it("all labels sit at the specified radius from center", () => {
    const labels = zodiacLabelPositions(R, CX, CY);
    for (const l of labels) {
      const dx = l.x - CX;
      const dy = l.y - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeCloseTo(R, 5);
    }
  });

  it("labels are evenly spaced at 30-degree intervals", () => {
    const labels = zodiacLabelPositions(R, CX, CY);
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].angleDeg - labels[i - 1].angleDeg).toBe(30);
    }
  });

  it("correctly inverts y for SVG (y-down)", () => {
    const labels = zodiacLabelPositions(R, CX, CY);
    // Cancer at 105 deg: sin(105) > 0, so y should be ABOVE center (< cy)
    const cnc = labels.find((l) => l.label === "Cnc")!;
    expect(cnc.y).toBeLessThan(CY);
    // Capricorn at 285 deg: sin(285) < 0, so y should be BELOW center (> cy)
    const cap = labels.find((l) => l.label === "Cap")!;
    expect(cap.y).toBeGreaterThan(CY);
  });

  it("respects different center and radius values", () => {
    const labels = zodiacLabelPositions(100, 500, 400);
    const ari = labels.find((l) => l.label === "Ari")!;
    const dx = ari.x - 500;
    const dy = ari.y - 400;
    expect(Math.sqrt(dx * dx + dy * dy)).toBeCloseTo(100, 5);
  });
});

// ── presetToConfig ────────────────────────────────────────────

describe("presetToConfig", () => {
  it("maps earth-mars to Earth/Mars", () => {
    const config = presetToConfig("earth-mars");
    expect(config).toEqual({ observer: "Earth", target: "Mars" });
  });

  it("maps earth-venus to Earth/Venus", () => {
    const config = presetToConfig("earth-venus");
    expect(config).toEqual({ observer: "Earth", target: "Venus" });
  });

  it("maps earth-jupiter to Earth/Jupiter", () => {
    const config = presetToConfig("earth-jupiter");
    expect(config).toEqual({ observer: "Earth", target: "Jupiter" });
  });

  it("maps earth-saturn to Earth/Saturn", () => {
    const config = presetToConfig("earth-saturn");
    expect(config).toEqual({ observer: "Earth", target: "Saturn" });
  });

  it("returns null for unknown preset", () => {
    expect(presetToConfig("earth-pluto")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(presetToConfig("")).toBeNull();
  });

  it("returns null for custom (no match)", () => {
    expect(presetToConfig("custom")).toBeNull();
  });
});
