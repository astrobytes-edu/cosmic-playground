const CGS_CONSTANTS = {
  kBoltzmannErgPerK: 1.380649e-16,
  atomicMassUnitG: 1.6605390666e-24,
  radiationConstantAErgPerCm3K4: 7.5657e-15,
  hbarErgS: 1.054571817e-27,
  electronMassG: 9.1093837015e-28,
  speedOfLightCmPerS: 2.99792458e10
} as const;

export type StellarCompositionFractions = {
  hydrogenMassFractionX: number;
  heliumMassFractionY: number;
  metalMassFractionZ: number;
};

export type StellarEosInputCgs = {
  temperatureK: number;
  densityGPerCm3: number;
  composition: StellarCompositionFractions;
  radiationDepartureEta: number;
};

export type AdditionalPressureTerm = {
  id: string;
  pressureDynePerCm2: number;
  note?: string;
};

export type RadiationClosureAssessment = {
  tag: "lte-like" | "caution" | "proxy" | "invalid";
  label: string;
  note: string;
};

export type DegeneracyRegime = {
  tag: "strong" | "transition" | "weak" | "invalid";
  label: string;
};

export type PressureDominance = "gas" | "radiation" | "degeneracy" | "mixed" | "invalid";

export type StellarEosStateCgs = {
  input: StellarEosInputCgs;
  normalizedComposition: StellarCompositionFractions;
  meanMolecularWeightMu: number;
  meanMolecularWeightMuE: number;
  particleNumberDensityPerCm3: number;
  electronNumberDensityPerCm3: number;
  gasPressureDynePerCm2: number;
  radiationPressureDynePerCm2: number;
  electronDegeneracyPressureDynePerCm2: number;
  additionalPressureTerms: AdditionalPressureTerm[];
  totalPressureDynePerCm2: number;
  pressureFractions: {
    gas: number;
    radiation: number;
    degeneracy: number;
  };
  pressureRatios: {
    radiationToGas: number;
    degeneracyToTotal: number;
    betaGasToTotal: number;
  };
  fermiMomentumGCmPerS: number;
  fermiRelativityX: number;
  fermiEnergyErg: number;
  fermiTemperatureK: number;
  chiDegeneracy: number;
  degeneracyRegime: DegeneracyRegime;
  dominantPressureChannel: PressureDominance;
  radiationClosureAssessment: RadiationClosureAssessment;
};

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function sanitizeFraction(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function normalizeComposition(composition: StellarCompositionFractions): StellarCompositionFractions {
  const xRaw = sanitizeFraction(composition.hydrogenMassFractionX);
  const yRaw = sanitizeFraction(composition.heliumMassFractionY);
  const zRaw = sanitizeFraction(composition.metalMassFractionZ);
  const total = xRaw + yRaw + zRaw;

  if (!(total > 0)) {
    return {
      hydrogenMassFractionX: 0.7,
      heliumMassFractionY: 0.28,
      metalMassFractionZ: 0.02
    };
  }

  return {
    hydrogenMassFractionX: xRaw / total,
    heliumMassFractionY: yRaw / total,
    metalMassFractionZ: zRaw / total
  };
}

function meanMolecularWeightMu(composition: StellarCompositionFractions): number {
  const { hydrogenMassFractionX: x, heliumMassFractionY: y, metalMassFractionZ: z } = composition;
  const denominator = 2 * x + 0.75 * y + 0.5 * z;
  if (!isFinitePositive(denominator)) return Number.NaN;
  return 1 / denominator;
}

function meanMolecularWeightMuE(composition: StellarCompositionFractions): number {
  const { hydrogenMassFractionX: x, heliumMassFractionY: y, metalMassFractionZ: z } = composition;
  const denominator = x + 0.5 * y + 0.5 * z;
  if (!isFinitePositive(denominator)) return Number.NaN;
  return 1 / denominator;
}

function gasPressureDynePerCm2(args: {
  densityGPerCm3: number;
  temperatureK: number;
  meanMolecularWeightMu: number;
}): number {
  const { densityGPerCm3, temperatureK, meanMolecularWeightMu: mu } = args;
  if (!isFinitePositive(densityGPerCm3) || !isFinitePositive(temperatureK) || !isFinitePositive(mu)) {
    return Number.NaN;
  }
  return (
    (densityGPerCm3 * CGS_CONSTANTS.kBoltzmannErgPerK * temperatureK) /
    (mu * CGS_CONSTANTS.atomicMassUnitG)
  );
}

function radiationPressureDynePerCm2(args: {
  temperatureK: number;
  radiationDepartureEta: number;
}): number {
  const { temperatureK, radiationDepartureEta: eta } = args;
  if (!isFinitePositive(temperatureK) || !isFiniteNonNegative(eta)) return Number.NaN;
  return (eta * CGS_CONSTANTS.radiationConstantAErgPerCm3K4 * Math.pow(temperatureK, 4)) / 3;
}

function electronNumberDensityPerCm3(args: {
  densityGPerCm3: number;
  meanMolecularWeightMuE: number;
}): number {
  const { densityGPerCm3, meanMolecularWeightMuE: muE } = args;
  if (!isFinitePositive(densityGPerCm3) || !isFinitePositive(muE)) return Number.NaN;
  return densityGPerCm3 / (muE * CGS_CONSTANTS.atomicMassUnitG);
}

function fermiMomentumGCmPerS(args: { electronNumberDensityPerCm3: number }): number {
  const { electronNumberDensityPerCm3: nElectronPerCm3 } = args;
  if (!isFinitePositive(nElectronPerCm3)) return Number.NaN;
  return CGS_CONSTANTS.hbarErgS * Math.pow(3 * Math.PI * Math.PI * nElectronPerCm3, 1 / 3);
}

function fermiRelativityX(args: { fermiMomentumGCmPerS: number }): number {
  const { fermiMomentumGCmPerS: pF } = args;
  if (!isFinitePositive(pF)) return Number.NaN;
  return pF / (CGS_CONSTANTS.electronMassG * CGS_CONSTANTS.speedOfLightCmPerS);
}

function fermiEnergyErg(args: { fermiMomentumGCmPerS: number }): number {
  const { fermiMomentumGCmPerS: pF } = args;
  if (!isFinitePositive(pF)) return Number.NaN;
  const mec2Erg =
    CGS_CONSTANTS.electronMassG *
    CGS_CONSTANTS.speedOfLightCmPerS *
    CGS_CONSTANTS.speedOfLightCmPerS;
  const totalEnergyErg = Math.sqrt(
    pF * pF * CGS_CONSTANTS.speedOfLightCmPerS * CGS_CONSTANTS.speedOfLightCmPerS +
      mec2Erg * mec2Erg
  );
  return totalEnergyErg - mec2Erg;
}

function fermiTemperatureK(args: { fermiEnergyErg: number }): number {
  const { fermiEnergyErg: eF } = args;
  if (!isFinitePositive(eF)) return Number.NaN;
  return eF / CGS_CONSTANTS.kBoltzmannErgPerK;
}

function electronDegeneracyPressureZeroTDynePerCm2(args: {
  fermiRelativityX: number;
}): number {
  const { fermiRelativityX: x } = args;
  if (!isFinitePositive(x)) return Number.NaN;
  const prefactor =
    (Math.pow(CGS_CONSTANTS.electronMassG, 4) *
      Math.pow(CGS_CONSTANTS.speedOfLightCmPerS, 5)) /
    (8 * Math.PI * Math.PI * Math.pow(CGS_CONSTANTS.hbarErgS, 3));
  const bracket =
    x * (2 * x * x - 3) * Math.sqrt(1 + x * x) + 3 * Math.asinh(x);
  return prefactor * bracket;
}

function classifyDegeneracyRegime(args: { chiDegeneracy: number }): DegeneracyRegime {
  const { chiDegeneracy: chi } = args;
  if (!Number.isFinite(chi) || chi <= 0) {
    return { tag: "invalid", label: "Degeneracy diagnostic unavailable" };
  }
  if (chi < 0.1) {
    return { tag: "strong", label: "Strongly degenerate (T/T_F << 1)" };
  }
  if (chi <= 3) {
    return { tag: "transition", label: "Transition regime (T/T_F ~ 1)" };
  }
  return { tag: "weak", label: "Weakly/non-degenerate (T/T_F >> 1)" };
}

function assessRadiationClosure(args: {
  densityGPerCm3: number;
  temperatureK: number;
  radiationDepartureEta: number;
}): RadiationClosureAssessment {
  const { densityGPerCm3: rho, temperatureK: temperatureK, radiationDepartureEta: eta } = args;

  if (!isFinitePositive(temperatureK) || !isFinitePositive(rho) || !isFinitePositive(eta)) {
    return {
      tag: "invalid",
      label: "Radiation closure unavailable",
      note: "Provide positive T, rho, and eta_rad to evaluate LTE framing."
    };
  }

  if (Math.abs(eta - 1) > 1e-6) {
    return {
      tag: "proxy",
      label: "Proxy mode active (eta_rad != 1)",
      note: "eta_rad is a pedagogical proxy for non-LTE departures, not a full radiative-transfer solver."
    };
  }

  const likelyLte = rho >= 1e-7 && temperatureK <= 3e7;
  if (likelyLte) {
    return {
      tag: "lte-like",
      label: "LTE closure likely reasonable",
      note: "Heuristic only: optically thick and near-equilibrium conditions are more plausible here."
    };
  }

  return {
    tag: "caution",
    label: "Use LTE closure with caution",
    note: "Low-density/high-temperature states may violate isotropic LTE assumptions for P_rad = aT^4/3."
  };
}

function classifyDominantPressure(args: {
  gasPressureDynePerCm2: number;
  radiationPressureDynePerCm2: number;
  electronDegeneracyPressureDynePerCm2: number;
}): PressureDominance {
  const values = [
    ["gas", args.gasPressureDynePerCm2],
    ["radiation", args.radiationPressureDynePerCm2],
    ["degeneracy", args.electronDegeneracyPressureDynePerCm2]
  ] as const;

  if (!values.every(([, value]) => isFinitePositive(value))) return "invalid";

  const sorted = values.slice().sort((a, b) => b[1] - a[1]);
  const top = sorted[0][1];
  const second = sorted[1][1];
  if (!(top > 0)) return "invalid";
  if (second / top >= 0.8) return "mixed";
  return sorted[0][0];
}

function safeRatio(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || !(denominator > 0)) {
    return Number.NaN;
  }
  return numerator / denominator;
}

