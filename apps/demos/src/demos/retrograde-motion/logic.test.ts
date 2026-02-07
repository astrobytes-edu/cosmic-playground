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
  computeDisplayState,
  buildExportPayload,
  type RetroModelCallbacks,
  type DisplayState,
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
  it("maps window start to left margin", () => {
    expect(plotXFromDay(0, 0, 720, 1000, 60)).toBeCloseTo(60);
  });
  it("maps window end to right edge minus margin", () => {
    expect(plotXFromDay(720, 0, 720, 1000, 60)).toBeCloseTo(940);
  });
  it("maps midpoint to center", () => {
    expect(plotXFromDay(360, 0, 720, 1000, 60)).toBeCloseTo(500);
  });
});

describe("plotYFromDeg", () => {
  it("maps yMax to top margin", () => {
    expect(plotYFromDeg(400, 0, 400, 300, 30)).toBeCloseTo(30);
  });
  it("maps yMin to bottom edge minus margin", () => {
    expect(plotYFromDeg(0, 0, 400, 300, 30)).toBeCloseTo(270);
  });
});

describe("dayFromPlotX", () => {
  it("is the inverse of plotXFromDay", () => {
    const day = 250;
    const x = plotXFromDay(day, 0, 720, 1000, 60);
    const recovered = dayFromPlotX(x, 0, 720, 1000, 60);
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
});
