type ToutPolynomialCoefficients = readonly [number, number, number, number, number];

type ValidityInput = {
  massMsun: number;
  metallicityZ: number;
};

type ZamsValidity = {
  valid: boolean;
  massInRange: boolean;
  metallicityInRange: boolean;
  warnings: string[];
};

const CONSTANTS = {
  massMinMsun: 0.1,
  massMaxMsun: 100,
  metallicityMin: 1e-4,
  metallicityMax: 0.03,
  zSun: 0.02,
  tSunK: 5772
} as const;

const LUMINOSITY_COEFFICIENTS = {
  alpha: [0.39704170, -0.32913574, 0.34776688, 0.37470851, 0.09011915],
  beta: [8.52762600, -24.41225973, 56.43597107, 37.06152575, 5.45624060],
  gamma: [0.00025546, -0.00123461, -0.00023246, 0.00045519, 0.00016176],
  delta: [5.43288900, -8.62157806, 13.44202049, 14.51584135, 3.39793084],
  epsilon: [5.56357900, -10.32345224, 19.44322980, 18.97361347, 4.16903097],
  zeta: [0.78866060, -2.90870942, 6.54713531, 4.05606657, 0.53287322],
  eta: [0.00586685, -0.01704237, 0.03872348, 0.02570041, 0.00383376]
} as const satisfies Record<string, ToutPolynomialCoefficients>;

const RADIUS_COEFFICIENTS = {
  theta: [1.71535900, 0.62246212, -0.92557761, -1.16996966, -0.30631491],
  iota: [6.59778800, -0.42450044, -12.13339427, -10.73509484, -2.51487077],
  kappa: [10.08855000, -7.11727086, -31.67119479, -24.24848322, -5.33608972],
  lambda: [1.01249500, 0.32699690, -0.00923418, -0.03876858, -0.00412750],
  mu: [0.07490166, 0.02410413, 0.07233664, 0.03040467, 0.00197741],
  nu: [0.01077422, 0, 0, 0, 0],
  xi: [3.08223400, 0.94472050, -2.15200882, -2.49219496, -0.63848738],
  omicron: [17.84778000, -7.45345690, -48.96066856, -40.05386135, -9.09331816],
  pi: [0.00022582, -0.00186899, 0.00388783, 0.00142402, -0.00007671]
} as const satisfies Record<string, ToutPolynomialCoefficients>;

function evaluateMetallicityCoefficient(
  coefficients: ToutPolynomialCoefficients,
  metallicityZ: number
): number {
  const xi = Math.log10(metallicityZ / CONSTANTS.zSun);
  return (
    coefficients[0] +
    coefficients[1] * xi +
    coefficients[2] * xi * xi +
    coefficients[3] * xi * xi * xi +
    coefficients[4] * xi * xi * xi * xi
  );
}

function validity(args: ValidityInput): ZamsValidity {
  const { massMsun, metallicityZ } = args;

  const massInRange =
    Number.isFinite(massMsun) &&
    massMsun >= CONSTANTS.massMinMsun &&
    massMsun <= CONSTANTS.massMaxMsun;
  const metallicityInRange =
    Number.isFinite(metallicityZ) &&
    metallicityZ >= CONSTANTS.metallicityMin &&
    metallicityZ <= CONSTANTS.metallicityMax;

  const warnings: string[] = [];
  if (!massInRange) {
    warnings.push(
      `Mass outside Tout-1996 ZAMS validity range (${CONSTANTS.massMinMsun} to ${CONSTANTS.massMaxMsun} Msun).`
    );
  }
  if (!metallicityInRange) {
    warnings.push(
      `Metallicity outside Tout-1996 validity range (${CONSTANTS.metallicityMin} to ${CONSTANTS.metallicityMax}).`
    );
  }

  return {
    valid: massInRange && metallicityInRange,
    massInRange,
    metallicityInRange,
    warnings
  };
}

function luminosityLsunFromMassMetallicity(args: ValidityInput): number {
  const v = validity(args);
  if (!v.valid) return Number.NaN;

  const { massMsun, metallicityZ } = args;
  const alpha = evaluateMetallicityCoefficient(LUMINOSITY_COEFFICIENTS.alpha, metallicityZ);
  const beta = evaluateMetallicityCoefficient(LUMINOSITY_COEFFICIENTS.beta, metallicityZ);
  const gamma = evaluateMetallicityCoefficient(LUMINOSITY_COEFFICIENTS.gamma, metallicityZ);
  const delta = evaluateMetallicityCoefficient(LUMINOSITY_COEFFICIENTS.delta, metallicityZ);
  const epsilon = evaluateMetallicityCoefficient(LUMINOSITY_COEFFICIENTS.epsilon, metallicityZ);
  const zeta = evaluateMetallicityCoefficient(LUMINOSITY_COEFFICIENTS.zeta, metallicityZ);
  const eta = evaluateMetallicityCoefficient(LUMINOSITY_COEFFICIENTS.eta, metallicityZ);

  const numerator = alpha * massMsun ** 5.5 + beta * massMsun ** 11;
  const denominator =
    gamma +
    massMsun ** 3 +
    delta * massMsun ** 5 +
    epsilon * massMsun ** 7 +
    zeta * massMsun ** 8 +
    eta * massMsun ** 9.5;

  if (!Number.isFinite(denominator) || denominator <= 0) return Number.NaN;
  const luminosityLsun = numerator / denominator;
  return luminosityLsun > 0 ? luminosityLsun : Number.NaN;
}

