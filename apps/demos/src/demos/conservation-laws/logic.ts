/**
 * Pure UI logic for the conservation-laws demo: formatting, view window, arrow scale and
 * announcement text. Extracted from main.ts so it can be unit-tested without DOM or physics imports.
 */

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Map a linear slider value (its raw `.value`) through a base-10 log scale.
 * The conservation-laws demo uses sliders whose `.value` IS the log10 of
 * the physical quantity (e.g. slider value 0 -> 10^0 = 1).
 */
export function logSliderToValue(sliderValue: number): number {
  return Math.pow(10, sliderValue);
}

/**
 * Inverse of logSliderToValue: given a physical value, return the
 * slider position (log10).
 */
export function valueToLogSlider(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.log10(value);
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/**
 * Format a number for display in readouts. Never e-notation: teaching copy writes powers of ten
 * as 10^n, and a readout such as "1.11e-16" means nothing to a student.
 * - Non-finite values -> em-dash
 * - Zero -> "0"
 * - |value| < 1e-3 -> decimals keeping max(1, digits) significant figures (0.00012 -> "0.000120")
 * - Otherwise -> fixed-point with `digits` decimal places
 */
export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs < 1e-3) {
    const decimals = Math.min(20, Math.max(1, digits) - 1 - Math.floor(Math.log10(abs)));
    return value.toFixed(decimals);
  }
  return value.toFixed(digits);
}

// ---------------------------------------------------------------------------
// Orbit type and readout text
// ---------------------------------------------------------------------------

/**
 * Format the orbit-type string for display (adds " (escape)" to parabolic).
 */
export function formatOrbitType(type: string): string {
  switch (type) {
    case "circular":
      return "circular";
    case "elliptical":
      return "elliptical";
    case "parabolic":
      return "parabolic (escape)";
    case "hyperbolic":
      return "hyperbolic";
    case "radial":
      return "radial";
    default:
      return "invalid";
  }
}

/** Three decimals, so the exact escape preset (1.414) is distinguishable from the slider's 1.41. */
export function formatSpeedFactor(value: number): string {
  return formatNumber(value, 3);
}

/** Specific energy for display. Round-off below 1e-9 of the potential scale mu/r0 shows as 0. */
export function formatSpecificEnergy(epsAu2Yr2: number, potentialScaleAu2Yr2: number): string {
  if (
    Number.isFinite(epsAu2Yr2) &&
    Number.isFinite(potentialScaleAu2Yr2) &&
    Math.abs(epsAu2Yr2) <= 1e-9 * Math.abs(potentialScaleAu2Yr2)
  ) {
    return "0";
  }
  return formatNumber(epsAu2Yr2, 4);
}

/**
 * Eccentricity for display, the same on screen, in Station rows and in the export. Radial or invalid
 * motion has no conic, so an em dash; a circular orbit's computed e is round-off (about 1e-16), so the
 * exact 0 it stands for.
 */
export function formatEccentricity(orbitType: string, ecc: number, digits: number): string {
  if (orbitType === "radial" || orbitType === "invalid") return "—";
  if (orbitType === "circular") return "0";
  return formatNumber(ecc, digits);
}

/** Periapsis distance for display; an em dash for radial or invalid motion, which has no periapsis. */
export function formatPeriapsis(orbitType: string, rpAu: number, digits: number): string {
  if (orbitType === "radial" || orbitType === "invalid") return "—";
  return formatNumber(rpAu, digits);
}

/** Plain-words status for screen readers; call on `change` and preset clicks, never per frame. */
export function orbitAnnouncement(args: { orbitType: string; ecc: number; epsAu2Yr2: number }): string {
  const e = formatNumber(args.ecc, 3);
  switch (args.orbitType) {
    case "circular":
      return "Circular orbit: bound, eccentricity 0.";
    case "elliptical":
      return `Elliptical orbit: bound, eccentricity ${e}.`;
    case "parabolic":
      return "Parabolic orbit: exactly at escape, specific energy 0.";
    case "hyperbolic":
      return `Hyperbolic orbit: unbound, eccentricity ${e}.`;
    case "radial":
      return args.epsAu2Yr2 < 0
        ? "Radial motion: with no sideways speed the body falls straight in."
        : "Radial motion: the body moves straight out and escapes.";
    default:
      return "No valid orbit for these settings.";
  }
}

