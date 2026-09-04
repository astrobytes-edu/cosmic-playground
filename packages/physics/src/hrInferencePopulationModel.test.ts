import { describe, expect, it } from "vitest";

import { ZamsTout1996Model } from "./zamsTout1996Model";
import { HrInferencePopulationModel } from "./hrInferencePopulationModel";

describe("HrInferencePopulationModel", () => {
  it("is deterministic for a fixed seed", () => {
    const a = HrInferencePopulationModel.generatePopulation({
      N: 8,
      seed: "determinism-seed",
      distancePc: 100,
      photErr: 0.03,
      modeCluster: true,
      clusterAge: 0.4,
      binaryFrac: 0.2,
      metallicityZ: 0.02
    });
    const b = HrInferencePopulationModel.generatePopulation({
      N: 8,
      seed: "determinism-seed",
      distancePc: 100,
      photErr: 0.03,
      modeCluster: true,
      clusterAge: 0.4,
      binaryFrac: 0.2,
      metallicityZ: 0.02
    });

    expect(a).toEqual(b);
  });

  it("keeps physical population invariant when only photErr changes", () => {
    const base = {
      N: 180,
      seed: "photerr-invariance",
      distancePc: 320,
      modeCluster: false,
      clusterAge: undefined,
      binaryFrac: 0.31,
      metallicityZ: 0.02
    } as const;

    const noiseless = HrInferencePopulationModel.generatePopulation({
      ...base,
      photErr: 0
    });

    const noisy = HrInferencePopulationModel.generatePopulation({
      ...base,
      photErr: 0.08
    });

    expect(noiseless.length).toBe(noisy.length);

    for (let i = 0; i < noiseless.length; i += 1) {
      const a = noiseless[i];
      const b = noisy[i];

      expect(a.id).toBe(b.id);
      expect(a.stage).toBe(b.stage);
      expect(a.mass).toBeCloseTo(b.mass, 12);
      expect(a.Teff).toBeCloseTo(b.Teff, 12);
      expect(a.L).toBeCloseTo(b.L, 12);
      expect(a.R).toBeCloseTo(b.R, 12);
    }

    const observerChanged = noiseless.some((star, i) => {
      const other = noisy[i];
      return Math.abs(star.Mv - other.Mv) > 1e-9 || Math.abs(star.BminusV - other.BminusV) > 1e-9;
    });

    expect(observerChanged).toBe(true);
  });

  it("uses Tout relations for main-sequence stars", () => {
    const stars = HrInferencePopulationModel.generatePopulation({
      N: 40,
      seed: "ms-cluster",
      distancePc: 150,
      photErr: 0,
      modeCluster: true,
      clusterAge: 0,
      binaryFrac: 0,
      metallicityZ: 0.02
    });

    expect(stars.length).toBeGreaterThan(0);

    for (const star of stars) {
      expect(star.stage).toBe("ms");
      const l = ZamsTout1996Model.luminosityLsunFromMassMetallicity({
        massMsun: star.mass,
        metallicityZ: 0.02
      });
      const r = ZamsTout1996Model.radiusRsunFromMassMetallicity({
        massMsun: star.mass,
        metallicityZ: 0.02
      });
      const t = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({
        massMsun: star.mass,
        metallicityZ: 0.02
      });

      expect(star.L).toBeCloseTo(l, 8);
      expect(star.R).toBeCloseTo(r, 8);
      expect(star.Teff).toBeCloseTo(t, 8);
    }
  });

  it("main-sequence lifetime decreases with mass", () => {
    const masses = [0.8, 1, 2, 5, 10, 20];
    const lifetimes = masses.map((m) => HrInferencePopulationModel.mainSequenceLifetimeGyr(m));

    for (let i = 1; i < lifetimes.length; i += 1) {
      expect(lifetimes[i]).toBeLessThan(lifetimes[i - 1]);
    }
  });

  it("produces plausible solar-neighborhood observer-space values for solar-like stars", () => {
    const stars = HrInferencePopulationModel.generatePopulation({
      N: 1500,
      seed: "solar-sanity",
      distancePc: 10,
      photErr: 0,
      modeCluster: true,
      clusterAge: 0,
      binaryFrac: 0,
      metallicityZ: 0.02
    });

    const best = stars.reduce((acc, star) => {
      const delta = Math.abs(star.mass - 1);
      if (!acc || delta < acc.delta) return { star, delta };
      return acc;
    }, null as null | { star: (typeof stars)[number]; delta: number });

    expect(best).not.toBeNull();
    expect(best!.star.Mv).toBeGreaterThan(3.5);
    expect(best!.star.Mv).toBeLessThan(5.5);
    expect(best!.star.BminusV).toBeGreaterThan(0.45);
    expect(best!.star.BminusV).toBeLessThan(0.85);
  });

  it("hotter stars trend bluer on the main sequence", () => {
    const stars = HrInferencePopulationModel.generatePopulation({
      N: 200,
      seed: "color-gradient",
      distancePc: 100,
      photErr: 0,
      modeCluster: true,
      clusterAge: 0,
      binaryFrac: 0,
      metallicityZ: 0.02
    }).sort((a, b) => a.Teff - b.Teff);

    const cool = stars[Math.floor(stars.length * 0.1)];
    const hot = stars[Math.floor(stars.length * 0.9)];

    expect(hot.Teff).toBeGreaterThan(cool.Teff);
    expect(hot.BminusV).toBeLessThan(cool.BminusV);
  });

  it("unresolved binaries brighten observer-space Mv", () => {
    const single = HrInferencePopulationModel.generatePopulation({
      N: 1,
      seed: "binary-brightness",
      distancePc: 100,
      photErr: 0,
      modeCluster: true,
      clusterAge: 0,
      binaryFrac: 0,
      metallicityZ: 0.02
    })[0];

    const binary = HrInferencePopulationModel.generatePopulation({
      N: 1,
      seed: "binary-brightness",
      distancePc: 100,
      photErr: 0,
      modeCluster: true,
      clusterAge: 0,
      binaryFrac: 1,
      metallicityZ: 0.02
    })[0];

    expect(binary.Mv).toBeLessThan(single.Mv);
  });

  it("high-mass old-cluster populations include finite compact-remnant endpoints", () => {
    const stars = HrInferencePopulationModel.generatePopulation({
      N: 5000,
      seed: "compact-remnant-sanity",
      distancePc: 1000,
      photErr: 0.02,
      modeCluster: true,
      clusterAge: 12.5,
      binaryFrac: 0.2,
      metallicityZ: 0.02
    });

    const remnants = stars.filter((star) => star.stage === "compact_remnant");
    expect(remnants.length).toBeGreaterThan(0);

    for (const remnant of remnants) {
      expect(Number.isFinite(remnant.L)).toBe(true);
      expect(Number.isFinite(remnant.R)).toBe(true);
      expect(Number.isFinite(remnant.Teff)).toBe(true);
      expect(remnant.L).toBeGreaterThan(0);
      expect(remnant.R).toBeGreaterThan(0);
      expect(remnant.Teff).toBeGreaterThan(0);
    }
  });

  describe("colour calibration domain (regression)", () => {
    /**
     * bminusVFromTeffK bisects on a bracket whose Ballesteros temperatures span only
     * 2975-21707 K, while the model clamps T_eff into 2800-42000 K. Targets outside that
     * bracket cannot be reached, so the bisection silently returned a bracket endpoint.
     * OBSERVER_AXIS_LIMITS.colorMax is 2.2 -- exactly that endpoint -- so about a quarter
     * of a default population piled onto the right edge of the CMD, and cmdCoordinates
     * clamped rather than culled, stacking them on a single corner pixel.
     */
    it("does not pin a default population onto the bracket endpoints", () => {
      const stars = HrInferencePopulationModel.generatePopulation({ N: 400, seed: "colour-domain", metallicityZ: 0.02, distancePc: 140, photErr: 0.03 });
      // Bracket endpoints are BALLESTEROS_BV_MIN/-MAX = -0.4 / 3.0. A value landing
      // exactly there means the bisection ran out of domain rather than converging.
      const pinnedLow = stars.filter((s) => Number.isFinite(s.BminusV) && s.BminusV <= -0.3999);
      const pinnedHigh = stars.filter((s) => Number.isFinite(s.BminusV) && s.BminusV >= 2.9999);
      // Cool pinning was the defect: 102/400 before the fix, because the bracket's cool
      // end (2975 K) sat well inside the sampled temperature range.
      expect(
        pinnedHigh.length,
        `${pinnedHigh.length}/${stars.length} stars pinned to the cool bracket endpoint`
      ).toBe(0);

      // Hot saturation is physical, not a defect: the Ballesteros relation ends at
      // ~21707 K and real O stars plateau near B-V = -0.33 anyway. It must stay rare.
      expect(
        pinnedLow.length / stars.length,
        `${pinnedLow.length}/${stars.length} stars hotter than the Ballesteros domain`
      ).toBeLessThan(0.02);
    });

    it("keeps a default population inside the plotted magnitude range", () => {
      // Torres BC_V extrapolated below its 3162 K validity floor gave BC_V(2600 K) =
      // -9.38 against a real value near -3, and since M_V = M_bol - BC_V that pushed the
      // coolest dwarfs several magnitudes too faint. With the clamp in place the faintest
      // land near M_V = 16.1, which is correct for 0.1 Msun M dwarfs (Proxima is 15.6),
      // and the CMD axis now extends to 17 to contain them.
      const stars = HrInferencePopulationModel.generatePopulation({
        N: 400,
        seed: "mv-domain",
        metallicityZ: 0.02,
        distancePc: 140,
        photErr: 0.03
      });
      const offBottom = stars.filter((s) => Number.isFinite(s.Mv) && s.Mv > 17);
      expect(
        offBottom.length,
        `${offBottom.length}/${stars.length} stars fainter than the M_V=17 axis limit`
      ).toBe(0);

      // And the divergent extrapolation is genuinely gone.
      const absurdlyFaint = stars.filter((s) => Number.isFinite(s.Mv) && s.Mv > 18.5);
      expect(absurdlyFaint.length).toBe(0);
    });

    it("reproduces solar colour for a solar-mass ZAMS star", () => {
      // Ballesteros: B-V = 0.65 <-> 5778 K. ZAMS solar values are L=0.698, T=5597 K,
      // which maps to B-V ~ 0.70. Use cluster mode at age 0 so the star really is on
      // the ZAMS -- in field mode a 1 Msun star gets a random age up to 12.5 Gyr and
      // may legitimately have evolved off it.
      const stars = HrInferencePopulationModel.generatePopulation({
        N: 800,
        seed: "solar-check",
        metallicityZ: 0.02,
        distancePc: 140,
        photErr: 0.03,
        modeCluster: true,
        clusterAge: 0
      });
      const solarLike = stars.filter((s) => Math.abs(s.mass - 1) < 0.05);
      expect(solarLike.length).toBeGreaterThan(0);
      for (const s of solarLike) {
        expect(s.Teff).toBeGreaterThan(5300);
        expect(s.Teff).toBeLessThan(5900);
        expect(s.BminusV).toBeGreaterThan(0.55);
        expect(s.BminusV).toBeLessThan(0.85);
      }
    });
  });
});
