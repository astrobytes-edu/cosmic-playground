import { describe, expect, it } from "vitest";

import { StellarEosModel } from "./stellarEosModel";

describe("StellarEosModel", () => {
  it("keeps solar-core-like state gas dominated with non-negligible radiation", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1.57e7,
        densityGPerCm3: 150,
        composition: {
          hydrogenMassFractionX: 0.34,
          heliumMassFractionY: 0.64,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });

    expect(state.gasPressureDynePerCm2).toBeGreaterThan(state.radiationPressureDynePerCm2);
    expect(state.pressureRatios.radiationToGas).toBeGreaterThan(1e-4);
    expect(state.pressureRatios.radiationToGas).toBeLessThan(0.2);
    expect(state.dominantPressureChannel).toBe("gas");
  });

  it("keeps white-dwarf-like state degeneracy dominated", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e7,
        densityGPerCm3: 1e6,
        composition: {
          hydrogenMassFractionX: 0,
          heliumMassFractionY: 1,
          metalMassFractionZ: 0
        },
        radiationDepartureEta: 1
      }
    });

    expect(state.electronDegeneracyPressureDynePerCm2).toBeGreaterThan(state.gasPressureDynePerCm2);
    expect(state.electronDegeneracyPressureDynePerCm2).toBeGreaterThan(
      state.radiationPressureDynePerCm2
    );
    expect(state.dominantPressureChannel).toBe("degeneracy");
  });

  it("obeys P_rad proportional T^4 at fixed density", () => {
    const rho = 1;
    const t1 = 1e6;
    const t2 = 2e6;

    const p1 = StellarEosModel.radiationPressureDynePerCm2({
      temperatureK: t1,
      radiationDepartureEta: 1
    });
    const p2 = StellarEosModel.radiationPressureDynePerCm2({
      temperatureK: t2,
      radiationDepartureEta: 1
    });

    expect(p2 / p1).toBeCloseTo(Math.pow(t2 / t1, 4), 10);

    const gas1 = StellarEosModel.gasPressureDynePerCm2({
      densityGPerCm3: rho,
      temperatureK: t1,
      meanMolecularWeightMu: 0.62
    });
    const gas2 = StellarEosModel.gasPressureDynePerCm2({
      densityGPerCm3: rho,
      temperatureK: t2,
      meanMolecularWeightMu: 0.62
    });
    expect(gas2 / gas1).toBeCloseTo(t2 / t1, 10);
  });

  it("obeys P_gas proportional rho at fixed T", () => {
    const t = 1e6;
    const rho1 = 1e-4;
    const rho2 = 1e-1;

    const p1 = StellarEosModel.gasPressureDynePerCm2({
      densityGPerCm3: rho1,
      temperatureK: t,
      meanMolecularWeightMu: 0.62
    });
    const p2 = StellarEosModel.gasPressureDynePerCm2({
      densityGPerCm3: rho2,
      temperatureK: t,
      meanMolecularWeightMu: 0.62
    });

    expect(p2 / p1).toBeCloseTo(rho2 / rho1, 10);
  });

  it("keeps pF monotonic with density", () => {
    const pLow = StellarEosModel.fermiMomentumGCmPerS({
      electronNumberDensityPerCm3: StellarEosModel.electronNumberDensityPerCm3({
        densityGPerCm3: 1,
        meanMolecularWeightMuE: 2
      })
    });
    const pHigh = StellarEosModel.fermiMomentumGCmPerS({
      electronNumberDensityPerCm3: StellarEosModel.electronNumberDensityPerCm3({
        densityGPerCm3: 1e6,
        meanMolecularWeightMuE: 2
      })
    });

    expect(pHigh).toBeGreaterThan(pLow);
  });

  it("shows expected NR to relativistic slope transition trend", () => {
    const muE = 2;

    const pressureAtRho = (densityGPerCm3: number) => {
      const nE = StellarEosModel.electronNumberDensityPerCm3({
        densityGPerCm3,
        meanMolecularWeightMuE: muE
      });
      const xF = StellarEosModel.fermiRelativityX({
        fermiMomentumGCmPerS: StellarEosModel.fermiMomentumGCmPerS({
          electronNumberDensityPerCm3: nE
        })
      });
      return StellarEosModel.electronDegeneracyPressureZeroTDynePerCm2({
        fermiRelativityX: xF
      });
    };

    const rhoLow1 = 1;
    const rhoLow2 = 1e2;
    const slopeLow =
      Math.log10(pressureAtRho(rhoLow2) / pressureAtRho(rhoLow1)) /
      Math.log10(rhoLow2 / rhoLow1);

    const rhoHigh1 = 1e8;
    const rhoHigh2 = 1e10;
    const slopeHigh =
      Math.log10(pressureAtRho(rhoHigh2) / pressureAtRho(rhoHigh1)) /
      Math.log10(rhoHigh2 / rhoHigh1);

    expect(slopeLow).toBeGreaterThan(1.5);
    expect(slopeLow).toBeLessThan(1.75);

    expect(slopeHigh).toBeGreaterThan(1.28);
    expect(slopeHigh).toBeLessThan(1.42);
  });

  it("changes mu and mu_e with composition shifts", () => {
    const hydrogenRich = StellarEosModel.normalizeComposition({
      hydrogenMassFractionX: 0.75,
      heliumMassFractionY: 0.23,
      metalMassFractionZ: 0.02
    });
    const hydrogenPoor = StellarEosModel.normalizeComposition({
      hydrogenMassFractionX: 0.05,
      heliumMassFractionY: 0.93,
      metalMassFractionZ: 0.02
    });

    const muHydrogenRich = StellarEosModel.meanMolecularWeightMu(hydrogenRich);
    const muHydrogenPoor = StellarEosModel.meanMolecularWeightMu(hydrogenPoor);

    const muEHydrogenRich = StellarEosModel.meanMolecularWeightMuE(hydrogenRich);
    const muEHydrogenPoor = StellarEosModel.meanMolecularWeightMuE(hydrogenPoor);

    expect(muHydrogenPoor).toBeGreaterThan(muHydrogenRich);
    expect(muEHydrogenPoor).toBeGreaterThan(muEHydrogenRich);
  });

  it("allows extension pressure terms for future plugins", () => {
    const noExtension = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e7,
        densityGPerCm3: 1,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });

    const withExtension = StellarEosModel.evaluateStateCgs({
      input: noExtension.input,
      additionalPressureTerms: [{ id: "neutron-prototype", pressureDynePerCm2: 1e10 }]
    });

    expect(withExtension.additionalPressureTerms).toHaveLength(1);
    expect(withExtension.totalPressureDynePerCm2).toBeCloseTo(
      noExtension.totalPressureDynePerCm2 + 1e10,
      4
    );
  });

  it("classifies electron Fermi relativity regime from x_F", () => {
    const lowDensity = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e7,
        densityGPerCm3: 1,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });
    const highDensity = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e7,
        densityGPerCm3: 1e9,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });

    expect(lowDensity.fermiRelativityRegime.tag).toBe("non-relativistic");
    expect(highDensity.fermiRelativityRegime.tag).toBe("relativistic");
  });

  it("reports finite-temperature degeneracy proxy diagnostics", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e4,
        densityGPerCm3: 1e4,
        composition: {
          hydrogenMassFractionX: 0.0,
          heliumMassFractionY: 1.0,
          metalMassFractionZ: 0
        },
        radiationDepartureEta: 1
      }
    });

    expect(state.finiteTemperatureDegeneracyCorrectionFactor).toBeGreaterThan(1);
    expect(state.finiteTemperatureDegeneracyAssessment.tag).toBe("applicable");
    expect(state.electronDegeneracyPressureSommerfeldDynePerCm2).toBeGreaterThan(
      state.electronDegeneracyPressureDynePerCm2
    );
  });

  it("tracks neutron extension pressure channel when present", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e7,
        densityGPerCm3: 1e6,
        composition: {
          hydrogenMassFractionX: 0.0,
          heliumMassFractionY: 1.0,
          metalMassFractionZ: 0
        },
        radiationDepartureEta: 1
      },
      additionalPressureTerms: [
        { id: "neutron-baseline", pressureDynePerCm2: 2.5e15 },
        { id: "magnetic", pressureDynePerCm2: 1e12 }
      ]
    });

    expect(state.neutronExtensionPressureDynePerCm2).toBeCloseTo(2.5e15, 3);
    expect(state.neutronExtensionPressureFractionOfTotal).toBeGreaterThan(0);
  });

  it("classifies extension terms as dominant when they exceed base channels", () => {
    const base = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e7,
        densityGPerCm3: 1e3,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });

    const withDominantExtension = StellarEosModel.evaluateStateCgs({
      input: base.input,
      additionalPressureTerms: [
        {
          id: "neutron-extension-dominant",
          pressureDynePerCm2: 10 * base.totalPressureDynePerCm2
        }
      ]
    });

    expect(withDominantExtension.dominantPressureChannel).toBe("extension");
  });

  it("only reports finite-T Sommerfeld proxy in its validity regime", () => {
    const strongValidity = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e4,
        densityGPerCm3: 1e4,
        composition: {
          hydrogenMassFractionX: 0,
          heliumMassFractionY: 1,
          metalMassFractionZ: 0
        },
        radiationDepartureEta: 1
      }
    });
    const outsideValidity = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e8,
        densityGPerCm3: 1e2,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });

    expect(strongValidity.finiteTemperatureDegeneracyCorrectionFactor).toBeGreaterThan(1);
    expect(strongValidity.finiteTemperatureDegeneracyAssessment.tag).toBe("applicable");

    expect(Number.isNaN(outsideValidity.finiteTemperatureDegeneracyCorrectionFactor)).toBe(true);
    expect(outsideValidity.finiteTemperatureDegeneracyAssessment.tag).toBe("outside-validity");
  });

  it("keeps eta_rad=0 consistent between closure framing and pressure channel", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e6,
        densityGPerCm3: 1,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 0
      }
    });

    expect(state.radiationPressureDynePerCm2).toBeCloseTo(0, 12);
    expect(state.radiationClosureAssessment.tag).toBe("proxy");
  });
});
