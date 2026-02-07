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
