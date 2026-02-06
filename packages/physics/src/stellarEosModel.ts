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

export type FermiRelativityRegime = {
  tag: "non-relativistic" | "trans-relativistic" | "relativistic" | "invalid";
  label: string;
};

export type FiniteTemperatureDegeneracyAssessment = {
  tag: "applicable" | "outside-validity" | "invalid";
  label: string;
  note: string;
};

export type ElectronDegeneracyMethod =
  | "zero-t-limit"
  | "classical-limit"
  | "nonrel-fd"
  | "relativistic-fd"
  | "override"
  | "invalid";

export type PressureDominance =
  | "gas"
  | "radiation"
  | "degeneracy"
  | "extension"
  | "mixed"
  | "invalid";

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
    extension: number;
  };
  pressureRatios: {
    radiationToGas: number;
    degeneracyToTotal: number;
    betaGasToTotal: number;
    extensionToTotal: number;
  };
  fermiMomentumGCmPerS: number;
  fermiRelativityX: number;
  fermiEnergyErg: number;
  fermiTemperatureK: number;
  chiDegeneracy: number;
  electronPressureClassicalDynePerCm2: number;
  electronPressureFiniteTDynePerCm2: number;
  electronDegeneracyMethod: ElectronDegeneracyMethod;
  degeneracyRegime: DegeneracyRegime;
  fermiRelativityRegime: FermiRelativityRegime;
  finiteTemperatureDegeneracyAssessment: FiniteTemperatureDegeneracyAssessment;
  finiteTemperatureDegeneracyCorrectionFactor: number;
  electronDegeneracyPressureSommerfeldDynePerCm2: number;
  extensionPressureDynePerCm2: number;
  neutronExtensionPressureDynePerCm2: number;
  neutronExtensionPressureFractionOfTotal: number;
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

function classifyFermiRelativityRegime(args: {
  fermiRelativityX: number;
}): FermiRelativityRegime {
  const { fermiRelativityX: x } = args;
  if (!Number.isFinite(x) || x <= 0) {
    return { tag: "invalid", label: "Fermi relativity diagnostic unavailable" };
  }
  if (x < 0.3) {
    return { tag: "non-relativistic", label: "Non-relativistic electron momenta (x_F << 1)" };
  }
  if (x <= 1) {
    return { tag: "trans-relativistic", label: "Trans-relativistic electron momenta (x_F ~ 1)" };
  }
  return { tag: "relativistic", label: "Relativistic electron momenta (x_F > 1)" };
}

function finiteTemperatureDegeneracyCorrectionFactor(args: {
  chiDegeneracy: number;
  fermiRelativityX: number;
}): number {
  const { chiDegeneracy: chi, fermiRelativityX: xF } = args;
  if (!Number.isFinite(chi) || chi <= 0 || !Number.isFinite(xF) || xF <= 0) return Number.NaN;

  // Non-relativistic Sommerfeld expansion for pressure:
  // P(T)/P(0) ≈ 1 + (5π²/12)(T/T_F)², valid for x_F << 1 and T/T_F << 1.
  if (xF >= 0.3 || chi > 0.3) return Number.NaN;

  const correction = 1 + (5 * Math.PI * Math.PI * chi * chi) / 12;
  return correction;
}

function assessFiniteTemperatureDegeneracy(args: {
  chiDegeneracy: number;
  fermiRelativityX: number;
}): FiniteTemperatureDegeneracyAssessment {
  const { chiDegeneracy: chi, fermiRelativityX: xF } = args;
  if (!Number.isFinite(chi) || chi <= 0 || !Number.isFinite(xF) || xF <= 0) {
    return {
      tag: "invalid",
      label: "Finite-T degeneracy proxy unavailable",
      note: "Needs positive finite x_F and T/T_F."
    };
  }

  if (xF < 0.3 && chi <= 0.3) {
    return {
      tag: "applicable",
      label: "Sommerfeld proxy applicable",
      note: "Uses non-relativistic low-temperature expansion (x_F << 1 and T/T_F << 1)."
    };
  }

  return {
    tag: "outside-validity",
    label: "Sommerfeld proxy outside validity",
    note: "Displayed only in non-relativistic, strongly degenerate states."
  };
}

function fermiOccupation(exponent: number): number {
  if (exponent >= 80) return 0;
  if (exponent <= -80) return 1;
  return 1 / (Math.exp(exponent) + 1);
}

