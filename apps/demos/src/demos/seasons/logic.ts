/**
 * Pure UI logic for the seasons demo.
 * No DOM access -- all functions are testable in isolation.
 */

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

const MONTHS = [
  { name: "Jan", days: 31 },
  { name: "Feb", days: 28 },
  { name: "Mar", days: 31 },
  { name: "Apr", days: 30 },
  { name: "May", days: 31 },
  { name: "Jun", days: 30 },
  { name: "Jul", days: 31 },
  { name: "Aug", days: 31 },
  { name: "Sep", days: 30 },
  { name: "Oct", days: 31 },
  { name: "Nov", days: 30 },
  { name: "Dec", days: 31 },
] as const;

export function formatDateFromDayOfYear(day: number): string {
  let d = clamp(Math.round(day), 1, 365);
  for (const m of MONTHS) {
    if (d <= m.days) return `${m.name} ${d}`;
    d -= m.days;
  }
  return "Dec 31";
}

export function seasonFromPhaseNorth(dayOfYear: number): Season {
  const yearDays = 365.2422;
  const dayOfMarchEquinox = 80;
  const phase = ((dayOfYear - dayOfMarchEquinox) / yearDays) % 1;
  const wrapped = phase < 0 ? phase + 1 : phase;
  const quadrant = Math.floor(wrapped * 4) % 4;
  if (quadrant === 0) return "Spring";
  if (quadrant === 1) return "Summer";
  if (quadrant === 2) return "Autumn";
  return "Winter";
}

export function oppositeSeason(season: Season): Season {
  if (season === "Spring") return "Autumn";
  if (season === "Autumn") return "Spring";
  if (season === "Summer") return "Winter";
  return "Summer";
}

/**
 * Compute the earth's position on the orbit diagram.
 * Returns { x, y } in the orbit SVG coordinate system.
 *
 * `distExaggeration` amplifies the visual deviation from a circle so that
 * Earth's small orbital eccentricity (e ~ 0.017) is actually visible.
 * Legacy value is 8; set to 0 for a true-scale (nearly circular) orbit.
 */
export function orbitPosition(
  angleRad: number,
  distanceAu: number,
  orbitR: number,
  distExaggeration = 8
): { x: number; y: number } {
  const rScaled = orbitR * (1 + distExaggeration * (distanceAu - 1));
  return {
    x: rScaled * Math.cos(angleRad),
    y: rScaled * Math.sin(angleRad),
  };
}

/**
 * Compute the axis endpoint coordinates for the tilt diagram.
 * Returns { x, y } for the positive end (negate for the other end).
 */
export function axisEndpoint(axialTiltDeg: number, length: number): { x: number; y: number } {
  const axisRad = (-axialTiltDeg * Math.PI) / 180;
  return {
    x: Math.sin(axisRad) * length,
    y: -Math.cos(axisRad) * length,
  };
}

/**
 * Compute the Y position of a marker on the earth disk
 * given a latitude (or declination) in degrees.
 */
export function diskMarkerY(angleDeg: number, diskR: number, scale = 0.85): number {
  const rad = (angleDeg * Math.PI) / 180;
  return -Math.sin(rad) * scale * diskR;
}

/**
 * Format decimal hours as "Xh Ym" string.
 * E.g. 14.53 -> "14h 32m"
 */