// ---------------------------------------------------------------------------
// SVG coordinate helpers
// ---------------------------------------------------------------------------

export interface SvgPoint {
  x: number;
  y: number;
}

/**
 * Convert orbital (AU) coordinates to SVG pixel coordinates.
 * The y-axis is flipped (SVG y-down, physics y-up).
 */
export function toSvg(
  xAu: number,
  yAu: number,
  center: SvgPoint,
  scalePxPerAu: number,
): SvgPoint {
  return {
    x: center.x + xAu * scalePxPerAu,
    y: center.y - yAu * scalePxPerAu,
  };
}

/**
 * Build an SVG path `d` attribute from a sequence of orbital points.
 */
export function buildPathD(
  points: { xAu: number; yAu: number }[],
  center: SvgPoint,
  scalePxPerAu: number,
): string {
  if (points.length === 0) return "";
  const start = toSvg(points[0].xAu, points[0].yAu, center, scalePxPerAu);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const p = toSvg(points[i].xAu, points[i].yAu, center, scalePxPerAu);
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
}

export const VIEW_RADIUS_MAX_AU = 50;
/** The window's radius is at least this many r0, so a circular orbit's start point is 250/1.5 px from centre at
 * every r0. A fixed 1.5 AU floor drew r0 = 0.1 AU 16.7 px out, inside the 10 px Sun and its glow. */
export const VIEW_RADIUS_MIN_R0_MULTIPLE = 1.5;
/** Orbits reaching farther than this many r0 are clipped, closed or open, so the view cannot jump at e = 1. */
export const VIEW_R0_MULTIPLE = 6;

/** Radius of the plotted window in AU. `raAu` is Infinity for open orbits. */
export function viewRadiusAu(args: { raAu: number; r0Au: number }): number {
  const { raAu, r0Au } = args;
  const closedFit = Number.isFinite(raAu) ? Math.max(raAu, r0Au) * 1.1 : Number.POSITIVE_INFINITY;
  return clamp(
    Math.min(closedFit, VIEW_R0_MULTIPLE * r0Au),
    VIEW_RADIUS_MIN_R0_MULTIPLE * r0Au,
    VIEW_RADIUS_MAX_AU
  );
}

export const ARROW_DT_LADDER_DAYS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000] as const;
export const ARROW_MAX_PX = 120;
/** Julian year in days, the same year as AstroConstants.TIME.YEAR_S / DAY_S. */
const DAYS_PER_YEAR = 365.25;

/** Pixels covered in `dtDays` at `vAuYr`, drawn at the orbit's scale. */
export function arrowLengthPx(vAuYr: number, dtDays: number, scalePxPerAu: number): number {
  return vAuYr * (dtDays / DAYS_PER_YEAR) * scalePxPerAu;
}

/** Largest round step whose arrow at the fastest point fits `maxPx`; null when nothing moves. */
export function pickArrowDtDays(vMaxAuYr: number, scalePxPerAu: number, maxPx: number = ARROW_MAX_PX): number | null {
  if (!(vMaxAuYr > 0) || !(scalePxPerAu > 0)) return null;
  // If even one day overflows maxPx this still returns the smallest step. The sliders do reach that case
  // (M = 10, r0 = 0.1 AU, speed factor 0.1: one day is about 5,700 px at periapsis), so arrowScale checks for it.
  let best: number = ARROW_DT_LADDER_DAYS[0];
  for (const days of ARROW_DT_LADDER_DAYS) {
    if (arrowLengthPx(vMaxAuYr, days, scalePxPerAu) <= maxPx) best = days;
  }
  return best;
}

export type ArrowScale = { dtDays: number | null; pxPerAuYr: number; toScale: boolean };

