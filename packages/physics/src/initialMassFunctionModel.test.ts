import { describe, expect, it } from "vitest";
import {
  CANONICAL_HIGH_MASS_SLOPE,
  HYDROGEN_BURNING_MIN_MSUN,
  IMF_MAX_MSUN,
  KROUPA_ALPHA_LOW,
  KROUPA_BREAK_MSUN,
  buildKroupaSegments,
  highMassSlopeFromEnvironment,
  kroupaMassFraction,
  kroupaMassMsun,
  maschbergerMassFraction,
  maschbergerMassMsun
} from "./initialMassFunctionModel";

const CANONICAL = {
  minMassMsun: HYDROGEN_BURNING_MIN_MSUN,
  maxMassMsun: IMF_MAX_MSUN,
  alphaHigh: CANONICAL_HIGH_MASS_SLOPE
};

/** Stratified uniforms: deterministic, and they cover [0,1) evenly. */
function stratified(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i + 0.5) / n);
}

describe("Maschberger (2013) IMF", () => {
  it("spans exactly the requested mass range", () => {
    expect(maschbergerMassMsun(0, CANONICAL)).toBeCloseTo(HYDROGEN_BURNING_MIN_MSUN, 10);
    expect(maschbergerMassMsun(1, CANONICAL)).toBeCloseTo(IMF_MAX_MSUN, 6);
  });

  it("is monotonically increasing in the uniform", () => {
    let previous = 0;
    for (const u of stratified(500)) {
      const mass = maschbergerMassMsun(u, CANONICAL);
      expect(mass).toBeGreaterThan(previous);
      previous = mass;
    }
  });

  it("normalizes to one over the full range", () => {
    expect(maschbergerMassFraction(0, Infinity, CANONICAL)).toBeCloseTo(1, 12);
  });

  it("returns zero for an empty or inverted interval", () => {
    expect(maschbergerMassFraction(5, 5, CANONICAL)).toBe(0);
    expect(maschbergerMassFraction(10, 1, CANONICAL)).toBe(0);
  });

  it("sampler and analytic fraction agree bin by bin", () => {
    // The two are independent code paths through the same primitive: one inverts it, the
    // other differences it. Stratified uniforms make this deterministic, so a mismatch is
    // a real inconsistency rather than sampling noise.
    const n = 200_000;
    const edges = [0.08, 0.2, 0.5, 1, 2, 5, 10, 30, 150];
    const counts = new Array(edges.length - 1).fill(0);
    for (const u of stratified(n)) {
      const mass = maschbergerMassMsun(u, CANONICAL);
      for (let b = 0; b < counts.length; b += 1) {
        if (mass >= edges[b] && mass < edges[b + 1]) {
          counts[b] += 1;
          break;
        }
      }
    }
    for (let b = 0; b < counts.length; b += 1) {
      const sampled = counts[b] / n;
      const analytic = maschbergerMassFraction(edges[b], edges[b + 1], CANONICAL);
      expect(Math.abs(sampled - analytic)).toBeLessThan(1e-4);
    }
  });

  it("puts most stars below one solar mass", () => {
    // The headline fact about the IMF: low-mass stars overwhelmingly dominate by number.
    const belowSolar = maschbergerMassFraction(0.08, 1, CANONICAL);
    expect(belowSolar).toBeGreaterThan(0.8);
  });

  it("makes massive stars rarer as the high-mass slope steepens", () => {
    const shallow = maschbergerMassFraction(10, 150, { ...CANONICAL, alphaHigh: 1.8 });
    const canonical = maschbergerMassFraction(10, 150, CANONICAL);
    const steep = maschbergerMassFraction(10, 150, { ...CANONICAL, alphaHigh: 2.8 });
    expect(shallow).toBeGreaterThan(canonical);
    expect(canonical).toBeGreaterThan(steep);
  });
});

