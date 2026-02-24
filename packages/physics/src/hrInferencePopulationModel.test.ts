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
});
