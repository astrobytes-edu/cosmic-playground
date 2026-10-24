/* ------------------------------------------------------------------ */
/*  Moon Phases  --  challenge graders (pure; no DOM)                  */
/*                                                                     */
/*  Lives outside main.ts because main.ts touches the DOM at module    */
/*  scope, so nothing defined there can be unit-tested.                */
/* ------------------------------------------------------------------ */

import {
  MOON_RADIUS,
  ORBITAL_CENTER,
  ORBITAL_RADIUS,
  computeOrbitalPosition,
  formatFraction,
  normalizeAngle
} from "./logic";

/** The slice of MoonPhasesModel the quarter graders read (injected, as logic.ts does). */
export interface QuarterModel {
  illuminationFractionFromPhaseAngleDeg: (angleDeg: number) => number;
  waxingWaningFromPhaseAngleDeg: (angleDeg: number) => string;
}

export interface ChallengeGrade {
  correct: boolean;
  close: boolean;
  message: string;
}

// ---- Quarter phases ------------------------------------------------

/**
 * Convention: alpha = 0 is Full, 90 is Third Quarter (waning), 180 is New,
 * 270 is First Quarter (waxing). The illuminated fraction is even about
 * alpha = 180, so it is 0.5 at BOTH quarters; only the waxing/waning sense
 * (owned by @cosmic/physics) tells them apart. The fraction band stays as a
 * conjunct because "waxing" alone also holds at alpha = 200, where f = 0.03.
 */
export function gradeQuarterChallenge(
  which: "first" | "third",
  angleDeg: number,
  model: QuarterModel
): ChallengeGrade {
  const illum = model.illuminationFractionFromPhaseAngleDeg(angleDeg);
  if (![angleDeg, illum].every(Number.isFinite)) {
    return { correct: false, close: false, message: "No valid state yet." };
  }
  const wantSense = which === "first" ? "Waxing" : "Waning";
  const rightSense = model.waxingWaningFromPhaseAngleDeg(angleDeg) === wantSense;
  const diff = Math.abs(illum - 0.5);

  if (diff <= 0.03 && rightSense) {
    return { correct: true, close: false, message: `$f \\approx ${formatFraction(illum)}$.` };
  }
  if (diff <= 0.03) {
    return {
      correct: false,
      close: true,
      message:
        which === "first"
          ? "That is Third Quarter: half lit, but waning. First Quarter is the waxing half, near $\\alpha = 270^{\\circ}$."
          : "That is First Quarter: half lit, but waxing. Third Quarter is the waning half, near $\\alpha = 90^{\\circ}$."
    };
  }
  if (diff <= 0.08 && rightSense) {
    return { correct: false, close: true, message: `Close: $f \\approx ${formatFraction(illum)}$.` };
  }
  return {
    correct: false,
    close: false,
    message:
      which === "first"
        ? "Move toward the waxing quarter phase (50% lit)."
        : "Move toward the waning quarter phase (50% lit)."
  };
}

// ---- Earth's shadow ------------------------------------------------

/**
 * The drawn umbra, in SVG user units (index.html `#umbra-cone`). The grader and the
 * drawing both read these, so the test "is the Moon in the cone?" cannot drift from
 * what the student sees. Schematic: the real umbra converges; this one diverges.
 */
export const UMBRA_APEX_X = 225;
export const UMBRA_TIP_X = 380;
export const UMBRA_HALF_WIDTH_AT_TIP = 15;

/** The `d` attribute of `#umbra-cone`. */
export function umbraConePath(): string {
  const cy = ORBITAL_CENTER.y;
  return `M ${UMBRA_APEX_X} ${cy} L ${UMBRA_TIP_X} ${cy - UMBRA_HALF_WIDTH_AT_TIP} L ${UMBRA_TIP_X} ${cy + UMBRA_HALF_WIDTH_AT_TIP} Z`;
}

/** Does the drawn Moon disk overlap the drawn umbra? (about |alpha| <= 11 degrees) */
export function moonTouchesDrawnUmbra(angleDeg: number): boolean {
  const { x, y } = computeOrbitalPosition(normalizeAngle(angleDeg), ORBITAL_CENTER, ORBITAL_RADIUS);
  if (x <= UMBRA_APEX_X) return false;
  const halfWidth =
    (UMBRA_HALF_WIDTH_AT_TIP * (x - UMBRA_APEX_X)) / (UMBRA_TIP_X - UMBRA_APEX_X);
  return Math.abs(y - ORBITAL_CENTER.y) <= halfWidth + MOON_RADIUS;
}

// Real scales behind the message: R_umbra = R_E - (R_sun - R_E) d_moon/d_sun = 4607 km at
// the Moon, i.e. atan(4607/3.844e5) = 0.69 deg; the Moon's own angular radius is 0.26 deg,
// so a partial umbral eclipse needs the Moon within 0.95 deg of the antisolar point.
const SHADOW_YES =
  "On this flat, not-to-scale drawing, yes. In reality the umbra is only $0.69^{\\circ}$ in angular radius at the Moon's distance, so the Moon must lie within about $0.95^{\\circ}$ of the antisolar point, and also near an orbital node: the lunar orbit is tilted $5.1^{\\circ}$ to the ecliptic, which this 2-D model cannot show. That node condition is why lunar eclipses happen about twice a year, not at every Full Moon.";

export function gradeShadowChallenge(state: {
  angleDeg: number;
  showShadow: boolean;
}): ChallengeGrade {
  if (!state.showShadow) {
    return {
      correct: false,
      close: false,
      message: "Turn on the shadow toggle first to see the cone."
    };
  }
  const inShadow = moonTouchesDrawnUmbra(Number(state.angleDeg));
  return {
    correct: inShadow,
    close: false,
    message: inShadow ? SHADOW_YES : "Move the Moon into the shadow cone (near Full Moon)."
  };
}