function simpsonIntegratePair(args: {
  xMin: number;
  xMax: number;
  intervals: number;
  evaluate: (x: number) => { numberIntegrand: number; pressureIntegrand: number };
}): { numberIntegral: number; pressureIntegral: number } {
  const { xMin, xMax } = args;
  let intervals = Math.max(2, Math.floor(args.intervals));
  if (intervals % 2 !== 0) intervals += 1;

  const h = (xMax - xMin) / intervals;
  let numberSum = 0;
  let pressureSum = 0;

  for (let i = 0; i <= intervals; i += 1) {
    const x = xMin + i * h;
    const values = args.evaluate(x);
    const weight = i === 0 || i === intervals ? 1 : i % 2 === 0 ? 2 : 4;
    numberSum += weight * values.numberIntegrand;
    pressureSum += weight * values.pressureIntegrand;
  }

  return {
    numberIntegral: (h / 3) * numberSum,
    pressureIntegral: (h / 3) * pressureSum
  };
}

function solveBisection(args: {
  lower: number;
  upper: number;
  maxIterations: number;
  relativeTolerance: number;
  evaluate: (x: number) => number;
}): { root: number; converged: boolean } {
  let lower = args.lower;
  let upper = args.upper;
  let fLower = args.evaluate(lower);
  let fUpper = args.evaluate(upper);

  if (!Number.isFinite(fLower) || !Number.isFinite(fUpper) || fLower > 0 || fUpper < 0) {
    return { root: Number.NaN, converged: false };
  }

  let best = 0.5 * (lower + upper);
  for (let i = 0; i < args.maxIterations; i += 1) {
    const mid = 0.5 * (lower + upper);
    const fMid = args.evaluate(mid);
    if (!Number.isFinite(fMid)) return { root: Number.NaN, converged: false };

    best = mid;
    const width = Math.max(1, Math.abs(mid));
    if (Math.abs(fMid) <= args.relativeTolerance) {
      return { root: mid, converged: true };
    }
    if ((upper - lower) / width < args.relativeTolerance) {
      return { root: mid, converged: true };
    }

    if (fMid < 0) {
      lower = mid;
      fLower = fMid;
    } else {
      upper = mid;
      fUpper = fMid;
    }
    if (!Number.isFinite(fLower) || !Number.isFinite(fUpper)) {
      return { root: Number.NaN, converged: false };
    }
  }

  return { root: best, converged: false };
}

function electronPressureFiniteTNonRelDynePerCm2(args: {
  electronNumberDensityPerCm3: number;
  temperatureK: number;
}): { pressureDynePerCm2: number; converged: boolean } {
  const { electronNumberDensityPerCm3: nElectron, temperatureK } = args;
  if (!isFinitePositive(nElectron) || !isFinitePositive(temperatureK)) {
    return { pressureDynePerCm2: Number.NaN, converged: false };
  }

  const hErgS = 2 * Math.PI * CGS_CONSTANTS.hbarErgS;
  const thermalScale = 2 * CGS_CONSTANTS.electronMassG * CGS_CONSTANTS.kBoltzmannErgPerK * temperatureK;
  const prefactorN =
    (4 * Math.PI * Math.pow(thermalScale, 1.5)) / Math.pow(hErgS, 3);
  const prefactorP =
    (4 * Math.PI * Math.pow(thermalScale, 2.5)) /
    (3 * Math.pow(hErgS, 3) * CGS_CONSTANTS.electronMassG);

  if (!isFinitePositive(prefactorN) || !isFinitePositive(prefactorP)) {
    return { pressureDynePerCm2: Number.NaN, converged: false };
  }

  const evaluateDensityResidual = (eta: number): number => {
    const yMax = Math.max(40, eta + 40);
    const integrals = simpsonIntegratePair({
      xMin: 0,
      xMax: yMax,
      intervals: 192,
      evaluate: (y) => {
        const rootY = Math.sqrt(y);
        const occ = fermiOccupation(y - eta);
        return {
          numberIntegrand: rootY * occ,
          pressureIntegrand: y * rootY * occ
        };
      }
    });
    return prefactorN * integrals.numberIntegral - nElectron;
  };

  let lower = -40;
  let upper = 8;
  let fUpper = evaluateDensityResidual(upper);
  let guard = 0;
  while (fUpper < 0 && upper < 240 && guard < 80) {
    upper += 4;
    fUpper = evaluateDensityResidual(upper);
    guard += 1;
  }

  const solution = solveBisection({
    lower,
    upper,
    maxIterations: 80,
    relativeTolerance: 1e-6,
    evaluate: evaluateDensityResidual
  });
  if (!Number.isFinite(solution.root)) {
    return { pressureDynePerCm2: Number.NaN, converged: false };
  }

  const yMax = Math.max(40, solution.root + 40);
  const integrals = simpsonIntegratePair({
    xMin: 0,
    xMax: yMax,
    intervals: 192,
    evaluate: (y) => {
      const rootY = Math.sqrt(y);
      const occ = fermiOccupation(y - solution.root);
      return {
        numberIntegrand: rootY * occ,
        pressureIntegrand: y * rootY * occ
      };
    }
  });

  return {
    pressureDynePerCm2: prefactorP * integrals.pressureIntegral,
    converged: solution.converged
  };
}

