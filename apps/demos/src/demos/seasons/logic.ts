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
