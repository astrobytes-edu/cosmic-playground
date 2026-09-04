import { describe, expect, it } from "vitest";
import {
  PLUMMER_HALF_MASS_OVER_SCALE,
  buildEffCdf,
  effHalfMassOverScale,
  makeProfileSampler,
  plummerRadiusPc
} from "./clusterProfileModel";
import { mulberry32 } from "./seededRandom";

describe("Plummer profile", () => {
  it("puts half the mass inside 1.305 scale radii", () => {
    // The defining property, and a closed-form check on the inverse:
    // r(0.5) = a / sqrt(2^(2/3) - 1) = 1.304766 a.
    expect(plummerRadiusPc(0.5, 1)).toBeCloseTo(1.304766, 6);
    expect(plummerRadiusPc(0.5, 1)).toBeCloseTo(PLUMMER_HALF_MASS_OVER_SCALE, 3);
  });

  it("scales linearly with the scale radius", () => {
    expect(plummerRadiusPc(0.3, 4)).toBeCloseTo(4 * plummerRadiusPc(0.3, 1), 12);
  });

  it("is monotonically increasing in enclosed mass fraction", () => {
    let previous = 0;
    for (let u = 0.01; u < 1; u += 0.01) {
      const r = plummerRadiusPc(u, 1);
      expect(r).toBeGreaterThan(previous);
      previous = r;
    }
  });

  it("stays finite at both ends rather than diverging", () => {
    expect(Number.isFinite(plummerRadiusPc(0, 1))).toBe(true);
    expect(Number.isFinite(plummerRadiusPc(1, 1))).toBe(true);
  });
});

describe("EFF profile", () => {
  it("reduces to Plummer at gamma = 5", () => {
    // Within 1% of the analytic Plummer ratio; the gap is grid resolution plus the
    // truncation at 15 scale radii, not a different profile.
    expect(effHalfMassOverScale(5)).toBeCloseTo(1.2971, 3);
    expect(Math.abs(effHalfMassOverScale(5) - PLUMMER_HALF_MASS_OVER_SCALE)).toBeLessThan(0.01);
  });

  it("gets more extended as the density slope flattens", () => {
    const slopes = [8, 6, 5, 4, 3, 2.5];
    let previous = 0;
    for (const gamma of slopes) {
      const ratio = effHalfMassOverScale(gamma);
      expect(ratio).toBeGreaterThan(previous);
      previous = ratio;
    }
    // A young-cluster slope is dramatically more extended than a Plummer sphere.
    expect(effHalfMassOverScale(3)).toBeGreaterThan(3 * effHalfMassOverScale(5));
  });

  it("builds a normalized, monotone CDF", () => {
    const { cdf, radiiPc } = buildEffCdf(1, 3, 15);
    expect(cdf[0]).toBe(0);
    expect(cdf[cdf.length - 1]).toBeCloseTo(1, 12);
    expect(radiiPc[0]).toBe(0);
    expect(radiiPc[radiiPc.length - 1]).toBeCloseTo(15, 12);
    for (let i = 1; i < cdf.length; i += 1) expect(cdf[i]).toBeGreaterThanOrEqual(cdf[i - 1]);
  });
});

describe("profile samplers", () => {
  it("draw isotropically, with no preferred axis", () => {
    // Isotropy is tested on DIRECTION, not on the raw second moment. A Plummer sphere's
    // <r^2> is formally infinite -- density falls as r^-5, so the mass integral converges
    // but the second moment goes as the integral of dr/r -- and a sample variance of a
    // divergent quantity is dominated by whichever few stars landed furthest out. It
    // scatters by tens of percent between axes with nothing wrong. <x^2/r^2>, by contrast,
    // is bounded and equals exactly 1/3 for isotropic directions.
    const sample = makeProfileSampler({ kind: "plummer", scaleRadiusPc: 1 });
    const random = mulberry32(4);
    const cosSquared = [0, 0, 0];
    const n = 20_000;
    for (let i = 0; i < n; i += 1) {
      const p = sample(random);
      const r2 = p.x * p.x + p.y * p.y + p.z * p.z;
      cosSquared[0] += (p.x * p.x) / r2;
      cosSquared[1] += (p.y * p.y) / r2;
      cosSquared[2] += (p.z * p.z) / r2;
    }
    // Tolerance is the actual standard error, not a decimal place. For cos(theta)
    // uniform on [-1,1], Var[cos^2] = 1/5 - 1/9 = 4/45, so the mean of n draws has
    // SD = sqrt(4/45/n) = 0.0021 here. Four sigma: tight enough to catch a real axis
    // preference, loose enough that ordinary scatter does not fail the build. Measured
    // across ten seeds, the worst deviation is 2.4 sigma and the signs are symmetric.
    const standardError = Math.sqrt(4 / 45 / n);
    for (const total of cosSquared) {
      expect(Math.abs(total / n - 1 / 3)).toBeLessThan(4 * standardError);
    }
  });

  it("is centred on the origin", () => {
    // The first moment does converge, so this one is fair to test directly -- but it
    // converges slowly, hence the loose tolerance relative to the scale radius.
    const sample = makeProfileSampler({ kind: "plummer", scaleRadiusPc: 1 });
    const random = mulberry32(9);
    const mean = { x: 0, y: 0, z: 0 };
    const n = 20_000;
    for (let i = 0; i < n; i += 1) {
      const p = sample(random);
      mean.x += p.x / n;
      mean.y += p.y / n;
      mean.z += p.z / n;
    }
    for (const value of [mean.x, mean.y, mean.z]) expect(Math.abs(value)).toBeLessThan(0.2);
  });

  it("reproduces the analytic half-mass radius when sampled", () => {
    const sample = makeProfileSampler({ kind: "plummer", scaleRadiusPc: 2 });
    const random = mulberry32(11);
    const radii: number[] = [];
    for (let i = 0; i < 20_000; i += 1) {
      const p = sample(random);
      radii.push(Math.hypot(p.x, p.y, p.z));
    }
    radii.sort((a, b) => a - b);
    const median = radii[Math.floor(radii.length / 2)];
    expect(median / 2).toBeCloseTo(PLUMMER_HALF_MASS_OVER_SCALE, 1);
  });

  it("consumes the same number of uniforms whichever profile is chosen", () => {
    // Three draws per star, so switching profile moves positions without desynchronising
    // any other stream that shares the seed.
    const count = (spec: Parameters<typeof makeProfileSampler>[0]) => {
      let calls = 0;
      const random = () => {
        calls += 1;
        return 0.5;
      };
      makeProfileSampler(spec)(random);
      return calls;
    };
    expect(count({ kind: "plummer", scaleRadiusPc: 1 })).toBe(3);
    expect(count({ kind: "eff", scaleRadiusPc: 1, gamma: 3 })).toBe(3);
  });
});