/** Normally the arrow is the distance covered in a round time step. If even the smallest step overflows
 * ARROW_MAX_PX at periapsis, lengths stay proportional to speed but the fastest is capped at ARROW_MAX_PX. */
export function arrowScale(vMaxAuYr: number, scalePxPerAu: number): ArrowScale {
  const dtDays = pickArrowDtDays(vMaxAuYr, scalePxPerAu);
  if (dtDays === null) return { dtDays: null, pxPerAuYr: 0, toScale: false };
  if (arrowLengthPx(vMaxAuYr, dtDays, scalePxPerAu) <= ARROW_MAX_PX) {
    return { dtDays, pxPerAuYr: arrowLengthPx(1, dtDays, scalePxPerAu), toScale: true };
  }
  return { dtDays: null, pxPerAuYr: ARROW_MAX_PX / vMaxAuYr, toScale: false };
}

// ---------------------------------------------------------------------------
// Animation time scale
// ---------------------------------------------------------------------------

/** Orbital years per second on screen by default: a circular orbit at 1 AU around 1 Msun takes 3 s. */
export const DEFAULT_SIM_YEARS_PER_SEC = 1 / 3;
/** Shortest on-screen time for one lap of a bound orbit, or for an open orbit's run to the view edge. At the default
 * scale the fastest orbits the sliders reach last about 30 ms, so the body strobes and can appear to orbit backwards. */
export const MIN_ON_SCREEN_ORBIT_SEC = 1.5;

/**
 * Orbital years per second on screen. `characteristicYr` is a bound orbit's period, or an open orbit's time from its
 * start to the view edge. The default holds while that lasts at least MIN_ON_SCREEN_ORBIT_SEC on screen; a faster
 * orbit is slowed to take exactly that long. No usable time (radial motion) keeps the default.
 */
export function animationTimeScaleYrPerSec(characteristicYr: number): number {
  if (!Number.isFinite(characteristicYr) || !(characteristicYr > 0)) return DEFAULT_SIM_YEARS_PER_SEC;
  return Math.min(DEFAULT_SIM_YEARS_PER_SEC, characteristicYr / MIN_ON_SCREEN_ORBIT_SEC);
}

/** Orbital time shown in one second on screen: "4 months", "2.4 days" or "20.8 hours". */
export function formatTimeScale(yrPerSec: number): string {
  const days = yrPerSec * DAYS_PER_YEAR;
  if (days >= 60) {
    const months = days / (DAYS_PER_YEAR / 12);
    const whole = Math.round(months);
    return `${Math.abs(months - whole) <= 0.05 ? String(whole) : months.toFixed(1)} months`;
  }
  if (days >= 1) return `${days.toFixed(1)} days`;
  return `${(days * 24).toFixed(1)} hours`;
}

// ---------------------------------------------------------------------------
// Motion trail
// ---------------------------------------------------------------------------

export type TrailEntry = { tMs: number; nuRad: number };
export type TrailSegment = { nuFromRad: number; nuToRad: number; opacity: number };

/** Opacity of the oldest and newest trail segments; the ones between rise linearly. */
export const TRAIL_OPACITY_OLDEST = 0.15;
export const TRAIL_OPACITY_NEWEST = 0.85;

/**
 * The fading trail behind the body, from a time-ordered history of where it was.
 * Entries older than `nowMs - windowMs` are dropped, except the newest one at or before that edge, which starts the arc
 * so the trail reaches the window edge. The window is cut into `segmentCount` buckets by age; each interval between
 * consecutive entries joins the bucket of its newer end, and consecutive intervals in one bucket make one segment.
 * Segments come oldest first and share their ends, with opacity by bucket: TRAIL_OPACITY_OLDEST in the oldest,
 * TRAIL_OPACITY_NEWEST in the newest. A segment's true anomalies are raw; the arc sampler runs them forward.
 */