function electronPressureFiniteTRelativisticDynePerCm2(args: {
  electronNumberDensityPerCm3: number;
  temperatureK: number;
}): { pressureDynePerCm2: number; converged: boolean } {
  const { electronNumberDensityPerCm3: nElectron, temperatureK } = args;
  if (!isFinitePositive(nElectron) || !isFinitePositive(temperatureK)) {
    return { pressureDynePerCm2: Number.NaN, converged: false };
  }

  const beta =
    (CGS_CONSTANTS.kBoltzmannErgPerK * temperatureK) /
    (CGS_CONSTANTS.electronMassG *
      CGS_CONSTANTS.speedOfLightCmPerS *
      CGS_CONSTANTS.speedOfLightCmPerS);
  if (!isFinitePositive(beta)) {
    return { pressureDynePerCm2: Number.NaN, converged: false };
  }

  const prefactorN =
    Math.pow(CGS_CONSTANTS.electronMassG * CGS_CONSTANTS.speedOfLightCmPerS, 3) /
    (Math.PI * Math.PI * Math.pow(CGS_CONSTANTS.hbarErgS, 3));
  const prefactorP =
    (Math.pow(CGS_CONSTANTS.electronMassG, 4) * Math.pow(CGS_CONSTANTS.speedOfLightCmPerS, 5)) /
    (3 * Math.PI * Math.PI * Math.pow(CGS_CONSTANTS.hbarErgS, 3));
  const xFZeroT = Math.cbrt((3 * nElectron) / prefactorN);
  const thetaZeroT = Math.sqrt(1 + xFZeroT * xFZeroT) - 1;

  const evaluateDensityResidual = (theta: number): number => {
    const qFEstimate = theta > 0 ? Math.sqrt(theta * (theta + 2)) : 0;
    const qMax = Math.max(24, qFEstimate + 24);
    const uMax = Math.asinh(qMax);

    const integrals = simpsonIntegratePair({
      xMin: 0,
      xMax: uMax,
      intervals: 224,
      evaluate: (u) => {
        const sinhU = Math.sinh(u);
        const coshU = Math.cosh(u);
        const kineticOverMec2 = coshU - 1;
        const occ = fermiOccupation((kineticOverMec2 - theta) / beta);
        return {
          numberIntegrand: sinhU * sinhU * coshU * occ,
          pressureIntegrand: Math.pow(sinhU, 4) * occ
        };
      }
    });

    return prefactorN * integrals.numberIntegral - nElectron;
  };

  const lower = -12;
  let upper = Math.max(4, thetaZeroT + 4);
  let fUpper = evaluateDensityResidual(upper);
  let guard = 0;
  while (fUpper < 0 && upper < 512 && guard < 100) {
    upper += 6;
    fUpper = evaluateDensityResidual(upper);
    guard += 1;
  }

  const solution = solveBisection({
    lower,
    upper,
    maxIterations: 100,
    relativeTolerance: 1e-6,
    evaluate: evaluateDensityResidual
  });
  if (!Number.isFinite(solution.root)) {
    return { pressureDynePerCm2: Number.NaN, converged: false };
  }

  const qFEstimate = solution.root > 0 ? Math.sqrt(solution.root * (solution.root + 2)) : 0;
  const qMax = Math.max(24, qFEstimate + 24);
  const uMax = Math.asinh(qMax);
  const integrals = simpsonIntegratePair({
    xMin: 0,
    xMax: uMax,
    intervals: 224,
    evaluate: (u) => {
      const sinhU = Math.sinh(u);
      const coshU = Math.cosh(u);
      const kineticOverMec2 = coshU - 1;
      const occ = fermiOccupation((kineticOverMec2 - solution.root) / beta);
      return {
        numberIntegrand: sinhU * sinhU * coshU * occ,
        pressureIntegrand: Math.pow(sinhU, 4) * occ
      };
    }
  });

  return {
    pressureDynePerCm2: prefactorP * integrals.pressureIntegral,
    converged: solution.converged
  };
}

