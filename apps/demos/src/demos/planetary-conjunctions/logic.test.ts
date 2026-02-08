import { describe, it, expect } from "vitest";
import {
  type ConjunctionCallbacks,
  type PlanetName,
  siderealPeriodDays,
  synodicPeriodDays,
  yearDays,
  planetAngleRad,
  angularSeparationDeg,
  isConjunction,
  formatNumber,
  formatDays,
  formatAngleDeg,
  orbitToSvg,
  orbitRadiusPx,
  planetCssVar
} from "./logic";

// ---------------------------------------------------------------------------
// Stub callbacks for testing without @cosmic/physics
// ---------------------------------------------------------------------------

const STUB_SEMI_MAJOR: Record<PlanetName, number> = {
  Venus: 0.72333566,
  Mars: 1.52371034,
  Jupiter: 5.20288700,
  Saturn: 9.53667594
};

const stubCallbacks: ConjunctionCallbacks = {
  planetSemiMajorAxisAu(name: PlanetName): number {
    return STUB_SEMI_MAJOR[name];
  },
  orbitalPeriodYr(aAu: number, _massSolar: number): number {
    // Kepler III: P = sqrt(a^3) for M = 1 Msun
    return Math.sqrt(aAu * aAu * aAu);
  },
  synodicPeriod(p1: number, p2: number): number {
    const diff = p1 - p2;
    if (Math.abs(diff) < 1e-12) return Infinity;
    return Math.abs((p1 * p2) / diff);
  }
};

// ---------------------------------------------------------------------------
// yearDays
// ---------------------------------------------------------------------------

describe("yearDays", () => {
  it("returns 365.25 (Julian year)", () => {
    expect(yearDays()).toBeCloseTo(365.25, 6);
  });
});

// ---------------------------------------------------------------------------
// siderealPeriodDays
// ---------------------------------------------------------------------------

describe("siderealPeriodDays", () => {
  it("Earth period is ~365.25 days", () => {
    const p = siderealPeriodDays("Earth", stubCallbacks);
    // a = 1.00000261, P_yr = sqrt(a^3) ~ 1.000004 yr, P_day ~ 365.25
    expect(p).toBeCloseTo(365.25, 0);
  });

  it("Venus period is ~224.7 days", () => {
    const p = siderealPeriodDays("Venus", stubCallbacks);
    // a = 0.72333566, P_yr = sqrt(a^3) ~ 0.6152 yr, P_day ~ 224.7
    expect(p).toBeCloseTo(224.7, 0);
  });

  it("Mars period is ~687 days", () => {
    const p = siderealPeriodDays("Mars", stubCallbacks);
    expect(p).toBeCloseTo(687, 0);
  });

  it("Jupiter period is ~4333 days", () => {
    const p = siderealPeriodDays("Jupiter", stubCallbacks);
    expect(p).toBeCloseTo(4335, -1); // within 10 days
  });

  it("Saturn period is ~10757 days", () => {
    const p = siderealPeriodDays("Saturn", stubCallbacks);
    expect(p).toBeCloseTo(10757, -1); // within 10 days
  });
});

// ---------------------------------------------------------------------------
// synodicPeriodDays
// ---------------------------------------------------------------------------

describe("synodicPeriodDays", () => {
  it("Earth-Mars synodic period is ~780 days", () => {
    const pEarth = siderealPeriodDays("Earth", stubCallbacks);
    const pMars = siderealPeriodDays("Mars", stubCallbacks);
    const syn = synodicPeriodDays(pEarth, pMars, stubCallbacks);
    expect(syn).toBeCloseTo(780, -1); // within 10 days
  });

  it("Earth-Venus synodic period is ~584 days", () => {
    const pEarth = siderealPeriodDays("Earth", stubCallbacks);
    const pVenus = siderealPeriodDays("Venus", stubCallbacks);
    const syn = synodicPeriodDays(pEarth, pVenus, stubCallbacks);
    expect(syn).toBeCloseTo(584, -1);
  });

  it("Earth-Jupiter synodic period is ~399 days", () => {
    const pEarth = siderealPeriodDays("Earth", stubCallbacks);
    const pJupiter = siderealPeriodDays("Jupiter", stubCallbacks);
    const syn = synodicPeriodDays(pEarth, pJupiter, stubCallbacks);
    expect(syn).toBeCloseTo(399, -1);
  });

  it("Earth-Saturn synodic period is ~378 days", () => {
    const pEarth = siderealPeriodDays("Earth", stubCallbacks);
    const pSaturn = siderealPeriodDays("Saturn", stubCallbacks);
    const syn = synodicPeriodDays(pEarth, pSaturn, stubCallbacks);
    expect(syn).toBeCloseTo(378, -1);
  });
});