export function trailSegments(
  history: TrailEntry[],
  nowMs: number,
  windowMs = 300,
  segmentCount = 6,
): TrailSegment[] {
  if (!(windowMs > 0) || !(segmentCount >= 1)) return [];
  const cutoffMs = nowMs - windowMs;
  let start = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].tMs <= cutoffMs) {
      start = i;
      break;
    }
  }
  if (history.length - start < 2) return [];

  const buckets = Math.floor(segmentCount);
  const bucketMs = windowMs / buckets;
  const segments: TrailSegment[] = [];
  let lastBucket = -1;
  for (let i = start + 1; i < history.length; i++) {
    const ageMs = nowMs - history[i].tMs;
    const bucket = clamp(buckets - 1 - Math.floor(ageMs / bucketMs), 0, buckets - 1);
    const current = segments[segments.length - 1];
    if (current && bucket === lastBucket) {
      current.nuToRad = history[i].nuRad;
      continue;
    }
    const opacity =
      buckets === 1
        ? TRAIL_OPACITY_NEWEST
        : TRAIL_OPACITY_OLDEST + ((TRAIL_OPACITY_NEWEST - TRAIL_OPACITY_OLDEST) * bucket) / (buckets - 1);
    segments.push({ nuFromRad: history[i - 1].nuRad, nuToRad: history[i].nuRad, opacity });
    lastBucket = bucket;
  }
  return segments;
}

// ---------------------------------------------------------------------------
// Status and caption text that depend on reduced motion
// ---------------------------------------------------------------------------

/** Status when the body reaches the edge of the view. Under reduced motion Play is disabled, so it names Step. */
export function leftViewMessage(reducedMotion: boolean): string {
  return `The body has left the view. Press ${reducedMotion ? "Step" : "Play"} to run it again.`;
}

/**
 * Which time line the stage caption shows. Normally the playback scale, "1 s on screen = ...". Under reduced motion
 * Play is disabled, so what one Step covers instead. Motion with no path to step along (radial or invalid) neither
 * plays nor steps, so neither.
 */
export function captionTimeLine(args: { canStep: boolean; reducedMotion: boolean }): "playback" | "step" | "none" {
  if (!args.canStep) return "none";
  return args.reducedMotion ? "step" : "playback";
}

// ---------------------------------------------------------------------------
// Energy instrument (orbit-stage design, sections 6 and 7)
// ---------------------------------------------------------------------------

export type EnergyBar = {
  /** x of U = 0, px from the track's left edge. */
  zeroPx: number;
  /** x of the total-energy marker; fixed for a given orbit. */
  epsPx: number;
  /** U runs from U up to 0. */
  uBar: { xPx: number; widthPx: number };
  /** K starts where U ends and runs to U + K, which is eps. */
  kBar: { xPx: number; widthPx: number };
};

/**
 * Two stacked bars on one scale that is fixed per orbit. U runs from 0 down to U; K starts where U ends, so its far
 * end lands on eps, which stays still while the body moves. The scale runs from 6% past the deepest U on the orbit
 * (-mu/r_p) to max(eps, 0) plus a fifth of that depth, so an unbound eps > 0 still fits.
 * Null when there is no finite deepest potential (radial infall reaches r = 0) or no width to draw in.
 */
export function energyBarLayout(args: {
  kAu2Yr2: number;
  uAu2Yr2: number;
  epsAu2Yr2: number;
  uDeepestAu2Yr2: number;
  widthPx: number;
}): EnergyBar | null {
  const { kAu2Yr2, uAu2Yr2, epsAu2Yr2, uDeepestAu2Yr2, widthPx } = args;
  if (![kAu2Yr2, uAu2Yr2, epsAu2Yr2, uDeepestAu2Yr2, widthPx].every(Number.isFinite)) return null;
  if (!(uDeepestAu2Yr2 < 0) || !(widthPx > 0)) return null;
  const lo = uDeepestAu2Yr2 * 1.06;
  const hi = Math.max(epsAu2Yr2, 0) - uDeepestAu2Yr2 * 0.2;
  const x = (v: number) => ((v - lo) / (hi - lo)) * widthPx;
  const zeroPx = x(0);
  const uPx = x(uAu2Yr2);
  return {
    zeroPx,
    epsPx: x(epsAu2Yr2),
    uBar: { xPx: uPx, widthPx: zeroPx - uPx },
    kBar: { xPx: uPx, widthPx: x(uAu2Yr2 + kAu2Yr2) - uPx }
  };
}

