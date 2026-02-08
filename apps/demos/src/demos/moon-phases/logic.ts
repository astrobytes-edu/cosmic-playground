/* ------------------------------------------------------------------ */
/*  Moon Phases  --  pure UI logic (no DOM, no @cosmic/physics)       */
/* ------------------------------------------------------------------ */

// ---- Constants ---------------------------------------------------

export const PHASE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
export const SNAP_DEGREES = 5;
export const ORBITAL_CENTER = { x: 200, y: 200 } as const;
export const ORBITAL_RADIUS = 120;
export const MOON_RADIUS = 15;
export const PHASE_MOON_RADIUS = 60;

// ---- Dependency-injection callback interface ---------------------

export interface MoonPhaseCallbacks {
  illuminationFractionFromPhaseAngleDeg: (angleDeg: number) => number;
  phaseNameFromPhaseAngleDeg: (angleDeg: number) => string;
  daysSinceNewFromPhaseAngleDeg: (angleDeg: number) => number;
  waxingWaningFromPhaseAngleDeg: (angleDeg: number) => string;
  synodicMonthDays: number;
}

// ---- Pure math helpers -------------------------------------------

/** Normalize an angle to [0, 360). */
export function normalizeAngle(angleDeg: number): number {
  const a = angleDeg % 360;
  return a < 0 ? a + 360 : a;
}

/** Shortest signed delta from `fromDeg` to `toDeg` in (-180, 180]. */
export function shortestAngleDelta(fromDeg: number, toDeg: number): number {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

// ---- Formatting helpers ------------------------------------------

/** Format an illumination fraction to 3 decimal places; em dash for non-finite. */
export function formatFraction(value: number): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(3);
}

/** Format a day value to 1 decimal place; em dash for non-finite. */
export function formatDay(value: number): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(1);
}

/**
 * Format an hour (0\u201324) as approximate 12-hour time: "~6 PM", "~12 AM", etc.
 */
export function formatApproxTime(hours: number): string {
  const h = Math.round(hours) % 24;
  if (h === 0) return "~12 AM";
  if (h === 12) return "~12 PM";
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h > 12 ? h - 12 : h;
  return `~${h12} ${ampm}`;
}

// ---- Computation helpers -----------------------------------------

/**
 * Approximate rise/set from phase angle alone (no latitude/season).
 * Full Moon (0 deg) rises ~6 PM, sets ~6 AM.
 * New Moon (180 deg) rises ~6 AM, sets ~6 PM.
 */
export function computeApproxRiseSet(phaseAngleDeg: number): {
  riseHour: number;
  setHour: number;
} {
  const riseHour = (18 + phaseAngleDeg / 15) % 24;
  const setHour = (riseHour + 12) % 24;
  return { riseHour, setHour };
}

/**
 * Snap to the nearest cardinal phase (0, 90, 180, 270) if within SNAP_DEGREES;
 * otherwise return the normalized angle unchanged.
 */
export function snapToCardinalPhase(angleDeg: number): number {
  const normalized = normalizeAngle(angleDeg);
  const targets = [0, 90, 180, 270];

  let bestTarget = normalized;
  let bestAbsDelta = Infinity;

  for (const target of targets) {
    const delta = Math.abs(shortestAngleDelta(normalized, target));
    if (delta < bestAbsDelta) {
      bestAbsDelta = delta;
      bestTarget = target;
    }
  }

  return bestAbsDelta <= SNAP_DEGREES ? bestTarget : normalized;
}

// ---- Computed data (extracted from render methods) ----------------

/** Position of the Moon on the orbital diagram SVG. */
export function computeOrbitalPosition(
  angleDeg: number,
  center: { x: number; y: number },
  radius: number
): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y - radius * Math.sin(angleRad),
  };
}

/**
 * Build the SVG path string for the lit portion of the phase-view Moon.
 * Returns "" when illumination < 1%.
 */