export const StellarEosModel = {
  CGS_CONSTANTS,
  normalizeComposition,
  meanMolecularWeightMu,
  meanMolecularWeightMuE,
  gasPressureDynePerCm2,
  radiationPressureDynePerCm2,
  electronNumberDensityPerCm3,
  fermiMomentumGCmPerS,
  fermiRelativityX,
  fermiEnergyErg,
  fermiTemperatureK,
  electronDegeneracyPressureZeroTDynePerCm2,
  classifyDegeneracyRegime,
  assessRadiationClosure,
  classifyDominantPressure,
  evaluateStateCgs(args: {
    input: StellarEosInputCgs;
    additionalPressureTerms?: AdditionalPressureTerm[];
    degeneracyPressureProvider?: (providerArgs: {
      fermiRelativityX: number;
      electronNumberDensityPerCm3: number;
      defaultPressureDynePerCm2: number;
    }) => number;
  }): StellarEosStateCgs {
    const composition = normalizeComposition(args.input.composition);
    const mu = meanMolecularWeightMu(composition);
    const muE = meanMolecularWeightMuE(composition);

    const particleNumberDensity =
      isFinitePositive(args.input.densityGPerCm3) && isFinitePositive(mu)
        ? args.input.densityGPerCm3 / (mu * CGS_CONSTANTS.atomicMassUnitG)
        : Number.NaN;

    const nElectron = electronNumberDensityPerCm3({
      densityGPerCm3: args.input.densityGPerCm3,
      meanMolecularWeightMuE: muE
    });

    const pF = fermiMomentumGCmPerS({ electronNumberDensityPerCm3: nElectron });
    const xF = fermiRelativityX({ fermiMomentumGCmPerS: pF });
    const eF = fermiEnergyErg({ fermiMomentumGCmPerS: pF });
    const tF = fermiTemperatureK({ fermiEnergyErg: eF });

    const gasPressure = gasPressureDynePerCm2({
      densityGPerCm3: args.input.densityGPerCm3,
      temperatureK: args.input.temperatureK,
      meanMolecularWeightMu: mu
    });
    const radiationPressure = radiationPressureDynePerCm2({
      temperatureK: args.input.temperatureK,
      radiationDepartureEta: args.input.radiationDepartureEta
    });

    const defaultDegPressure = electronDegeneracyPressureZeroTDynePerCm2({
      fermiRelativityX: xF
    });
    const degeneracyPressure = args.degeneracyPressureProvider
      ? args.degeneracyPressureProvider({
          fermiRelativityX: xF,
          electronNumberDensityPerCm3: nElectron,
          defaultPressureDynePerCm2: defaultDegPressure
        })
      : defaultDegPressure;

    const additionalPressureTerms = (args.additionalPressureTerms ?? []).filter(
      (term) => term && typeof term.id === "string" && Number.isFinite(term.pressureDynePerCm2)
    );

    const additionalPressureSum = additionalPressureTerms.reduce(
      (sum, term) => sum + term.pressureDynePerCm2,
      0
    );

    const totalPressure =
      gasPressure + radiationPressure + degeneracyPressure + additionalPressureSum;

    const chiDeg = safeRatio(args.input.temperatureK, tF);

    return {
      input: args.input,
      normalizedComposition: composition,
      meanMolecularWeightMu: mu,
      meanMolecularWeightMuE: muE,
      particleNumberDensityPerCm3: particleNumberDensity,
      electronNumberDensityPerCm3: nElectron,
      gasPressureDynePerCm2: gasPressure,
      radiationPressureDynePerCm2: radiationPressure,
      electronDegeneracyPressureDynePerCm2: degeneracyPressure,
      additionalPressureTerms,
      totalPressureDynePerCm2: totalPressure,
      pressureFractions: {
        gas: safeRatio(gasPressure, totalPressure),
        radiation: safeRatio(radiationPressure, totalPressure),
        degeneracy: safeRatio(degeneracyPressure, totalPressure)
      },
      pressureRatios: {
        radiationToGas: safeRatio(radiationPressure, gasPressure),
        degeneracyToTotal: safeRatio(degeneracyPressure, totalPressure),
        betaGasToTotal: safeRatio(gasPressure, totalPressure)
      },
      fermiMomentumGCmPerS: pF,
      fermiRelativityX: xF,
      fermiEnergyErg: eF,
      fermiTemperatureK: tF,
      chiDegeneracy: chiDeg,
      degeneracyRegime: classifyDegeneracyRegime({ chiDegeneracy: chiDeg }),
      dominantPressureChannel: classifyDominantPressure({
        gasPressureDynePerCm2: gasPressure,
        radiationPressureDynePerCm2: radiationPressure,
        electronDegeneracyPressureDynePerCm2: degeneracyPressure
      }),
      radiationClosureAssessment: assessRadiationClosure({
        densityGPerCm3: args.input.densityGPerCm3,
        temperatureK: args.input.temperatureK,
        radiationDepartureEta: args.input.radiationDepartureEta
      })
    };
  }
} as const;
