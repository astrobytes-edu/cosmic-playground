import { findRootBisection, findRootNewton } from "@cosmic/math";
const TAU = 2 * Math.PI;

function isFiniteEccentricity(e: number): boolean {
  return Number.isFinite(e) && e >= 0 && e < 1;
}

function wrap0ToTauRad(thetaRad: number): number {
  const wrapped = ((thetaRad % TAU) + TAU) % TAU;
  return wrapped === TAU ? 0 : wrapped;
}

/**
 * Deterministic Kepler solver for elliptic orbits (0 <= e < 1).
 *
 * Contract (matches retrograde-motion design spec):
 * - Newton iteration with E0 = M for e<=0.8, else E0 = π
 * - Stop when |ΔE| < 1e-12 rad or after 15 iterations
 * - If Newton doesn't converge, fall back to bisection on E ∈ [0, 2π)
 *
 * Notes:
 * - Accepts any finite mean anomaly; preserves 2π "turns" so callers can keep
 *   continuous time series without discontinuities at 0/2π.
 */
export function solveEccentricAnomalyRadDeterministic(args: {
  meanAnomalyRad: number;
  eccentricity: number;
  toleranceRad?: number;
  maxIterations?: number;
}): number {
  const e = args.eccentricity;
  if (!isFiniteEccentricity(e)) return Number.NaN;
  if (!Number.isFinite(args.meanAnomalyRad)) return Number.NaN;

  const tol = Number.isFinite(args.toleranceRad) ? args.toleranceRad! : 1e-12;
  const maxIt = Number.isFinite(args.maxIterations) ? Math.max(0, args.maxIterations!) : 15;

  const turns = Math.floor(args.meanAnomalyRad / TAU);
  const MWrapped = args.meanAnomalyRad - turns * TAU;
  const M = wrap0ToTauRad(MWrapped);

  if (e === 0) return M + turns * TAU;

  const residual = (eccentricAnomalyRad: number) => eccentricAnomalyRad - e * Math.sin(eccentricAnomalyRad) - M;
  const derivative = (eccentricAnomalyRad: number) => 1 - e * Math.cos(eccentricAnomalyRad);

  try {
    const candidate = findRootNewton(residual, derivative, e <= 0.8 ? M : Math.PI, tol, maxIt);
    if (Number.isFinite(candidate) && Math.abs(residual(candidate)) < tol) {
      return wrap0ToTauRad(candidate) + turns * TAU;
    }
  } catch {
    // Fall through to deterministic bisection.
  }

  // Deterministic bisection fallback on [0, 2π).
  const fLo = residual(0); // = -M
  const fHi = residual(TAU); // = 2π - M

  if (Math.abs(fLo) < tol) return turns * TAU;
  if (Math.abs(fHi) < tol) return turns * TAU;

  // In the elliptic case (0<=e<1), f is monotonic increasing, so the root is bracketed.
  if (!(fLo < 0 && fHi > 0)) return Number.NaN;

  try {
    const root = findRootBisection(residual, 0, TAU, tol, 200);
    return wrap0ToTauRad(root) + turns * TAU;
  } catch {
    return Number.NaN;
  }
}