describe("Kroupa (2001) IMF", () => {
  const segments = buildKroupaSegments(HYDROGEN_BURNING_MIN_MSUN, IMF_MAX_MSUN);

  it("builds two segments split at the 0.5 Msun break", () => {
    expect(segments).toHaveLength(2);
    expect(segments[0].hiMsun).toBe(KROUPA_BREAK_MSUN);
    expect(segments[1].loMsun).toBe(KROUPA_BREAK_MSUN);
    expect(segments[0].alpha).toBe(KROUPA_ALPHA_LOW);
    expect(segments[1].alpha).toBe(CANONICAL_HIGH_MASS_SLOPE);
  });

  it("joins continuously at the break", () => {
    // xi = A * m^(-alpha) evaluated from each side at m = 0.5 must agree, which is what
    // the high segment's amplitude is chosen for.
    const fromBelow = segments[0].amplitude * KROUPA_BREAK_MSUN ** -segments[0].alpha;
    const fromAbove = segments[1].amplitude * KROUPA_BREAK_MSUN ** -segments[1].alpha;
    expect(fromAbove).toBeCloseTo(fromBelow, 12);
  });

  it("spans exactly the requested mass range", () => {
    expect(kroupaMassMsun(0, segments)).toBeCloseTo(HYDROGEN_BURNING_MIN_MSUN, 10);
    expect(kroupaMassMsun(1, segments)).toBeCloseTo(IMF_MAX_MSUN, 6);
  });

  it("is monotonically increasing in the uniform", () => {
    let previous = 0;
    for (const u of stratified(500)) {
      const mass = kroupaMassMsun(u, segments);
      expect(mass).toBeGreaterThan(previous);
      previous = mass;
    }
  });

  it("normalizes to one over the full range", () => {
    expect(kroupaMassFraction(0, Infinity, segments)).toBeCloseTo(1, 12);
  });

  it("sampler and analytic fraction agree bin by bin", () => {
    const n = 200_000;
    const edges = [0.08, 0.2, 0.5, 1, 2, 5, 10, 30, 150];
    const counts = new Array(edges.length - 1).fill(0);
    for (const u of stratified(n)) {
      const mass = kroupaMassMsun(u, segments);
      for (let b = 0; b < counts.length; b += 1) {
        if (mass >= edges[b] && mass < edges[b + 1]) {
          counts[b] += 1;
          break;
        }
      }
    }
    for (let b = 0; b < counts.length; b += 1) {
      const sampled = counts[b] / n;
      const analytic = kroupaMassFraction(edges[b], edges[b + 1], segments);
      expect(Math.abs(sampled - analytic)).toBeLessThan(1e-4);
    }
  });

  it("collapses to a single segment when the range excludes the break", () => {
    expect(buildKroupaSegments(1, 100)).toHaveLength(1);
    expect(buildKroupaSegments(0.1, 0.4)).toHaveLength(1);
  });

  it("agrees with Maschberger on the broad shape without being identical", () => {
    // Different functional forms fitted to the same data: they should land in the same
    // ballpark for the massive-star fraction, and should not coincide exactly.
    const kroupa = kroupaMassFraction(8, 150, segments);
    const maschberger = maschbergerMassFraction(8, 150, CANONICAL);
    expect(kroupa).toBeGreaterThan(0.2 * maschberger);
    expect(kroupa).toBeLessThan(5 * maschberger);
    expect(kroupa).not.toBeCloseTo(maschberger, 6);
  });
});

describe("environment-dependent high-mass slope", () => {
  it("matches Jerabkova+2018 Eq. 6 at solar metallicity and 1e6 Msun", () => {
    // x = -0.14*0 + 0.6039*log10(1) + 0.2161 = 0.2161; alpha3 = -0.41*0.2161 + 1.94
    expect(highMassSlopeFromEnvironment(0, 1e6)).toBeCloseTo(1.851399, 6);
  });

  it("stays canonical for a small solar-metallicity cluster", () => {
    // x = 0.6039*(-3) + 0.2161 = -1.5956, which is below the -0.87 threshold.
    expect(highMassSlopeFromEnvironment(0, 1e3)).toBe(CANONICAL_HIGH_MASS_SLOPE);
  });

  it("goes top-heavy for a massive metal-poor cluster", () => {
    // x = 0.28 + 0.6039*2 + 0.2161 = 1.7039; alpha3 = -0.41*1.7039 + 1.94
    expect(highMassSlopeFromEnvironment(-2, 1e8)).toBeCloseTo(1.241401, 6);
  });

  it("never exceeds the canonical slope nor falls below 0.5", () => {
    expect(highMassSlopeFromEnvironment(5, 1)).toBe(CANONICAL_HIGH_MASS_SLOPE);
    expect(highMassSlopeFromEnvironment(-4, 1e12)).toBe(0.5);
  });

  it("flattens monotonically with cluster mass and with decreasing metallicity", () => {
    const light = highMassSlopeFromEnvironment(0, 1e5);
    const heavy = highMassSlopeFromEnvironment(0, 1e7);
    expect(heavy).toBeLessThan(light);

    const metalRich = highMassSlopeFromEnvironment(0.5, 1e7);
    const metalPoor = highMassSlopeFromEnvironment(-1.5, 1e7);
    expect(metalPoor).toBeLessThan(metalRich);
  });
});
