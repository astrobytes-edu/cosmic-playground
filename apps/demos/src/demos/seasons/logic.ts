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
 */
export function orbitPosition(
  angleRad: number,
  distanceAu: number,
  orbitR: number
): { x: number; y: number } {
  const rScaled = orbitR * clamp(distanceAu, 0.95, 1.05);
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
