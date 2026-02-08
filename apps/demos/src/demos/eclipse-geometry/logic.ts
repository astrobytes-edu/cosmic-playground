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
/*  Signed beta formatting                                            */
/* ------------------------------------------------------------------ */

/** Format ecliptic latitude with explicit sign: "+" for above, Unicode
 *  minus "\u2212" for below the ecliptic, no sign for exactly zero. */
export function formatSignedBeta(betaDeg: number, decimals: number): string {
  if (betaDeg === 0) return betaDeg.toFixed(decimals);
  const sign = betaDeg > 0 ? "+" : "\u2212";
  return `${sign}${Math.abs(betaDeg).toFixed(decimals)}`;
}

/* ------------------------------------------------------------------ */
/*  SVG coordinate angle (for drag interaction)                       */
/* ------------------------------------------------------------------ */

/** Convert SVG coordinates to angle (degrees) matching the orbit rendering
 *  convention: 0 = right, angles increase clockwise (SVG y-down = positive).
 *  This matches renderStage() which uses cos(angle) for x and sin(angle) for y
 *  without negating the SVG y-axis.
 *  Returns a value in [0, 360). */
export function svgPointToAngleDeg(
  centerX: number,
  centerY: number,
  pointX: number,
  pointY: number
): number {
  const dx = pointX - centerX;
  const dy = pointY - centerY; // SVG convention: y increases downward
  return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
}

/* ------------------------------------------------------------------ */
/*  Sinusoidal beta curve path builder                                */
/* ------------------------------------------------------------------ */

/** Build an SVG path d-string for the sinusoidal beta curve in the beta panel.
 *  The curve shows ecliptic latitude as a function of Moon orbital position. */
export function buildBetaCurvePath(args: {
  tiltDeg: number;
  nodeLonDeg: number;
  panelX: number;
  panelWidth: number;
  panelCenterY: number;
  yScale: number;
  eclipticLatDeg: (moonLonDeg: number, tiltDeg: number, nodeLonDeg: number) => number;
  steps?: number;
}): string {
  const steps = args.steps ?? 72;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const moonLonDeg = (i / steps) * 360;
    const x = args.panelX + (i / steps) * args.panelWidth;
    const beta = args.eclipticLatDeg(moonLonDeg, args.tiltDeg, args.nodeLonDeg);
    // SVG y increases downward, so negate: positive beta (above ecliptic) goes up
    const y = args.panelCenterY - beta * args.yScale;
    const pt = `${x.toFixed(2)},${y.toFixed(2)}`;
    parts.push(i === 0 ? `M ${pt}` : `L ${pt}`);
  }
  return parts.join(" ");
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
/*  Contextual feedback messages                                      */
/* ------------------------------------------------------------------ */

export type EclipseThresholds = {
  solarPartialDeg: number;
  solarCentralDeg: number;
  lunarPenumbralDeg: number;
};

const SYZYGY_NEAR_DEG = 10; // within 10 deg of New/Full
const NODE_NEAR_DEG = 20; // within 20 deg of a node
const ALMOST_MARGIN_DEG = 0.5; // how close to threshold counts as "almost"

/**
 * Return a pedagogical feedback string based on the current eclipse geometry.
 *
 * Priority order:
 *  1. Eclipse achieved (solar or lunar)
 *  2. "Almost" -- near syzygy and beta is just above a threshold
 *  3. Near syzygy but too far from node
 *  4. Near node but wrong phase
 *  5. Wrong phase (general, only when somewhat near a node)
 *  6. Mundane state -- returns empty string
 */