export type EffectivePotentialPlot = {
  /** SVG path of U_eff(r) across the plot. */
  curveD: string;
  /** Closed SVG path between the energy line and the curve, from r_p to r_a (or to the plot edge). */
  allowedD: string;
  epsYPx: number;
  zeroYPx: number;
  rpXPx: number;
  /** Null for an open orbit, or when r_a is beyond the plot. */
  raXPx: number | null;
  xPx: (rAu: number) => number;
  yPx: (eAu2Yr2: number) => number;
};

/**
 * U_eff(r) in plot pixels, y down. `uEff` is injected so this file stays free of physics imports.
 * r runs from 0.55 r_p to rMaxAu. Energy runs from 12% below the minimum U_eff (-mu^2/(2 h^2)) up to max(eps, 0)
 * plus 45% of that depth; the centrifugal barrier above the top is clamped to the top edge.
 */
export function effectivePotentialPlot(args: {
  uEff: (rAu: number) => number;
  epsAu2Yr2: number;
  uEffMinAu2Yr2: number;
  rpAu: number;
  raAu: number;
  rMaxAu: number;
  widthPx: number;
  heightPx: number;
  samples?: number;
}): EffectivePotentialPlot | null {
  const { uEff, epsAu2Yr2, uEffMinAu2Yr2, rpAu, raAu, rMaxAu, widthPx, heightPx, samples = 120 } = args;
  if (!(rpAu > 0) || !(rMaxAu > rpAu) || !(uEffMinAu2Yr2 < 0) || !Number.isFinite(epsAu2Yr2)) return null;
  if (!(widthPx > 0) || !(heightPx > 0)) return null;
  const rMin = 0.55 * rpAu;
  const { eLo, eHi } = potentialEnergyWindow({ epsAu2Yr2, uEffMinAu2Yr2 });
  const xPx = (rAu: number) => ((rAu - rMin) / (rMaxAu - rMin)) * widthPx;
  const yPx = (e: number) => ((eHi - clamp(e, eLo, eHi)) / (eHi - eLo)) * heightPx;
  const pt = (rAu: number, e: number) => `${xPx(rAu).toFixed(2)} ${yPx(e).toFixed(2)}`;

  const curve: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const r = rMin + ((rMaxAu - rMin) * i) / samples;
    curve.push(`${i === 0 ? "M" : "L"} ${pt(r, uEff(r))}`);
  }

  const rEnd = Number.isFinite(raAu) ? Math.min(raAu, rMaxAu) : rMaxAu;
  const allowed: string[] = [`M ${pt(rpAu, epsAu2Yr2)}`];
  for (let i = 0; i <= samples; i++) {
    const r = rpAu + ((rEnd - rpAu) * i) / samples;
    allowed.push(`L ${pt(r, uEff(r))}`);
  }
  allowed.push(`L ${pt(rEnd, epsAu2Yr2)} Z`);

  return {
    curveD: curve.join(" "),
    allowedD: allowed.join(" "),
    epsYPx: yPx(epsAu2Yr2),
    zeroYPx: yPx(0),
    rpXPx: xPx(rpAu),
    raXPx: Number.isFinite(raAu) && raAu <= rMaxAu ? xPx(raAu) : null,
    xPx,
    yPx
  };
}

/** The turning points in words, for the plot's accessible name and the caption under it. */
export function turningPointsText(args: { orbitType: string; rpAu: number; raAu: number }): string {
  const { orbitType, rpAu, raAu } = args;
  if (orbitType === "radial" || !(rpAu > 0)) return "No angular momentum, so there is no barrier: the body falls straight in.";
  if (orbitType === "circular") return `Circular: the energy line touches the bottom of the curve at ${formatNumber(rpAu, 2)} AU.`;
  if (Number.isFinite(raAu)) return `Turns around at ${formatNumber(rpAu, 2)} AU and ${formatNumber(raAu, 2)} AU.`;
  return `Turns around once, at ${formatNumber(rpAu, 2)} AU, and does not come back.`;
}

