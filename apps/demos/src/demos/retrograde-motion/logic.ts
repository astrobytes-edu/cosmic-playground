/**
 * Retrograde Motion — Pure UI Logic
 *
 * All testable logic extracted from main.ts.
 * No DOM access. Physics model injected via callbacks (DI).
 */

// ── Utilities ───────────────────────────────────────────────

const EM_DASH = "\u2014";

export function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return EM_DASH;
  return value.toFixed(digits);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ── State labels ────────────────────────────────────────────

export function geometryHintLabel(
  observerA: number,
  targetA: number,
): string {
  if (targetA < observerA) return "Inferior-planet geometry";
  if (targetA > observerA) return "Superior-planet geometry";
  return "";
}

export function formatRetrogradeState(dLambdaDt: number): string {
  if (!Number.isFinite(dLambdaDt)) return EM_DASH;
  if (dLambdaDt > 0) return "Direct";
  if (dLambdaDt < 0) return "Retrograde";
  return "Stationary";
}

export function formatDuration(startDay: number, endDay: number): string {
  if (!Number.isFinite(startDay) || !Number.isFinite(endDay)) return EM_DASH;
  return (endDay - startDay).toFixed(1);
}

// ── Series indexing ─────────────────────────────────────────

export function seriesIndexAtDay(
  tDay: number,
  windowStartDay: number,
  dtInternal: number,
): number {
  const raw = (tDay - windowStartDay) / dtInternal;
  return Math.max(0, Math.round(raw));
}

export function findPrevNextStationary(
  stationaryDays: number[],
  cursorDay: number,
): { prev: number; next: number } {
  let prev = NaN;
  let next = NaN;
  for (const d of stationaryDays) {
    if (d <= cursorDay) prev = d;
    if (d > cursorDay && Number.isNaN(next)) next = d;
  }
  // If cursor is exactly on a stationary day, next should be the one after
  if (prev === cursorDay) {
    const idx = stationaryDays.indexOf(prev);
    if (idx < stationaryDays.length - 1) next = stationaryDays[idx + 1];
  }
  return { prev, next };
}

export function nearestRetrogradeInterval(
  intervals: { startDay: number; endDay: number }[],
  cursorDay: number,
): { startDay: number; endDay: number } | null {
  if (intervals.length === 0) return null;

  // Check if cursor is inside any interval
  for (const iv of intervals) {
    if (cursorDay >= iv.startDay && cursorDay <= iv.endDay) return iv;
  }

  // Find nearest by midpoint distance
  let best = intervals[0];
  let bestDist = Math.abs(cursorDay - (best.startDay + best.endDay) / 2);
  for (let i = 1; i < intervals.length; i++) {
    const mid = (intervals[i].startDay + intervals[i].endDay) / 2;
    const dist = Math.abs(cursorDay - mid);
    if (dist < bestDist) {
      best = intervals[i];
      bestDist = dist;
    }
  }
  return best;
}

// ── SVG coordinate mapping ──────────────────────────────────

export function plotXFromDay(
  tDay: number,
  windowStart: number,
  windowEnd: number,
  xLeft: number,
  xRight: number,
): number {
  const frac = (tDay - windowStart) / (windowEnd - windowStart);
  return xLeft + frac * (xRight - xLeft);
}

export function plotYFromDeg(
  deg: number,
  yMin: number,
  yMax: number,
  yTop: number,
  yBottom: number,
): number {
  const frac = (deg - yMin) / (yMax - yMin);
  return yTop + (1 - frac) * (yBottom - yTop);
}

export function dayFromPlotX(
  x: number,
  windowStart: number,
  windowEnd: number,
  xLeft: number,
  xRight: number,
): number {
  const frac = (x - xLeft) / (xRight - xLeft);
  return windowStart + frac * (windowEnd - windowStart);
}

// ── Orbit geometry ──────────────────────────────────────────

const TAU = 2 * Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function orbitEllipsePoints(
  aAu: number,
  e: number,
  varpiDeg: number,
  steps: number,
): { x: number; y: number }[] {
  const varpiRad = varpiDeg * DEG_TO_RAD;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const nu = (i / steps) * TAU;
    const r = (aAu * (1 - e * e)) / (1 + e * Math.cos(nu));
    const theta = nu + varpiRad;
    pts.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
  }
  return pts;
}

export function buildOrbitPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  const parts = [`M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`];
  for (let i = 1; i < pts.length; i++) {
    parts.push(`L${pts[i].x.toFixed(2)},${pts[i].y.toFixed(2)}`);
  }
  parts.push("Z");
  return parts.join("");
}

// ── Display state (DI pattern) ──────────────────────────────

export type RetroModelCallbacks = {
  planetElements: (key: string) => { aAu: number; e: number; varpiDeg: number; L0Deg: number };
};

export type DisplayState = {
  cursorDay: number;
  lambdaDeg: number;
  lambdaUnwrappedDeg: number;
  dLambdaDt: number;
  stateLabel: string;
  geometryHint: string;
  prevStationary: number;
  nextStationary: number;
  retroInterval: { startDay: number; endDay: number } | null;
  retroDuration: string;
};

export function computeDisplayState(
  series: {
    observer: string;
    target: string;
    windowStartDay: number;
    dtInternalDay: number;
    timesDay: number[];
    lambdaWrappedDeg: number[];
    lambdaUnwrappedDeg: number[];
    dLambdaDtDegPerDay: number[];
    stationaryDays: number[];
    retrogradeIntervals: { startDay: number; endDay: number }[];
  },
  cursorDay: number,
  model: RetroModelCallbacks,
): DisplayState {
  const idx = seriesIndexAtDay(cursorDay, series.windowStartDay, series.dtInternalDay);
  const safeIdx = clamp(idx, 0, series.timesDay.length - 1);

  const lambdaDeg = series.lambdaWrappedDeg[safeIdx] ?? NaN;
  const lambdaUnwrappedDeg = series.lambdaUnwrappedDeg[safeIdx] ?? NaN;
  const dLambdaDt = series.dLambdaDtDegPerDay[safeIdx] ?? NaN;

  const observerEl = model.planetElements(series.observer);
  const targetEl = model.planetElements(series.target);

  const { prev, next } = findPrevNextStationary(series.stationaryDays, cursorDay);
  const retroInterval = nearestRetrogradeInterval(series.retrogradeIntervals, cursorDay);

  return {
    cursorDay,
    lambdaDeg,
    lambdaUnwrappedDeg,
    dLambdaDt,
    stateLabel: formatRetrogradeState(dLambdaDt),
    geometryHint: geometryHintLabel(observerEl.aAu, targetEl.aAu),
    prevStationary: prev,
    nextStationary: next,
    retroInterval,
    retroDuration: retroInterval
      ? formatDuration(retroInterval.startDay, retroInterval.endDay)
      : EM_DASH,
  };
}