export function contextualMessage(
  state: EclipseDemoState,
  thresholds?: Partial<EclipseThresholds>
): string {
  const { phaseAngleDeg, absBetaDeg, nearestNodeDeg, solarType, lunarType } = state;
  const nearSyzygy =
    phaseAngleDeg <= SYZYGY_NEAR_DEG ||
    phaseAngleDeg >= 360 - SYZYGY_NEAR_DEG ||
    Math.abs(phaseAngleDeg - 180) <= SYZYGY_NEAR_DEG;
  const nearNode = nearestNodeDeg <= NODE_NEAR_DEG;
  const hasSolar = solarType !== "none";
  const hasLunar = lunarType !== "none";

  // Eclipse achieved
  if (hasSolar) {
    return `${outcomeLabel(solarType)} eclipse! Moon at New Moon, ${formatNumber(nearestNodeDeg, 1)}\u00b0 from nearest node.`;
  }
  if (hasLunar) {
    return `${outcomeLabel(lunarType)} eclipse! Moon at Full Moon, ${formatNumber(nearestNodeDeg, 1)}\u00b0 from nearest node.`;
  }

  // Almost -- near syzygy and beta is close to a threshold
  if (nearSyzygy && thresholds) {
    const solarPartial = thresholds.solarPartialDeg ?? 1.5;
    const lunarPenumbral = thresholds.lunarPenumbralDeg ?? 1.6;
    if (absBetaDeg > solarPartial && absBetaDeg < solarPartial + ALMOST_MARGIN_DEG) {
      return `Almost! |\u03b2| = ${formatNumber(absBetaDeg, 2)}\u00b0 \u2014 needs to be below ${formatNumber(solarPartial, 1)}\u00b0 for a solar eclipse.`;
    }
    if (absBetaDeg > lunarPenumbral && absBetaDeg < lunarPenumbral + ALMOST_MARGIN_DEG) {
      return `Almost! |\u03b2| = ${formatNumber(absBetaDeg, 2)}\u00b0 \u2014 needs to be below ${formatNumber(lunarPenumbral, 1)}\u00b0 for a lunar eclipse.`;
    }
  }

  // Near syzygy but too far from node
  if (nearSyzygy && !nearNode) {
    return `Moon is ${formatNumber(absBetaDeg, 1)}\u00b0 above the ecliptic \u2014 too far from a node for an eclipse.`;
  }

  // Near node but wrong phase
  if (nearNode && !nearSyzygy) {
    return "Moon is near a node but not at New/Full \u2014 no alignment.";
  }

  // Wrong phase (general) -- only show if somewhat near a node
  if (!nearSyzygy) {
    if (nearestNodeDeg < 40) {
      return "Eclipses require New or Full Moon \u2014 adjust the phase.";
    }
  }

  return "";
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
/*  Simulation table (structured output for styled HTML table)         */
/* ------------------------------------------------------------------ */

export type SimTableRow = {
  year: number;
  type: string;
  details: string;
  category: "solar" | "lunar";
};

/**
 * Parse simulation sample-event strings into structured rows for table rendering.
 * Each event string looks like:
 *   "Year 1.50: Solar Total solar (abs(beta)=0.300 deg, Delta~0 deg)"
 *   "Year 3.22: Lunar Penumbral lunar (abs(beta)=1.200 deg, Delta~180 deg)"
 *
 * Returns structured rows plus summary counts.
 */
export function formatSimTable(
  sim: SimulationSummaryInput,
  tropicalYearDays: number
): {
  rows: SimTableRow[];
  summary: { solarCount: number; lunarCount: number; years: number };
} {
  const years = Math.round(sim.totalDays / tropicalYearDays);
  const s = sim.counts.solar;
  const l = sim.counts.lunar;
  const solarCount = s.partial + s.annular + s.total;
  const lunarCount = l.penumbral + l.partial + l.total;

  const rows: SimTableRow[] = sim.sampleEvents.map((event) => {
    // Try to parse "Year <n>: (Solar|Lunar) <type> (<details>)"
    const match = event.match(
      /^Year\s+([\d.]+):\s+(Solar|Lunar)\s+(.+?)\s+\((.+)\)$/
    );
    if (match) {
      const [, yearStr, kind, type, details] = match;
      return {
        year: parseFloat(yearStr),
        type,
        details,
        category: kind.toLowerCase() as "solar" | "lunar",
      };
    }
    // Fallback for unparseable strings
    return {
      year: 0,
      type: event,
      details: "",
      category: "solar" as const,
    };
  });

  return { rows, summary: { solarCount, lunarCount, years } };
}

/* ------------------------------------------------------------------ */
/*  Eclipse presets (snap moon + node to produce target outcomes)      */
/* ------------------------------------------------------------------ */

/** Preset: total solar eclipse. Moon at New (same lon as Sun), node aligned. */
export function totalSolarPreset(args: { sunLonDeg: number }) {
  return { moonLonDeg: args.sunLonDeg, nodeLonDeg: args.sunLonDeg };
}

/** Preset: lunar eclipse. Moon at Full (opposite Sun), node aligned with Sun. */
export function lunarEclipsePreset(args: { sunLonDeg: number }) {
  return { moonLonDeg: (args.sunLonDeg + 180) % 360, nodeLonDeg: args.sunLonDeg };
}

/** Preset: no eclipse. Moon placed 90 deg from nearest node (max |beta|). */
export function noEclipsePreset(args: { sunLonDeg: number; nodeLonDeg: number }) {
  return { moonLonDeg: (args.nodeLonDeg + 90) % 360 };
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

/* ------------------------------------------------------------------ */
/*  Log-scale simulation slider mapping                               */
/* ------------------------------------------------------------------ */

/** Log-scale: slider 0-100 maps to 1-1000 years (10^0 to 10^3). */
export function sliderToYears(sliderVal: number): number {
  return Math.pow(10, (sliderVal / 100) * 3);
}

/** Inverse: years 1-1000 maps to slider 0-100. */
export function yearsToSlider(years: number): number {
  return (Math.log10(Math.max(1, years)) / 3) * 100;
}

/** Format years for display with locale grouping. */
export function formatYearsLabel(years: number): string {
  return Math.round(years).toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Challenge check functions                                         */
/* ------------------------------------------------------------------ */

const FULL_MOON_TOLERANCE_DEG = 15;

export type ChallengeResult = { correct: boolean; close: boolean; message: string };

/** Challenge: "Why not every month" — find Full Moon with no eclipse. */
export function checkWhyNotEveryMonth(args: {
  phaseAngleDeg: number;
  lunarType: string;
  angularSep: (a: number, b: number) => number;
}): ChallengeResult {
  const sepFromFull = args.angularSep(args.phaseAngleDeg, 180);
  const isNearFull = sepFromFull <= FULL_MOON_TOLERANCE_DEG;

  if (!isNearFull) {
    return {
      correct: false,
      close: false,
      message: "First get close to Full Moon (phase angle near 180 deg).",
    };
  }

  if (args.lunarType === "none") {
    return {
      correct: true,
      close: true,
      message: "Correct! This Full Moon does NOT cause an eclipse because the Moon is far from a node.",
    };
  }

  return {
    correct: false,
    close: true,
    message: "You're at Full Moon, but this one still causes an eclipse. Move the node farther away.",
  };
}

/** Challenge: "Eclipse statistics" — run a long simulation. */
export function checkEclipseStatistics(args: {
  yearsSimulated: number;
  totalEclipses: number;
  counts: SimulationCounts;
}): ChallengeResult {
  if (args.yearsSimulated < 9) {
    return {
      correct: false,
      close: args.yearsSimulated >= 5,
      message: `Simulation ran ${args.yearsSimulated.toFixed(0)} years. Need at least ~10 years for good statistics.`,
    };
  }

  if (args.totalEclipses === 0) {
    return {
      correct: false,
      close: false,
      message: "No eclipses detected. Check that tilt is realistic (~5 deg) and try again.",
    };
  }

  const s = args.counts.solar;
  const l = args.counts.lunar;
  const totalSolar = s.partial + s.annular + s.total;
  const totalLunar = l.penumbral + l.partial + l.total;
  return {
    correct: true,
    close: true,
    message:
      `Over ${args.yearsSimulated.toFixed(0)} years: ` +
      `${totalSolar} solar (${s.partial}P + ${s.annular}A + ${s.total}T) and ` +
      `${totalLunar} lunar (${l.penumbral}Pen + ${l.partial}P + ${l.total}T). ` +
      `Total eclipses are the rarest type!`,
  };
}

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

/* ------------------------------------------------------------------ */
/*  Eclipse window arc computation                                     */
/* ------------------------------------------------------------------ */

/** Compute the angular half-extent (in degrees) of an eclipse window arc.
 *  Delegates to `deltaLambdaFromBetaDeg` (DI callback) which returns
 *  the longitude offset at which |beta| first reaches the given threshold.
 *  Returns 0-180 where 180 means eclipses are possible everywhere. */
export function eclipseArcExtentDeg(args: {
  tiltDeg: number;
  thresholdBetaDeg: number;
  deltaLambdaFromBetaDeg: (a: { tiltDeg: number; betaDeg: number }) => number;
}): number {
  if (args.tiltDeg === 0) return 180;
  return args.deltaLambdaFromBetaDeg({
    tiltDeg: args.tiltDeg,
    betaDeg: args.thresholdBetaDeg,
  });
}

/** Build an SVG arc path d-string for an arc centered at `centerAngleDeg`
 *  with angular half-extent `halfExtentDeg`, on a circle of radius `r`
 *  centered at `(cx, cy)`.
 *
 *  Angles are in degrees, measured CW from 3-o'clock (SVG convention):
 *  x = cx + r * cos(angle), y = cy + r * sin(angle).
 *
 *  Returns empty string for zero extent and a full circle for >= 180 deg. */
export function buildArcPath(args: {
  cx: number;
  cy: number;
  r: number;
  centerAngleDeg: number;
  halfExtentDeg: number;
}): string {
  const { cx, cy, r, centerAngleDeg, halfExtentDeg } = args;
  if (halfExtentDeg >= 180) {
    // Full circle -- draw two semicircles
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  }
  if (halfExtentDeg <= 0) return "";
  const startDeg = centerAngleDeg - halfExtentDeg;
  const endDeg = centerAngleDeg + halfExtentDeg;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = halfExtentDeg * 2 > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