// ---------------------------------------------------------------------------
// planetAngleRad
// ---------------------------------------------------------------------------

describe("planetAngleRad", () => {
  it("returns 0 at t=0", () => {
    expect(planetAngleRad(0, 365.25)).toBe(0);
  });

  it("returns pi after half a period", () => {
    expect(planetAngleRad(365.25 / 2, 365.25)).toBeCloseTo(Math.PI, 10);
  });

  it("wraps back to 0 after a full period", () => {
    const angle = planetAngleRad(365.25, 365.25);
    expect(angle).toBeCloseTo(0, 8);
  });

  it("handles multiple periods", () => {
    const angle = planetAngleRad(365.25 * 2.5, 365.25);
    expect(angle).toBeCloseTo(Math.PI, 6);
  });

  it("returns NaN for non-finite inputs", () => {
    expect(planetAngleRad(NaN, 365.25)).toBeNaN();
    expect(planetAngleRad(100, 0)).toBeNaN();
    expect(planetAngleRad(100, -1)).toBeNaN();
  });
});

// ---------------------------------------------------------------------------
// angularSeparationDeg
// ---------------------------------------------------------------------------

describe("angularSeparationDeg", () => {
  it("same angle gives 0 degrees", () => {
    expect(angularSeparationDeg(1.0, 1.0)).toBeCloseTo(0, 10);
  });

  it("opposite angles give 180 degrees", () => {
    expect(angularSeparationDeg(0, Math.PI)).toBeCloseTo(180, 10);
  });

  it("90 degree separation", () => {
    expect(angularSeparationDeg(0, Math.PI / 2)).toBeCloseTo(90, 10);
  });

  it("wraps correctly across 0/2pi boundary", () => {
    // 350 deg and 10 deg should be 20 deg apart
    const a1 = (350 * Math.PI) / 180;
    const a2 = (10 * Math.PI) / 180;
    expect(angularSeparationDeg(a1, a2)).toBeCloseTo(20, 6);
  });

  it("always returns non-negative", () => {
    expect(angularSeparationDeg(2, 1)).toBeGreaterThanOrEqual(0);
    expect(angularSeparationDeg(1, 2)).toBeGreaterThanOrEqual(0);
  });

  it("always returns at most 180 degrees", () => {
    expect(angularSeparationDeg(0, 5)).toBeLessThanOrEqual(180);
  });

  it("returns NaN for non-finite inputs", () => {
    expect(angularSeparationDeg(NaN, 1)).toBeNaN();
    expect(angularSeparationDeg(1, Infinity)).toBeNaN();
  });
});

// ---------------------------------------------------------------------------
// isConjunction
// ---------------------------------------------------------------------------