/**
 * The energy range both potential drawings show: from 12% below the minimum U_eff (-mu^2/(2 h^2)) to max(eps, 0)
 * plus 45% of that depth, so the trough, the energy line and some of the barrier are always in view.
 */
export function potentialEnergyWindow(args: { epsAu2Yr2: number; uEffMinAu2Yr2: number }): { eLo: number; eHi: number } {
  return { eLo: 1.12 * args.uEffMinAu2Yr2, eHi: Math.max(args.epsAu2Yr2, 0) - 0.45 * args.uEffMinAu2Yr2 };
}

export type PotentialProfile = {
  curveD: string;
  allowedD: string;
  epsYPx: number;
  zeroYPx: number;
  rpXPx: number;
  /** Null for an open orbit, or when r_a is beyond the view. */
  raXPx: number | null;
  /** Signed distance along the cut through the Sun, AU, to px. */
  xPx: (signedRAu: number) => number;
  yPx: (eAu2Yr2: number) => number;
};

/**
 * The Potential view's 2D drawing: the landscape cut through the Sun, U_eff(|x|) for x from -rMaxAu to +rMaxAu,
 * mirrored about the centre, with r on a linear scale so distances read true. Within 0.55 r_p of the Sun the
 * centrifugal barrier is off the top and is not drawn. The body is drawn at x = +r by the caller.
 */
export function potentialProfile(args: {
  uEff: (rAu: number) => number;
  epsAu2Yr2: number;
  uEffMinAu2Yr2: number;
  rpAu: number;
  raAu: number;
  rMaxAu: number;
  widthPx: number;
  heightPx: number;
  samples?: number;
}): PotentialProfile | null {
  const { uEff, epsAu2Yr2, uEffMinAu2Yr2, rpAu, raAu, rMaxAu, widthPx, heightPx, samples = 90 } = args;
  if (!(rpAu > 0) || !(rMaxAu > rpAu) || !(uEffMinAu2Yr2 < 0) || !Number.isFinite(epsAu2Yr2)) return null;
  if (!(widthPx > 0) || !(heightPx > 0)) return null;
  const { eLo, eHi } = potentialEnergyWindow({ epsAu2Yr2, uEffMinAu2Yr2 });
  const cx = widthPx / 2;
  const xPx = (signedRAu: number) => cx + (signedRAu / rMaxAu) * cx;
  const yPx = (e: number) => ((eHi - clamp(e, eLo, eHi)) / (eHi - eLo)) * heightPx;
  const pt = (signedRAu: number, e: number) => `${xPx(signedRAu).toFixed(2)} ${yPx(e).toFixed(2)}`;
  const rMin = 0.55 * rpAu;
  const rEnd = Number.isFinite(raAu) ? Math.min(raAu, rMaxAu) : rMaxAu;

  const half = (sign: 1 | -1) => {
    const out: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const r = rMin + ((rMaxAu - rMin) * i) / samples;
      out.push(`${i === 0 ? "M" : "L"} ${pt(sign * r, uEff(r))}`);
    }
    return out.join(" ");
  };
  const allowed = (sign: 1 | -1) => {
    const out = [`M ${pt(sign * rpAu, epsAu2Yr2)}`];
    for (let i = 0; i <= samples; i++) {
      const r = rpAu + ((rEnd - rpAu) * i) / samples;
      out.push(`L ${pt(sign * r, uEff(r))}`);
    }
    out.push(`L ${pt(sign * rEnd, epsAu2Yr2)} Z`);
    return out.join(" ");
  };

  return {
    curveD: `${half(-1)} ${half(1)}`,
    allowedD: `${allowed(-1)} ${allowed(1)}`,
    epsYPx: yPx(epsAu2Yr2),
    zeroYPx: yPx(0),
    rpXPx: xPx(rpAu),
    raXPx: Number.isFinite(raAu) && raAu <= rMaxAu ? xPx(raAu) : null,
    xPx,
    yPx
  };
}