function radiusRsunFromMassMetallicity(args: ValidityInput): number {
  const v = validity(args);
  if (!v.valid) return Number.NaN;

  const { massMsun, metallicityZ } = args;
  const theta = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.theta, metallicityZ);
  const iota = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.iota, metallicityZ);
  const kappa = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.kappa, metallicityZ);
  const lambda = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.lambda, metallicityZ);
  const mu = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.mu, metallicityZ);
  const nu = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.nu, metallicityZ);
  const xi = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.xi, metallicityZ);
  const omicron = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.omicron, metallicityZ);
  const pi = evaluateMetallicityCoefficient(RADIUS_COEFFICIENTS.pi, metallicityZ);

  const numerator =
    theta * massMsun ** 2.5 +
    iota * massMsun ** 6.5 +
    kappa * massMsun ** 11 +
    lambda * massMsun ** 19 +
    mu * massMsun ** 19.5;
  const denominator =
    nu +
    xi * massMsun ** 2 +
    omicron * massMsun ** 8.5 +
    massMsun ** 18.5 +
    pi * massMsun ** 19.5;

  if (!Number.isFinite(denominator) || denominator <= 0) return Number.NaN;
  const radiusRsun = numerator / denominator;
  return radiusRsun > 0 ? radiusRsun : Number.NaN;
}

function effectiveTemperatureKFromMassMetallicity(args: ValidityInput): number {
  const luminosityLsun = luminosityLsunFromMassMetallicity(args);
  const radiusRsun = radiusRsunFromMassMetallicity(args);
  if (!Number.isFinite(luminosityLsun) || !Number.isFinite(radiusRsun) || radiusRsun <= 0) {
    return Number.NaN;
  }
  return CONSTANTS.tSunK * (luminosityLsun / (radiusRsun * radiusRsun)) ** 0.25;
}

type TemperatureInversionInput = {
  temperatureK: number;
  metallicityZ: number;
};

function massFromTemperatureMetallicity(args: TemperatureInversionInput): number {
  const { temperatureK, metallicityZ } = args;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return Number.NaN;
  if (!Number.isFinite(metallicityZ)) return Number.NaN;
  if (metallicityZ < CONSTANTS.metallicityMin || metallicityZ > CONSTANTS.metallicityMax) {
    return Number.NaN;
  }

  const tempMinK = effectiveTemperatureKFromMassMetallicity({
    massMsun: CONSTANTS.massMinMsun,
    metallicityZ
  });
  const tempMaxK = effectiveTemperatureKFromMassMetallicity({
    massMsun: CONSTANTS.massMaxMsun,
    metallicityZ
  });
  if (!Number.isFinite(tempMinK) || !Number.isFinite(tempMaxK)) return Number.NaN;
  if (temperatureK < tempMinK || temperatureK > tempMaxK) return Number.NaN;

  let lowLogMass = Math.log10(CONSTANTS.massMinMsun);
  let highLogMass = Math.log10(CONSTANTS.massMaxMsun);

  for (let iter = 0; iter < 96; iter += 1) {
    const midLogMass = 0.5 * (lowLogMass + highLogMass);
    const midMassMsun = 10 ** midLogMass;
    const midTemperatureK = effectiveTemperatureKFromMassMetallicity({
      massMsun: midMassMsun,
      metallicityZ
    });

    if (!Number.isFinite(midTemperatureK)) return Number.NaN;
    const relativeError = Math.abs(midTemperatureK - temperatureK) / temperatureK;
    if (relativeError < 1e-10) return midMassMsun;

    if (midTemperatureK < temperatureK) {
      lowLogMass = midLogMass;
    } else {
      highLogMass = midLogMass;
    }
  }

  return 10 ** (0.5 * (lowLogMass + highLogMass));
}

export const ZamsTout1996Model = {
  CONSTANTS,
  validity,
  luminosityLsunFromMassMetallicity,
  radiusRsunFromMassMetallicity,
  effectiveTemperatureKFromMassMetallicity,
  massFromTemperatureMetallicity
} as const;

export type { ZamsValidity };
