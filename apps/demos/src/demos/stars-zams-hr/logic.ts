export type PlotMode = "observer" | "theorist";

export type HrLabPresetId =
  | "young-cluster"
  | "old-cluster"
  | "high-binary-fraction"
  | "low-metallicity"
  | "solar-like-reference";

export type GuideRegion = {
  label: string;
  hint: string;
  xNorm: number;
  yNorm: number;
};

export const THEORIST_AXIS_LIMITS = {
  teffMinK: 2500,
  teffMaxK: 50000,
  logLumMin: -5,
  logLumMax: 6
} as const;

export const OBSERVER_AXIS_LIMITS = {
  colorMin: -0.4,
  colorMax: 2.2,
  mvBright: -10,
  mvFaint: 16
} as const;

export const RADIUS_GUIDE_VALUES_RSUN = [0.01, 0.1, 1, 10, 100, 1000] as const;

export type PlotPoint = {
  starId: string;
  x: number;
  y: number;
};

export type SanitizedNumericControlArgs = {
  rawValue: string;
  fallback: number;
  min: number;
  max: number;
  step?: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sanitizeNumericControl(args: SanitizedNumericControlArgs): number {
  const { rawValue, fallback, min, max, step } = args;
  const normalized = rawValue.trim();
  const parsed = normalized.length === 0 ? Number.NaN : Number(normalized);
  const safeBase = Number.isFinite(parsed) ? parsed : fallback;
  const clamped = clamp(safeBase, min, max);
  if (!Number.isFinite(step) || !step || step <= 0) return clamped;
  const snapped = Math.round((clamped - min) / step) * step + min;
  return clamp(Number(snapped.toFixed(12)), min, max);
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e5 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

export function formatWithUnit(value: number, unit: string, digits = 2): string {
  return `${formatNumber(value, digits)} ${unit}`;
}

export function hrCoordinates(args: {
  teffK: number;
  luminosityLsun: number;
  teffMinK?: number;
  teffMaxK?: number;
  logLumMin?: number;
  logLumMax?: number;
}): { xNorm: number; yNorm: number } {
  const {
    teffK,
    luminosityLsun,
    teffMinK = THEORIST_AXIS_LIMITS.teffMinK,
    teffMaxK = THEORIST_AXIS_LIMITS.teffMaxK,
    logLumMin = THEORIST_AXIS_LIMITS.logLumMin,
    logLumMax = THEORIST_AXIS_LIMITS.logLumMax
  } = args;

  if (!(teffK > 0) || !(luminosityLsun > 0)) return { xNorm: 0, yNorm: 0 };

  const xLogMin = Math.log10(teffMinK);
  const xLogMax = Math.log10(teffMaxK);
  const xLog = Math.log10(teffK);

  const yLog = Math.log10(luminosityLsun);

  return {
    xNorm: clamp((xLogMax - xLog) / (xLogMax - xLogMin), 0, 1),
    yNorm: clamp((yLog - logLumMin) / (logLumMax - logLumMin), 0, 1)
  };
}

export function cmdCoordinates(args: {
  bMinusV: number;
  absoluteMv: number;
  colorMin?: number;
  colorMax?: number;
  mvBright?: number;
  mvFaint?: number;
}): { xNorm: number; yNorm: number } {
  const {
    bMinusV,
    absoluteMv,
    colorMin = OBSERVER_AXIS_LIMITS.colorMin,
    colorMax = OBSERVER_AXIS_LIMITS.colorMax,
    mvBright = OBSERVER_AXIS_LIMITS.mvBright,
    mvFaint = OBSERVER_AXIS_LIMITS.mvFaint
  } = args;

  if (!Number.isFinite(bMinusV) || !Number.isFinite(absoluteMv)) return { xNorm: 0, yNorm: 0 };

  return {
    xNorm: clamp((bMinusV - colorMin) / (colorMax - colorMin), 0, 1),
    yNorm: clamp((mvFaint - absoluteMv) / (mvFaint - mvBright), 0, 1)
  };
}

export function luminosityLsunFromRadiusTemperature(args: {
  radiusRsun: number;
  teffK: number;
  tSunK: number;
}): number {
  const { radiusRsun, teffK, tSunK } = args;
  if (!(radiusRsun > 0) || !(teffK > 0) || !(tSunK > 0)) return Number.NaN;
  const tempRatio = teffK / tSunK;
  return radiusRsun * radiusRsun * tempRatio ** 4;
}

export function radiusRsunFromLuminosityTemperature(args: {
  luminosityLsun: number;
  teffK: number;
  tSunK: number;
}): number {
  const { luminosityLsun, teffK, tSunK } = args;
  if (!(luminosityLsun > 0) || !(teffK > 0) || !(tSunK > 0)) return Number.NaN;
  const tempRatio = teffK / tSunK;
  return Math.sqrt(luminosityLsun / (tempRatio ** 4));
}

export function logTicks(minExp: number, maxExp: number): number[] {
  const ticks: number[] = [];
  for (let exp = minExp; exp <= maxExp; exp += 1) {
    ticks.push(10 ** exp);
  }
  return ticks;
}

export function linearTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = [];
  for (let x = min; x <= max + 1e-9; x += step) {
    ticks.push(Number(x.toFixed(6)));
  }
  return ticks;
}

export function massColorHex(massMsun: number): string {
  const logMin = Math.log10(0.1);
  const logMax = Math.log10(50);
  const t = clamp((Math.log10(Math.max(massMsun, 0.1)) - logMin) / (logMax - logMin), 0, 1);
  const hue = 220 - 200 * t;
  const sat = 78;
  const light = 56;
  return `hsl(${hue.toFixed(0)}deg ${sat}% ${light}%)`;
}

const GUIDE_REGIONS: Record<PlotMode, GuideRegion[]> = {
  theorist: [
    {
      label: "Main sequence",
      hint: "Most stars lie along this diagonal band: hotter stars trend left and brighter stars trend up.",
      xNorm: 0.42,
      yNorm: 0.46
    },
    {
      label: "Giant branch",
      hint: "Cool but luminous giants sit toward the upper right because they have large radii.",
      xNorm: 0.76,
      yNorm: 0.78
    },
    {
      label: "White dwarf region",
      hint: "White dwarfs are hot but faint, so they cluster down to the left with very small radii.",
      xNorm: 0.18,
      yNorm: 0.16
    }
  ],
  observer: [
    {
      label: "Main sequence",
      hint: "Trace the dense diagonal band before clicking a star.",
      xNorm: 0.43,
      yNorm: 0.46
    },
    {
      label: "Giant branch",
      hint: "The bright, redder giant branch sits up and to the right.",
      xNorm: 0.76,
      yNorm: 0.78
    },
    {
      label: "White dwarf region",
      hint: "White dwarfs are blue-ish but faint, so they appear lower and left of the main sequence.",
      xNorm: 0.17,
      yNorm: 0.19
    }
  ]
};

export function getGuideRegions(plotMode: PlotMode): GuideRegion[] {
  return GUIDE_REGIONS[plotMode];
}

export function getRadiusLinesVisible(args: {
  plotMode: PlotMode;
  showRadiusLinesPreference: boolean;
}): boolean {
  return args.plotMode === "theorist" && args.showRadiusLinesPreference;
}

const HR_LAB_PRESETS: Record<HrLabPresetId, Partial<{
  modeCluster: boolean;
  clusterAgeGyr: number;
  binaryFrac: number;
  metallicityZ: number;
  evolveMassMsun: number;
}>> = {
  "young-cluster": {
    modeCluster: true,
    clusterAgeGyr: 0.08,
    binaryFrac: 0.2,
    metallicityZ: 0.02
  },
  "old-cluster": {
    modeCluster: true,
    clusterAgeGyr: 10,
    binaryFrac: 0.2,
    metallicityZ: 0.02
  },
  "high-binary-fraction": {
    modeCluster: true,
    clusterAgeGyr: 0.7,
    binaryFrac: 0.65,
    metallicityZ: 0.02
  },
  "low-metallicity": {
    modeCluster: true,
    clusterAgeGyr: 0.7,
    binaryFrac: 0.28,
    metallicityZ: 0.004
  },
  "solar-like-reference": {
    modeCluster: true,
    clusterAgeGyr: 4.6,
    binaryFrac: 0.28,
    metallicityZ: 0.02,
    evolveMassMsun: 1
  }
};

export function applyHrLabPreset(presetId: HrLabPresetId) {
  return HR_LAB_PRESETS[presetId];
}

export function describeSelectedStarInference(args: {
  stage: string;
  teffK: number;
  luminosityLsun: number;
  radiusRsun: number;
}): string {
  const { stage, teffK, luminosityLsun, radiusRsun } = args;

  if (stage === "white_dwarf") {
    return "White dwarfs are hot but faint, so white dwarfs must have a very small radius.";
  }

  if (stage === "giant" || stage === "supergiant") {
    return "Cool but luminous giant stars must have a large radius.";
  }

  if (stage === "subgiant") {
    return "Subgiants sit between the main sequence and giants, so their radius is growing as they brighten.";
  }

  if (stage === "compact_remnant") {
    return "Compact remnants stay extremely small even when their temperatures are very high.";
  }

  const hot = teffK >= 9000;
  const cool = teffK <= 5200;
  const luminous = luminosityLsun >= 10;
  const faint = luminosityLsun <= 0.15;
  const smallRadius = radiusRsun <= 0.3;
  const largeRadius = radiusRsun >= 5;

  if (hot && faint) {
    return "Hot but faint stars must have a small radius.";
  }

  if (cool && luminous) {
    return "Cool but luminous stars must have a large radius.";
  }

  if (cool && faint) {
    return "Cool and faint main-sequence stars are usually small and low mass.";
  }

  if (hot && luminous) {
    return "Hot and luminous main-sequence stars are usually more massive and larger than the Sun.";
  }

  if (smallRadius) {
    return "This star is faint for its temperature, which points to a small radius.";
  }

  if (largeRadius) {
    return "This star is especially luminous for its temperature, which points to a large radius.";
  }

  return "Compare this star with nearby main-sequence stars to decide whether radius or mass is changing more strongly.";
}

export function selectNextStarByDirection(args: {
  points: PlotPoint[];
  currentStarId: string | null;
  direction: "left" | "right" | "up" | "down";
}): string | null {
  const { points, currentStarId, direction } = args;
  if (points.length === 0) return null;

  const current = points.find((point) => point.starId === currentStarId) ?? points[0];
  let best: PlotPoint | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestOrth = Number.POSITIVE_INFINITY;

  for (const point of points) {
    if (point.starId === current.starId) continue;
    const dx = point.x - current.x;
    const dy = point.y - current.y;
    const inDirection =
      (direction === "right" && dx > 0) ||
      (direction === "left" && dx < 0) ||
      (direction === "up" && dy < 0) ||
      (direction === "down" && dy > 0);
    if (!inDirection) continue;

    const along = direction === "left" || direction === "right" ? Math.abs(dx) : Math.abs(dy);
    const orth = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
    const euclidean = Math.hypot(dx, dy);
    const score = euclidean + orth * 0.65 + 1 / Math.max(along, 1e-6);

    if (score < bestScore || (Math.abs(score - bestScore) < 1e-9 && orth < bestOrth)) {
      best = point;
      bestScore = score;
      bestOrth = orth;
    }
  }

  return best?.starId ?? current.starId;
}

export function selectBoundaryStar(args: { points: PlotPoint[]; boundary: "home" | "end" }): string | null {
  const { points, boundary } = args;
  if (points.length === 0) return null;

  const sorted = [...points].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.y !== b.y) return a.y - b.y;
    return a.starId.localeCompare(b.starId);
  });
  return boundary === "home" ? sorted[0].starId : sorted[sorted.length - 1].starId;
}
