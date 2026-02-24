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
});