export function computePhaseViewPath(
  angleDeg: number,
  moonRadius: number,
  callbacks: Pick<MoonPhaseCallbacks, "illuminationFractionFromPhaseAngleDeg">
): string {
  const normalized = normalizeAngle(angleDeg);
  const illum = callbacks.illuminationFractionFromPhaseAngleDeg(normalized);
  const r = moonRadius;
  const phaseAngleRad = (normalized * Math.PI) / 180;
  const squeeze = r * Math.cos(phaseAngleRad);
  const isWaxing = normalized > 180;

  if (illum < 0.01) {
    return "";
  }

  if (illum > 0.99) {
    return `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r}`;
  }

  if (isWaxing) {
    if (squeeze >= 0) {
      return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${Math.abs(squeeze)} ${r} 0 0 1 0 ${-r}`;
    }
    return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${Math.abs(squeeze)} ${r} 0 0 0 0 ${-r}`;
  }

  if (squeeze >= 0) {
    return `M 0 ${-r} A ${r} ${r} 0 0 0 0 ${r} A ${Math.abs(squeeze)} ${r} 0 0 0 0 ${-r}`;
  }
  return `M 0 ${-r} A ${r} ${r} 0 0 0 0 ${r} A ${Math.abs(squeeze)} ${r} 0 0 1 0 ${-r}`;
}

// ---- Readout data ------------------------------------------------

export interface ReadoutData {
  phaseName: string;
  angleStr: string;
  illumPercent: string;
  daysSinceNew: string;
  waxingWaning: string;
  ariaValueText: string;
}

/** Compute all readout values for a given phase angle. */
export function computeReadoutData(
  angleDeg: number,
  model: MoonPhaseCallbacks
): ReadoutData {
  const normalized = normalizeAngle(angleDeg);
  const illum = model.illuminationFractionFromPhaseAngleDeg(normalized);
  const phaseName = model.phaseNameFromPhaseAngleDeg(normalized);
  const days = model.daysSinceNewFromPhaseAngleDeg(normalized);
  const waxingWaning = model.waxingWaningFromPhaseAngleDeg(normalized);

  return {
    phaseName,
    angleStr: String(Math.round(normalized)),
    illumPercent: String(Math.round(illum * 100)),
    daysSinceNew: formatDay(days),
    waxingWaning,
    ariaValueText: `${phaseName}, ${Math.round(illum * 100)}% illuminated, Day ${days.toFixed(0)} of lunar cycle (${waxingWaning})`,
  };
}

// ---- Timeline state ----------------------------------------------

export interface TimelineState {
  directionText: string;
  directionClass: string;
  dayText: string;
  activePhaseAngle: number | null;
}

/** Compute timeline bar state for a given phase angle. */
export function computeTimelineState(
  angleDeg: number,
  phaseAngles: readonly number[],
  model: Pick<
    MoonPhaseCallbacks,
    "daysSinceNewFromPhaseAngleDeg" | "waxingWaningFromPhaseAngleDeg" | "synodicMonthDays"
  >
): TimelineState {
  const daysSinceNew = model.daysSinceNewFromPhaseAngleDeg(angleDeg);
  const waxingWaning = model.waxingWaningFromPhaseAngleDeg(angleDeg);

  const directionText =
    waxingWaning === "Waxing" ? "WAXING \u2192" : "\u2190 WANING";
  const directionClass = waxingWaning === "Waning" ? "waning" : "";
  const dayText = `Day ${formatDay(daysSinceNew)} of ${model.synodicMonthDays}`;

  const normalized = normalizeAngle(angleDeg);
  let activePhaseAngle: number | null = null;
  for (const pa of phaseAngles) {
    const diff = Math.abs(shortestAngleDelta(normalized, pa));
    if (diff < 22.5) {
      activePhaseAngle = pa;
      break;
    }
  }

  return { directionText, directionClass, dayText, activePhaseAngle };
}
