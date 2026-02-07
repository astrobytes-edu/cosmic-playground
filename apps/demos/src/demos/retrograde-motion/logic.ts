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
