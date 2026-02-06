/**
 * Eclipse Geometry -- Pure UI Logic
 *
 * All functions here are pure (no DOM, no side effects).
 * Physics callbacks are injected for testability (DI pattern).
 */

/* ------------------------------------------------------------------ */
/*  Utility                                                           */
/* ------------------------------------------------------------------ */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

/* ------------------------------------------------------------------ */
/*  Phase labeling                                                    */
/* ------------------------------------------------------------------ */

export type PhaseInfoResult = {
  label: string;
  isNew: boolean;
  isFull: boolean;
};

/**
 * Determine the moon phase label from the phase angle.
 *
 * `angularSep` computes the shortest arc between two angles (0-180).
 * `normalize` wraps an angle into [0, 360).
 */
export function phaseInfo(
  phaseAngleDeg: number,
  angularSep: (a: number, b: number) => number,
  normalize: (a: number) => number
): PhaseInfoResult {
  const dNew = angularSep(phaseAngleDeg, 0);
  const dFull = angularSep(phaseAngleDeg, 180);
  const dFirst = angularSep(phaseAngleDeg, 90);
  const dThird = angularSep(phaseAngleDeg, 270);

  if (dNew <= 10) return { label: "New Moon", isNew: true, isFull: false };
  if (dFull <= 10) return { label: "Full Moon", isNew: false, isFull: true };
  if (dFirst <= 10) return { label: "First quarter", isNew: false, isFull: false };
  if (dThird <= 10) return { label: "Third quarter", isNew: false, isFull: false };

  const norm = normalize(phaseAngleDeg);
  if (norm > 0 && norm < 180) {
    return {
      label: norm < 90 ? "Waxing crescent" : "Waxing gibbous",
      isNew: false,
      isFull: false,
    };
  }
  return {
    label: norm > 180 && norm < 270 ? "Waning gibbous" : "Waning crescent",
    isNew: false,
    isFull: false,
  };
}

/* ------------------------------------------------------------------ */
/*  Eclipse outcome labeling                                          */
/* ------------------------------------------------------------------ */

export function outcomeLabel(type: string): string {
  if (type === "none") return "None";
  if (type === "partial-solar") return "Partial solar";
  if (type === "annular-solar") return "Annular solar";
  if (type === "total-solar") return "Total solar";
  if (type === "penumbral-lunar") return "Penumbral lunar";
  if (type === "partial-lunar") return "Partial lunar";
  if (type === "total-lunar") return "Total lunar";
  return type;
}

/* ------------------------------------------------------------------ */
/*  Derived state computation                                         */
/* ------------------------------------------------------------------ */

export type EclipseDemoState = {
  moonLonDeg: number;
  sunLonDeg: number;
  nodeLonDeg: number;
  orbitalTiltDeg: number;
  earthMoonDistanceKm: number;
  phaseAngleDeg: number;
  betaDeg: number;
  absBetaDeg: number;
  nearestNodeDeg: number;
  solarType: "none" | "partial-solar" | "annular-solar" | "total-solar";
  lunarType: "none" | "penumbral-lunar" | "partial-lunar" | "total-lunar";
};

export type EclipseModelCallbacks = {
  phaseAngleDeg: (args: { moonLonDeg: number; sunLonDeg: number }) => number;
  eclipticLatitudeDeg: (args: {
    tiltDeg: number;
    moonLonDeg: number;
    nodeLonDeg: number;
  }) => number;
  nearestNodeDistanceDeg: (args: {
    moonLonDeg: number;
    nodeLonDeg: number;
  }) => number;
  angularSeparationDeg: (a: number, b: number) => number;
  solarEclipseType: (args: {
    betaDeg: number;
    earthMoonDistanceKm: number;
  }) => { type: EclipseDemoState["solarType"] };
  lunarEclipseType: (args: {
    betaDeg: number;
    earthMoonDistanceKm: number;
  }) => { type: EclipseDemoState["lunarType"] };
};

export const SYZYGY_TOLERANCE_DEG = 5;

