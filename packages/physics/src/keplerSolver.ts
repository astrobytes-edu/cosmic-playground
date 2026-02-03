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

  // Newton iteration.
  let E = e <= 0.8 ? M : Math.PI;
  let converged = false;
  for (let i = 0; i < maxIt; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    if (!Number.isFinite(f) || !Number.isFinite(fp) || fp === 0) break;
    const dE = -f / fp;
    E += dE;
    if (Math.abs(dE) < tol) {
      converged = true;
      break;
    }
  }

  if (converged && Number.isFinite(E)) return wrap0ToTauRad(E) + turns * TAU;

  // Deterministic bisection fallback on [0, 2π).
  let lo = 0;
  let hi = TAU;
  let fLo = lo - e * Math.sin(lo) - M; // = -M
  let fHi = hi - e * Math.sin(hi) - M; // = 2π - M

  if (Math.abs(fLo) < tol) return lo + turns * TAU;
  if (Math.abs(fHi) < tol) return wrap0ToTauRad(hi) + turns * TAU;

  // In the elliptic case (0<=e<1), f is monotonic increasing, so the root is bracketed.
  if (!(fLo < 0 && fHi > 0)) return Number.NaN;

  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    const fMid = mid - e * Math.sin(mid) - M;
    if (!Number.isFinite(fMid)) return Number.NaN;

    if (Math.abs(fMid) < tol) return mid + turns * TAU;

    if (fMid > 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }

    if (hi - lo < tol) return 0.5 * (lo + hi) + turns * TAU;
  }

  return 0.5 * (lo + hi) + turns * TAU;
}

