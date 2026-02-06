import { describe, expect, it } from "vitest";

import { StellarEosModel } from "./stellarEosModel";

function expectRelativeClose(actual: number, expected: number, relativeTolerance: number): void {
  const scale = Math.max(Math.abs(expected), 1);
  expect(Math.abs(actual - expected) / scale).toBeLessThanOrEqual(relativeTolerance);
}

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

  it("uses nonrel finite-T solver in low-x_F transition states", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 8e5,
        densityGPerCm3: 3,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });

    expect(state.fermiRelativityX).toBeLessThan(0.3);
    expect(state.electronDegeneracyMethod).toBe("nonrel-fd");
    expect(state.electronPressureFiniteTDynePerCm2).toBeGreaterThan(0);
  });

  it("uses relativistic finite-T solver in high-x_F transition states", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e8,
        densityGPerCm3: 1e7,
        composition: {
          hydrogenMassFractionX: 0.0,
          heliumMassFractionY: 1.0,
          metalMassFractionZ: 0
        },
        radiationDepartureEta: 1
      }
    });

    expect(state.fermiRelativityX).toBeGreaterThan(0.3);
    expect(state.electronDegeneracyMethod).toBe("relativistic-fd");
    expect(state.electronPressureFiniteTDynePerCm2).toBeGreaterThan(0);
  });

  it("reduces to classical correction near nondegenerate limit", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e8,
        densityGPerCm3: 1e-6,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });

    expect(state.electronDegeneracyMethod).toBe("classical-limit");
    expect(state.electronDegeneracyPressureDynePerCm2).toBeCloseTo(0, 8);
  });

  it("uses zero-T branch when T/T_F is extremely small", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 100,
        densityGPerCm3: 1e6,
        composition: {
          hydrogenMassFractionX: 0,
          heliumMassFractionY: 1,
          metalMassFractionZ: 0
        },
        radiationDepartureEta: 1
      }
    });

    expect(state.chiDegeneracy).toBeLessThan(1e-3);
    expect(state.electronDegeneracyMethod).toBe("zero-t-limit");
    expect(state.electronPressureFiniteTDynePerCm2).toBeCloseTo(
      StellarEosModel.electronDegeneracyPressureZeroTDynePerCm2({
        fermiRelativityX: state.fermiRelativityX
      }),
      6
    );
  });

  it("keeps finite-T electron pressure above or equal to classical pressure in FD branches", () => {
    const nonRelState = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 8e5,
        densityGPerCm3: 3,
        composition: {
          hydrogenMassFractionX: 0.7,
          heliumMassFractionY: 0.28,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });
    const relState = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 1e8,
        densityGPerCm3: 1e7,
        composition: {
          hydrogenMassFractionX: 0,
          heliumMassFractionY: 1,
          metalMassFractionZ: 0
        },
        radiationDepartureEta: 1
      }
    });

    expect(nonRelState.electronDegeneracyMethod).toBe("nonrel-fd");
    expect(relState.electronDegeneracyMethod).toBe("relativistic-fd");
    expect(nonRelState.electronPressureFiniteTDynePerCm2).toBeGreaterThanOrEqual(
      nonRelState.electronPressureClassicalDynePerCm2
    );
    expect(relState.electronPressureFiniteTDynePerCm2).toBeGreaterThanOrEqual(
      relState.electronPressureClassicalDynePerCm2
    );
  });

  it("defines displayed degeneracy as max(P_e,FD - P_e,classical, 0)", () => {
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 2e7,
        densityGPerCm3: 8e4,
        composition: {
          hydrogenMassFractionX: 0.2,
          heliumMassFractionY: 0.78,
          metalMassFractionZ: 0.02
        },
        radiationDepartureEta: 1
      }
    });

    const reconstructed = Math.max(
      state.electronPressureFiniteTDynePerCm2 - state.electronPressureClassicalDynePerCm2,
      0
    );
    expect(state.electronDegeneracyPressureDynePerCm2).toBeCloseTo(reconstructed, 8);
  });

  it("matches the solar-core EOS checkpoint reference values", () => {
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

    expect(state.dominantPressureChannel).toBe("gas");
    expectRelativeClose(state.meanMolecularWeightMu, 0.8547008547008546, 1e-12);
    expectRelativeClose(state.meanMolecularWeightMuE, 1.4925373134328357, 1e-12);
    expectRelativeClose(state.gasPressureDynePerCm2, 2.2909254582845485e17, 1e-9);
    expectRelativeClose(state.radiationPressureDynePerCm2, 1.5322388556019003e14, 1e-9);
    expectRelativeClose(state.electronDegeneracyPressureDynePerCm2, 5.808123130210272e15, 5e-4);
    expectRelativeClose(state.totalPressureDynePerCm2, 2.350538928442253e17, 5e-4);
    expectRelativeClose(state.fermiRelativityX, 0.04690427747699773, 1e-6);
    expectRelativeClose(state.chiDegeneracy, 2.408220754220397, 1e-6);
  });

  it("matches the white-dwarf-core EOS checkpoint reference values", () => {
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

    expect(state.dominantPressureChannel).toBe("degeneracy");
    expectRelativeClose(state.meanMolecularWeightMu, 1.3333333333333333, 1e-12);
    expectRelativeClose(state.meanMolecularWeightMuE, 2, 1e-12);
    expectRelativeClose(state.gasPressureDynePerCm2, 6.235846965769906e20, 1e-9);
    expectRelativeClose(state.radiationPressureDynePerCm2, 2.5219e13, 1e-9);
    expectRelativeClose(state.electronDegeneracyPressureDynePerCm2, 2.58568828569252e22, 1e-3);
    expectRelativeClose(state.totalPressureDynePerCm2, 2.648046757872119e22, 1e-3);
    expectRelativeClose(state.fermiRelativityX, 0.8007195483017491, 1e-6);
    expectRelativeClose(state.chiDegeneracy, 0.005999726901107544, 1e-6);
  });
});