export function computeDerived(
  args: {
    sunLonDeg: number;
    moonLonDeg: number;
    nodeLonDeg: number;
    orbitalTiltDeg: number;
    earthMoonDistanceKm: number;
  },
  model: EclipseModelCallbacks
): EclipseDemoState {
  const phaseAngle = model.phaseAngleDeg({
    moonLonDeg: args.moonLonDeg,
    sunLonDeg: args.sunLonDeg,
  });

  const betaDeg = model.eclipticLatitudeDeg({
    tiltDeg: args.orbitalTiltDeg,
    moonLonDeg: args.moonLonDeg,
    nodeLonDeg: args.nodeLonDeg,
  });

  const absBetaDeg = Math.abs(betaDeg);
  const nearestNodeDeg = model.nearestNodeDistanceDeg({
    moonLonDeg: args.moonLonDeg,
    nodeLonDeg: args.nodeLonDeg,
  });

  const isNewSyzygy =
    model.angularSeparationDeg(phaseAngle, 0) <= SYZYGY_TOLERANCE_DEG;
  const isFullSyzygy =
    model.angularSeparationDeg(phaseAngle, 180) <= SYZYGY_TOLERANCE_DEG;

  const solarType = isNewSyzygy
    ? model.solarEclipseType({
        betaDeg,
        earthMoonDistanceKm: args.earthMoonDistanceKm,
      }).type
    : "none";

  const lunarType = isFullSyzygy
    ? model.lunarEclipseType({
        betaDeg,
        earthMoonDistanceKm: args.earthMoonDistanceKm,
      }).type
    : "none";

  return {
    moonLonDeg: args.moonLonDeg,
    sunLonDeg: args.sunLonDeg,
    nodeLonDeg: args.nodeLonDeg,
    orbitalTiltDeg: args.orbitalTiltDeg,
    earthMoonDistanceKm: args.earthMoonDistanceKm,
    phaseAngleDeg: phaseAngle,
    betaDeg,
    absBetaDeg,
    nearestNodeDeg,
    solarType,
    lunarType,
  };
}

/* ------------------------------------------------------------------ */
/*  Station mode row builder                                          */
/* ------------------------------------------------------------------ */

export type StationRow = {
  case: string;
  phase: string;
  phaseAngleDeg: string;
  absBetaDeg: string;
  nearestNodeDeg: string;
  tiltDeg: string;
  earthMoonDistanceKm: string;
  outcome: string;
};

export function buildStationRow(args: {
  label: string;
  phaseLabel: string;
  phaseAngleDeg: number;
  absBetaDeg: number;
  nearestNodeDeg: number;
  orbitalTiltDeg: number;
  earthMoonDistanceKm: number;
  outcome: string;
}): StationRow {
  return {
    case: args.label,
    phase: args.phaseLabel,
    phaseAngleDeg: formatNumber(args.phaseAngleDeg, 1),
    absBetaDeg: formatNumber(args.absBetaDeg, 3),
    nearestNodeDeg: formatNumber(args.nearestNodeDeg, 2),
    tiltDeg: formatNumber(args.orbitalTiltDeg, 3),
    earthMoonDistanceKm: String(Math.round(args.earthMoonDistanceKm)),
    outcome: args.outcome,
  };
}

/* ------------------------------------------------------------------ */
/*  Simulation summary formatting                                     */
/* ------------------------------------------------------------------ */

export type SimulationCounts = {
  solar: { partial: number; annular: number; total: number };
  lunar: { penumbral: number; partial: number; total: number };
  newWindows: number;
  fullWindows: number;
};

export type SimulationSummaryInput = {
  totalDays: number;
  earthMoonDistanceKm: number;
  orbitalTiltDeg: number;
  counts: SimulationCounts;
  sampleEvents: string[];
};

export function formatSimSummary(
  sim: SimulationSummaryInput,
  tropicalYearDays: number
): string {
  const years = sim.totalDays / tropicalYearDays;
  const lines: string[] = [];
  lines.push(
    `Simulated ${years.toFixed(0)} year(s) @ distance=${Math.round(sim.earthMoonDistanceKm).toLocaleString()} km, i=${sim.orbitalTiltDeg.toFixed(3)} deg`
  );
  lines.push(
    `Syzygies checked: New=${sim.counts.newWindows}, Full=${sim.counts.fullWindows}`
  );
  lines.push(
    `Solar eclipses: partial=${sim.counts.solar.partial}, annular=${sim.counts.solar.annular}, total=${sim.counts.solar.total}`
  );
  lines.push(
    `Lunar eclipses: penumbral=${sim.counts.lunar.penumbral}, partial=${sim.counts.lunar.partial}, total=${sim.counts.lunar.total}`
  );
  if (sim.sampleEvents.length) {
    lines.push("");
    lines.push("Examples:");
    for (const e of sim.sampleEvents.slice(0, 10)) lines.push(`- ${e}`);
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Distance presets                                                  */
/* ------------------------------------------------------------------ */

export const DISTANCE_PRESETS_KM = {
  perigee: 363300,
  mean: 384400,
  apogee: 405500,
} as const;

export type DistancePresetKey = keyof typeof DISTANCE_PRESETS_KM;

export function snapToNearestPreset(
  targetKm: number
): DistancePresetKey {
  const entries: Array<[DistancePresetKey, number]> = [
    ["perigee", DISTANCE_PRESETS_KM.perigee],
    ["mean", DISTANCE_PRESETS_KM.mean],
    ["apogee", DISTANCE_PRESETS_KM.apogee],
  ];
  return entries.reduce(
    (best, entry) =>
      Math.abs(entry[1] - targetKm) < Math.abs(best[1] - targetKm) ? entry : best,
    entries[0]
  )[0];
}