export function formatDayLength(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

// ---------------------------------------------------------------------------
// Globe projection helpers (pure geometry, no DOM)
// ---------------------------------------------------------------------------

/**
 * How far the terminator centre shifts horizontally based on solar declination.
 *
 * At equinox (dec = 0) the terminator bisects the globe vertically (shift = 0).
 * At solstice the lit hemisphere expands, pushing the terminator sideways.
 * Positive shift = more of the northern hemisphere is lit (summer solstice).
 */
export function terminatorShiftX(declinationDeg: number, globeRadius: number): number {
  return globeRadius * Math.sin((declinationDeg * Math.PI) / 180);
}

/**
 * Convert latitude to Y position on an orthographic globe.
 * Returns SVG y-down coordinate: north pole at top, south at bottom.
 */
export function latitudeToGlobeY(latDeg: number, centerY: number, globeRadius: number): number {
  return centerY - globeRadius * Math.sin((latDeg * Math.PI) / 180);
}

/**
 * Compute ellipse parameters for a latitude circle on a tilted globe.
 *
 * The globe is viewed from the side (orthographic projection). The tilt
 * determines how "open" latitude circles appear: at tilt = 0 the globe is
 * seen exactly edge-on and every latitude circle collapses to a horizontal
 * line (ry = 0).
 *
 * Returns { cy, rx, ry } for an SVG <ellipse> centred at cx = 0 (globe centre).
 */
export function latitudeBandEllipse(
  latDeg: number,
  tiltDeg: number,
  centerX: number,
  centerY: number,
  globeRadius: number,
): { cy: number; rx: number; ry: number } {
  const latRad = (latDeg * Math.PI) / 180;
  const tiltRad = (tiltDeg * Math.PI) / 180;

  // Radius of this latitude circle on the sphere
  const circleRadius = globeRadius * Math.cos(latRad);

  // Projected vertical position shifts with tilt
  const cy = centerY - globeRadius * Math.sin(latRad) * Math.cos(tiltRad);

  // rx is the full circle radius (face-on from the side)
  const rx = circleRadius;

  // ry depends on the tilt: at tilt = 0 we see the globe edge-on => ry = 0
  const ry = circleRadius * Math.sin(tiltRad);

  return { cy, rx, ry };
}

/**
 * Globe axis endpoints for a given tilt angle.
 *
 * The axis runs from south-pole end (x1, y1) to north-pole end (x2, y2).
 * At tilt = 0 the axis is perfectly vertical.
 */
export function globeAxisEndpoints(
  tiltDeg: number,
  centerX: number,
  centerY: number,
  axisLength: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const tiltRad = (tiltDeg * Math.PI) / 180;
  const dx = axisLength * Math.sin(tiltRad);
  const dy = axisLength * Math.cos(tiltRad);
  return {
    x1: centerX - dx, y1: centerY + dy,  // south-pole end (bottom)
    x2: centerX + dx, y2: centerY - dy,  // north-pole end (top)
  };
}

// ---------------------------------------------------------------------------
// Animation helpers (pure, no DOM)
// ---------------------------------------------------------------------------

/**
 * Compute animation progress as a fraction in [0, 1].
 * `elapsedMs` is clamped so the result never exceeds 1 or goes below 0.
 */
export function animationProgress(elapsedMs: number, durationMs: number): number {
  return clamp(elapsedMs / durationMs, 0, 1);
}

/**
 * Cubic ease-in-out: slow start, fast middle, slow end.
 * Standard CSS-style cubic easing for smooth transitions.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Format a latitude value with hemisphere direction.
 * E.g. 45 -> "45 deg N", -30 -> "30 deg S", 0 -> "0 deg (Equator)"
 */
export function formatLatitude(latDeg: number): string {
  if (latDeg === 0) return "0\u00B0 (Equator)";
  const abs = Math.abs(latDeg);
  const dir = latDeg > 0 ? "N" : "S";
  return `${abs}\u00B0${dir}`;
}

/**
 * Compute the shortest signed delta to travel from `fromDay` to `toDay`,
 * wrapping around the year boundary.
 *
 * E.g. day 350 -> day 10: returns +25 (forward 25 days), not -340.
 * E.g. day 10 -> day 350: returns -25 (backward 25 days), not +340.
 */
export function shortestDayDelta(fromDay: number, toDay: number, yearLength = 365.25): number {
  let delta = toDay - fromDay;
  // Wrap into (-yearLength/2, +yearLength/2]
  while (delta > yearLength / 2) delta -= yearLength;
  while (delta < -yearLength / 2) delta += yearLength;
  return delta;
}

// ---------------------------------------------------------------------------
// Orbit panel helpers: season labels, perihelion/aphelion, distance line,
// Polaris axis indicator
// ---------------------------------------------------------------------------

export interface OrbitLabel {
  x: number;
  y: number;
  label: string;
  textAnchor: "start" | "middle" | "end";
}

/**
 * Season label positions around the orbit.
 * Uses the same angle convention as the orbit SVG (0 = right = perihelion).
 * March equinox is ~77 days after perihelion (day 3), so ~76 deg ahead.
 * Labels placed just outside the orbit circle.
 */
export function orbitSeasonLabelPositions(
  orbitR: number,
  centerX: number,
  centerY: number,
): OrbitLabel[] {
  // March equinox: day 80, perihelion: day 3 => ~77 days => ~76 deg
  const MAR_ANGLE = (77 / 365.25) * 2 * Math.PI;
  const labelR = orbitR + 18;
  const seasons: { label: string; offsetQuarter: number }[] = [
    { label: "Mar", offsetQuarter: 0 },
    { label: "Jun", offsetQuarter: 1 },
    { label: "Sep", offsetQuarter: 2 },
    { label: "Dec", offsetQuarter: 3 },
  ];

  return seasons.map(({ label, offsetQuarter }) => {
    const angle = MAR_ANGLE + (offsetQuarter * Math.PI) / 2;
    const x = centerX + labelR * Math.cos(angle);
    const y = centerY + labelR * Math.sin(angle);
    const cos = Math.cos(angle);
    const textAnchor: "start" | "middle" | "end" =
      cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
    return { x, y, label, textAnchor };
  });
}

/**
 * Polaris axis indicator: arrow extending from Earth position
 * in the orbit panel. In the top-down orbit view the axis projects
 * as a short line tilted from vertical by the axial tilt.
 * Returns the endpoint relative to Earth position.
 */
export function polarisIndicatorEndpoints(
  axialTiltDeg: number,
  earthX: number,
  earthY: number,
  length: number,
): { x2: number; y2: number } {
  const tiltRad = (axialTiltDeg * Math.PI) / 180;
  return {
    x2: earthX + length * Math.sin(tiltRad),
    y2: earthY - length * Math.cos(tiltRad),
  };
}

// ---------------------------------------------------------------------------
// Season readout color coding [S1]
// ---------------------------------------------------------------------------

/**
 * Return a CSS class name for season-colored readout text.
 */
export function seasonColorClass(season: Season): string {
  switch (season) {
    case "Summer": return "season--summer";
    case "Winter": return "season--winter";
    case "Spring": return "season--spring";
    case "Autumn": return "season--autumn";
  }
}

// ---------------------------------------------------------------------------
// Contextual messages [S7]
// ---------------------------------------------------------------------------

export interface SeasonContextState {
  dayOfYear: number;
  seasonNorth: Season;
  axialTiltDeg: number;
  distanceAu: number;
}

/**
 * Return a contextual pedagogical message for the current state.
 * Priority: zero tilt > perihelion myth > solstice > equinox > empty.
 */
export function contextualMessage(state: SeasonContextState): string {
  const { dayOfYear, axialTiltDeg } = state;

  // Zero tilt = no seasons
  if (axialTiltDeg < 1) {
    return "With near-zero tilt, declination stays near 0\u00B0 all year \u2014 no seasons.";
  }

  // Perihelion in Northern winter (distance myth)
  if (dayOfYear <= 10 || dayOfYear >= 360) {
    return "Earth is closest to the Sun right now \u2014 yet it\u2019s Northern Hemisphere winter. Distance doesn\u2019t drive seasons.";
  }

  // Near solstices
  if (Math.abs(dayOfYear - 172) <= 3) {
    return "June solstice: longest day in the North, shortest in the South.";
  }
  if (Math.abs(dayOfYear - 356) <= 3) {
    return "December solstice: longest day in the South, shortest in the North.";
  }

  // Near equinoxes
  if (Math.abs(dayOfYear - 80) <= 3) {
    return "March equinox: nearly equal day and night worldwide.";
  }
  if (Math.abs(dayOfYear - 266) <= 3) {
    return "September equinox: nearly equal day and night worldwide.";
  }

  return "";
}

// ---------------------------------------------------------------------------
// Day-length arc geometry [NEW]
// ---------------------------------------------------------------------------

export interface DayLengthArc {
  dayArcD: string;
  nightArcD: string;
  dayFraction: number;
}

/**
 * Compute SVG path strings for the day and night arcs at the observer's
 * latitude on the globe. The day arc is centred on the sun-facing (left)
 * side of the globe.
 */
export function dayLengthArcGeometry(args: {
  latitudeDeg: number;
  dayLengthHours: number;
  globeRadius: number;
  tiltDeg: number;
}): DayLengthArc {
  const { latitudeDeg, dayLengthHours, globeRadius, tiltDeg } = args;
  const dayFraction = clamp(dayLengthHours / 24, 0, 1);

  const band = latitudeBandEllipse(latitudeDeg, tiltDeg, 0, 0, globeRadius);
  const { rx, ry, cy } = band;
  const absRy = Math.abs(ry);

  if (dayFraction >= 1) {
    return {
      dayArcD: `M ${-rx} ${cy} A ${rx} ${absRy} 0 1 1 ${rx} ${cy} A ${rx} ${absRy} 0 1 1 ${-rx} ${cy}`,
      nightArcD: "",
      dayFraction: 1,
    };
  }
  if (dayFraction <= 0) {
    return {
      dayArcD: "",
      nightArcD: `M ${-rx} ${cy} A ${rx} ${absRy} 0 1 1 ${rx} ${cy} A ${rx} ${absRy} 0 1 1 ${-rx} ${cy}`,
      dayFraction: 0,
    };
  }

  // The day arc spans dayFraction * 360 deg, centred at angle PI (left = sun side).
  const halfDayAngle = dayFraction * Math.PI;
  const dayStartAngle = Math.PI - halfDayAngle;
  const dayEndAngle = Math.PI + halfDayAngle;

  const px = (a: number) => rx * Math.cos(a);
  const py = (a: number) => cy + absRy * Math.sin(a);

  const largeArcDay = dayFraction > 0.5 ? 1 : 0;
  const largeArcNight = dayFraction < 0.5 ? 1 : 0;

  const dayArcD =
    `M ${px(dayStartAngle).toFixed(2)} ${py(dayStartAngle).toFixed(2)} ` +
    `A ${rx.toFixed(2)} ${absRy.toFixed(2)} 0 ${largeArcDay} 1 ` +
    `${px(dayEndAngle).toFixed(2)} ${py(dayEndAngle).toFixed(2)}`;

  const nightArcD =
    `M ${px(dayEndAngle).toFixed(2)} ${py(dayEndAngle).toFixed(2)} ` +
    `A ${rx.toFixed(2)} ${absRy.toFixed(2)} 0 ${largeArcNight} 1 ` +
    `${px(dayStartAngle).toFixed(2)} ${py(dayStartAngle).toFixed(2)}`;

  return { dayArcD, nightArcD, dayFraction };
}