function electronPressureFiniteTDynePerCm2(args: {
  electronNumberDensityPerCm3: number;
  temperatureK: number;
  fermiRelativityX: number;
  fermiTemperatureK: number;
  defaultZeroTPressureDynePerCm2: number;
}): { pressureDynePerCm2: number; method: ElectronDegeneracyMethod; converged: boolean } {
  const {
    electronNumberDensityPerCm3: nElectron,
    temperatureK,
    fermiRelativityX: xF,
    fermiTemperatureK: tF,
    defaultZeroTPressureDynePerCm2: pZeroT
  } = args;
  if (!isFinitePositive(nElectron) || !isFinitePositive(temperatureK) || !isFinitePositive(xF)) {
    return { pressureDynePerCm2: Number.NaN, method: "invalid", converged: false };
  }

  const chiZeroT = safeRatio(temperatureK, tF);
  if (Number.isFinite(chiZeroT) && chiZeroT <= 1e-3) {
    return { pressureDynePerCm2: pZeroT, method: "zero-t-limit", converged: true };
  }

  const electronClassicalPressure =
    nElectron * CGS_CONSTANTS.kBoltzmannErgPerK * temperatureK;
  if (Number.isFinite(chiZeroT) && chiZeroT >= 8) {
    return {
      pressureDynePerCm2: electronClassicalPressure,
      method: "classical-limit",
      converged: true
    };
  }

  if (xF < 0.3) {
    const nonRel = electronPressureFiniteTNonRelDynePerCm2({
      electronNumberDensityPerCm3: nElectron,
      temperatureK
    });
    return {
      pressureDynePerCm2: nonRel.pressureDynePerCm2,
      method: "nonrel-fd",
      converged: nonRel.converged
    };
  }

  const rel = electronPressureFiniteTRelativisticDynePerCm2({
    electronNumberDensityPerCm3: nElectron,
    temperatureK
  });
  return {
    pressureDynePerCm2: rel.pressureDynePerCm2,
    method: "relativistic-fd",
    converged: rel.converged
  };
}