describe("isConjunction", () => {
  it("true when separation is below threshold", () => {
    expect(isConjunction(3, 5)).toBe(true);
  });

  it("true when separation equals threshold", () => {
    expect(isConjunction(5, 5)).toBe(true);
  });

  it("false when separation exceeds threshold", () => {
    expect(isConjunction(6, 5)).toBe(false);
  });

  it("false for NaN separation", () => {
    expect(isConjunction(NaN, 5)).toBe(false);
  });

  it("uses default threshold of 5 degrees", () => {
    expect(isConjunction(4)).toBe(true);
    expect(isConjunction(6)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------

describe("formatNumber", () => {
  it("formats small integers", () => {
    expect(formatNumber(42, 1)).toBe("42.0");
  });

  it("formats decimals to specified digits", () => {
    expect(formatNumber(3.14159, 2)).toBe("3.14");
  });

  it("returns em-dash for NaN", () => {
    expect(formatNumber(NaN)).toBe("\u2014");
  });

  it("returns em-dash for Infinity", () => {
    expect(formatNumber(Infinity)).toBe("\u2014");
  });

  it("returns 0 for zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("uses exponential for very large numbers", () => {
    expect(formatNumber(1.5e7, 2)).toBe("1.5e+7");
  });

  it("uses exponential for very small numbers", () => {
    const result = formatNumber(0.0005, 2);
    expect(result).toMatch(/e/);
  });
});

// ---------------------------------------------------------------------------
// formatDays
// ---------------------------------------------------------------------------

describe("formatDays", () => {
  it("shows integer days for small values", () => {
    expect(formatDays(584)).toBe("584");
  });

  it("rounds to nearest integer day", () => {
    expect(formatDays(583.7)).toBe("584");
  });

  it("shows years for values >= 1000", () => {
    const result = formatDays(1460);
    expect(result).toMatch(/yr/);
    expect(result).toContain("4.0");
  });

  it("returns em-dash for NaN", () => {
    expect(formatDays(NaN)).toBe("\u2014");
  });
});

// ---------------------------------------------------------------------------
// formatAngleDeg
// ---------------------------------------------------------------------------

describe("formatAngleDeg", () => {
  it("converts radians to degrees", () => {
    expect(formatAngleDeg(Math.PI)).toBe("180.0");
  });

  it("wraps negative angles", () => {
    const result = Number(formatAngleDeg(-Math.PI / 2));
    expect(result).toBeCloseTo(270, 0);
  });

  it("returns em-dash for NaN", () => {
    expect(formatAngleDeg(NaN)).toBe("\u2014");
  });

  it("shows one decimal place", () => {
    expect(formatAngleDeg(1.0)).toMatch(/^\d+\.\d$/);
  });
});

// ---------------------------------------------------------------------------
// orbitToSvg
// ---------------------------------------------------------------------------

describe("orbitToSvg", () => {
  it("angle=0 puts planet at (cx + r, cy)", () => {
    const p = orbitToSvg(300, 300, 100, 0);
    expect(p.x).toBeCloseTo(400, 10);
    expect(p.y).toBeCloseTo(300, 10);
  });

  it("angle=pi/2 puts planet above center (SVG y inverted)", () => {
    const p = orbitToSvg(300, 300, 100, Math.PI / 2);
    expect(p.x).toBeCloseTo(300, 6);
    expect(p.y).toBeCloseTo(200, 6); // above = smaller y in SVG
  });

  it("angle=pi puts planet at (cx - r, cy)", () => {
    const p = orbitToSvg(300, 300, 100, Math.PI);
    expect(p.x).toBeCloseTo(200, 6);
    expect(p.y).toBeCloseTo(300, 6);
  });
});

// ---------------------------------------------------------------------------
// orbitRadiusPx
// ---------------------------------------------------------------------------

describe("orbitRadiusPx", () => {
  it("returns maxPx when aAu equals maxAu", () => {
    expect(orbitRadiusPx(5, 5, 240)).toBeCloseTo(240, 10);
  });

  it("scales linearly", () => {
    expect(orbitRadiusPx(1, 10, 240)).toBeCloseTo(24, 10);
  });

  it("returns 0 for non-positive inputs", () => {
    expect(orbitRadiusPx(0, 10, 240)).toBe(0);
    expect(orbitRadiusPx(-1, 10, 240)).toBe(0);
    expect(orbitRadiusPx(5, 0, 240)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// planetCssVar
// ---------------------------------------------------------------------------

describe("planetCssVar", () => {
  it("returns correct CSS variable for Venus", () => {
    expect(planetCssVar("Venus")).toBe("--cp-celestial-venus");
  });

  it("returns correct CSS variable for Mars", () => {
    expect(planetCssVar("Mars")).toBe("--cp-celestial-mars");
  });

  it("returns correct CSS variable for Jupiter", () => {
    expect(planetCssVar("Jupiter")).toBe("--cp-celestial-jupiter");
  });

  it("returns correct CSS variable for Saturn", () => {
    expect(planetCssVar("Saturn")).toBe("--cp-celestial-saturn");
  });
});