function assessRadiationClosure(args: {
  densityGPerCm3: number;
  temperatureK: number;
  radiationDepartureEta: number;
}): RadiationClosureAssessment {
  const { densityGPerCm3: rho, temperatureK: temperatureK, radiationDepartureEta: eta } = args;

  if (!isFinitePositive(temperatureK) || !isFinitePositive(rho) || !isFiniteNonNegative(eta)) {
    return {
      tag: "invalid",
      label: "Radiation closure unavailable",
      note: "Provide positive T, rho, and non-negative eta_rad to evaluate LTE framing."
    };
  }

  if (eta === 0) {
    return {
      tag: "proxy",
      label: "Radiation channel suppressed (eta_rad = 0)",
      note: "Radiation pressure is set to zero as a pedagogical override."
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
  extensionPressureDynePerCm2: number;
}): PressureDominance {
  const values: Array<[Exclude<PressureDominance, "mixed" | "invalid">, number]> = [
    ["gas", args.gasPressureDynePerCm2],
    ["radiation", args.radiationPressureDynePerCm2],
    ["degeneracy", args.electronDegeneracyPressureDynePerCm2]
  ];

  if (args.extensionPressureDynePerCm2 > 0) {
    values.push(["extension", args.extensionPressureDynePerCm2]);
  }

  if (!values.every(([, value]) => Number.isFinite(value) && value >= 0)) return "invalid";

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
  classifyFermiRelativityRegime,
  finiteTemperatureDegeneracyCorrectionFactor,
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
    const electronClassicalPressure =
      Number.isFinite(nElectron) &&
      Number.isFinite(args.input.temperatureK) &&
      isFinitePositive(args.input.temperatureK)
        ? nElectron * CGS_CONSTANTS.kBoltzmannErgPerK * args.input.temperatureK
        : Number.NaN;
    const finiteTElectronPressure = electronPressureFiniteTDynePerCm2({
      electronNumberDensityPerCm3: nElectron,
      temperatureK: args.input.temperatureK,
      fermiRelativityX: xF,
      fermiTemperatureK: tF,
      defaultZeroTPressureDynePerCm2: defaultDegPressure
    });
    const finiteTDegeneracyPressure =
      Number.isFinite(finiteTElectronPressure.pressureDynePerCm2) &&
      Number.isFinite(electronClassicalPressure)
        ? Math.max(0, finiteTElectronPressure.pressureDynePerCm2 - electronClassicalPressure)
        : Number.NaN;

    const degeneracyPressure = args.degeneracyPressureProvider
      ? args.degeneracyPressureProvider({
          fermiRelativityX: xF,
          electronNumberDensityPerCm3: nElectron,
          defaultPressureDynePerCm2: finiteTDegeneracyPressure
        })
      : finiteTDegeneracyPressure;
    const electronDegeneracyMethod: ElectronDegeneracyMethod = args.degeneracyPressureProvider
      ? "override"
      : finiteTElectronPressure.method;

    const additionalPressureTerms = (args.additionalPressureTerms ?? []).filter(
      (term) => term && typeof term.id === "string" && Number.isFinite(term.pressureDynePerCm2)
    );

    const additionalPressureSum = additionalPressureTerms.reduce(
      (sum, term) => sum + term.pressureDynePerCm2,
      0
    );
    const extensionPressure = additionalPressureSum;

    const neutronExtensionPressure = additionalPressureTerms
      .filter((term) => term.id.toLowerCase().includes("neutron"))
      .reduce((sum, term) => sum + term.pressureDynePerCm2, 0);

    const totalPressure =
      gasPressure + radiationPressure + degeneracyPressure + additionalPressureSum;

    const chiDeg = safeRatio(args.input.temperatureK, tF);
    const finiteTempAssessment = assessFiniteTemperatureDegeneracy({
      chiDegeneracy: chiDeg,
      fermiRelativityX: xF
    });
    const finiteTempCorrection = finiteTemperatureDegeneracyCorrectionFactor({
      chiDegeneracy: chiDeg,
      fermiRelativityX: xF
    });
    const sommerfeldDegeneracyPressure =
      Number.isFinite(degeneracyPressure) && Number.isFinite(finiteTempCorrection)
        ? degeneracyPressure * finiteTempCorrection
        : Number.NaN;

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
        degeneracy: safeRatio(degeneracyPressure, totalPressure),
        extension: safeRatio(extensionPressure, totalPressure)
      },
      pressureRatios: {
        radiationToGas: safeRatio(radiationPressure, gasPressure),
        degeneracyToTotal: safeRatio(degeneracyPressure, totalPressure),
        betaGasToTotal: safeRatio(gasPressure, totalPressure),
        extensionToTotal: safeRatio(extensionPressure, totalPressure)
      },
      fermiMomentumGCmPerS: pF,
      fermiRelativityX: xF,
      fermiEnergyErg: eF,
      fermiTemperatureK: tF,
      chiDegeneracy: chiDeg,
      electronPressureClassicalDynePerCm2: electronClassicalPressure,
      electronPressureFiniteTDynePerCm2: finiteTElectronPressure.pressureDynePerCm2,
      electronDegeneracyMethod,
      degeneracyRegime: classifyDegeneracyRegime({ chiDegeneracy: chiDeg }),
      fermiRelativityRegime: classifyFermiRelativityRegime({ fermiRelativityX: xF }),
      finiteTemperatureDegeneracyAssessment: finiteTempAssessment,
      finiteTemperatureDegeneracyCorrectionFactor: finiteTempCorrection,
      electronDegeneracyPressureSommerfeldDynePerCm2: sommerfeldDegeneracyPressure,
      extensionPressureDynePerCm2: extensionPressure,
      neutronExtensionPressureDynePerCm2: neutronExtensionPressure,
      neutronExtensionPressureFractionOfTotal: safeRatio(neutronExtensionPressure, totalPressure),
      dominantPressureChannel: classifyDominantPressure({
        gasPressureDynePerCm2: gasPressure,
        radiationPressureDynePerCm2: radiationPressure,
        electronDegeneracyPressureDynePerCm2: degeneracyPressure,
        extensionPressureDynePerCm2: extensionPressure
      }),
      radiationClosureAssessment: assessRadiationClosure({
        densityGPerCm3: args.input.densityGPerCm3,
        temperatureK: args.input.temperatureK,
        radiationDepartureEta: args.input.radiationDepartureEta
      })
    };
  }
} as const;
