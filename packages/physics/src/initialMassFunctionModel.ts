/**
 * Stellar initial mass functions.
 *
 * Pure mathematics: how many stars of each mass a law predicts, and how to draw one.
 * Nothing here knows where a star sits, what colour it is, or how large it renders.
 *
 * Ported from the novascope package in the personal-site repo, which validates both laws
 * against a progenax fixture. See docs/reviews/2026-09-04-novascope-port-survey.md.
 *
 * Units: masses in solar masses throughout.
 *
 * Both laws expose the same pair of operations, and the pairing is the point:
 *   - `...Mass(u, …)`         draws a mass from a uniform u, by inverse CDF
 *   - `...MassFraction(a, b)` gives the fraction of stars the law puts in [a, b]
 * The second is the analytic curve a sampled histogram is overlaid on, so a demo can show
 * the draw and the law it came from as independent computations that must agree.
 */

/**
 * The hydrogen-burning minimum mass. Below this an object never reaches core temperatures
 * sufficient for sustained hydrogen fusion, so it is not a star.
 *
 * A theoretical threshold rather than a defined constant: it depends weakly on
 * composition, and 0.08 is the standard round figure at solar abundance.
 */
export const HYDROGEN_BURNING_MIN_MSUN = 0.08;

/**
 * Maschberger (2013) Table 1's fiducial upper limit, m_u = 150 M_sun.
 *
 * The limits are needed only for the normalization, so this is a convention rather than a
 * change to the law's shape — but it is the paper's own convention.
 */
export const IMF_MAX_MSUN = 150;

/* ── Maschberger (2013) ───────────────────────────────────────────────────────
 * A single smooth formula bridging the low-mass turnover and the high-mass power-law
 * tail. No piecewise break, and an exact analytic quantile, so sampling is one
 * closed-form evaluation:
 *
 *   pdf(m) proportional to (m/mu)^(-alpha) * [1 + (m/mu)^(1-alpha)]^(-beta)
 *   primitive P(m) = mu / [(1-beta)(1-alpha)] * [1 + (m/mu)^(1-alpha)]^(1-beta)
 *
 * Source: Maschberger, T. (2013), MNRAS 429, 1725, Eq. (5); Table 1 canonical
 * single-star parameters mu = 0.2 Msun, beta = 1.4.
 *
 * The canonical high-mass slope is alpha = 2.3 — the Kroupa/Chabrier value, NOT
 * Salpeter's 2.35. */

/** Scale parameter [Msun]. Maschberger (2013) Table 1. */
export const MASCHBERGER_MU = 0.2;
/** Low-mass turnover exponent. Maschberger (2013) Table 1. */
export const MASCHBERGER_BETA = 1.4;
/** Canonical high-mass slope shared by Kroupa (2001) and Maschberger (2013). */
export const CANONICAL_HIGH_MASS_SLOPE = 2.3;

export interface MaschbergerParams {
  /** Lower mass limit [Msun]. */
  minMassMsun: number;
  /** Upper mass limit [Msun]. */
  maxMassMsun: number;
  /** High-mass slope alpha. */
  alphaHigh: number;
  muMsun?: number;
  beta?: number;
}

function maschbergerPrimitive(
  massMsun: number,
  alpha: number,
  mu: number,
  beta: number
): number {
  const u = (massMsun / mu) ** (1 - alpha);
  const coefficient = mu / ((1 - beta) * (1 - alpha));
  return coefficient * (1 + u) ** (1 - beta);
}

/** Inverse-CDF draw of one mass [Msun]. Exact, analytic, one evaluation. */
export function maschbergerMassMsun(uniform: number, params: MaschbergerParams): number {
  const mu = params.muMsun ?? MASCHBERGER_MU;
  const beta = params.beta ?? MASCHBERGER_BETA;
  const { alphaHigh: alpha, minMassMsun, maxMassMsun } = params;
  const pMin = maschbergerPrimitive(minMassMsun, alpha, mu, beta);
  const pMax = maschbergerPrimitive(maxMassMsun, alpha, mu, beta);
  const pTarget = pMin + uniform * (pMax - pMin);
  const coefficient = mu / ((1 - beta) * (1 - alpha));
  const onePlusU = (pTarget / coefficient) ** (1 / (1 - beta));
  const mass = mu * (onePlusU - 1) ** (1 / (1 - alpha));
  return Math.min(maxMassMsun, Math.max(minMassMsun, mass));
}

/** Fraction of stars the normalized law places in [loMsun, hiMsun]. */
export function maschbergerMassFraction(
  loMsun: number,
  hiMsun: number,
  params: MaschbergerParams
): number {
  const mu = params.muMsun ?? MASCHBERGER_MU;
  const beta = params.beta ?? MASCHBERGER_BETA;
  const { alphaHigh: alpha, minMassMsun, maxMassMsun } = params;
  const a = Math.max(loMsun, minMassMsun);
  const b = Math.min(hiMsun, maxMassMsun);
  if (b <= a) return 0;
  const norm =
    maschbergerPrimitive(maxMassMsun, alpha, mu, beta) -
    maschbergerPrimitive(minMassMsun, alpha, mu, beta);
  return (
    (maschbergerPrimitive(b, alpha, mu, beta) - maschbergerPrimitive(a, alpha, mu, beta)) /
    norm
  );
}

/* ── Kroupa (2001) ────────────────────────────────────────────────────────────
 * Broken power law dN/dm proportional to m^(-alpha) (Kroupa 2001, MNRAS 322, 231):
 *   alpha = 1.3 for 0.08 <= m/Msun < 0.5
 *   alpha = 2.3 for 0.5  <= m/Msun
 * Sampled over [min, max] by inverse CDF of the piecewise law, with amplitudes chosen so
 * the two segments join continuously at the 0.5 Msun break. */

/** Mass [Msun] where Kroupa's slope changes. */
export const KROUPA_BREAK_MSUN = 0.5;
/** Low-mass slope below the break. Kroupa (2001). */
export const KROUPA_ALPHA_LOW = 1.3;

export interface KroupaSegment {
  loMsun: number;
  hiMsun: number;
  alpha: number;
  /** Continuity amplitude A in xi = A * m^(-alpha). */
  amplitude: number;
  /** Integral of xi over [lo, hi]. */
  weight: number;
  /** Cumulative weight through this segment, normalized to 1 across all segments. */
  cumulative: number;
}

function segmentIntegral(alpha: number, amplitude: number, a: number, b: number): number {
  if (Math.abs(1 - alpha) < 1e-9) return amplitude * Math.log(b / a);
  const p = 1 - alpha;
  return (amplitude * (b ** p - a ** p)) / p;
}

/**
 * Build the piecewise Kroupa CDF over [min, max]. `alphaHigh` is the knob a demo varies to
 * make a cluster top- or bottom-heavy; the low-mass slope stays Kroupa's 1.3.
 */
export function buildKroupaSegments(
  minMassMsun: number,
  maxMassMsun: number,
  alphaHigh: number = CANONICAL_HIGH_MASS_SLOPE
): KroupaSegment[] {
  const amplitudeLow = 1;
  const amplitudeHigh = amplitudeLow * KROUPA_BREAK_MSUN ** (alphaHigh - KROUPA_ALPHA_LOW);

  const raw: Array<Omit<KroupaSegment, "weight" | "cumulative">> = [];
  if (minMassMsun < KROUPA_BREAK_MSUN) {
    raw.push({
      loMsun: minMassMsun,
      hiMsun: Math.min(KROUPA_BREAK_MSUN, maxMassMsun),
      alpha: KROUPA_ALPHA_LOW,
      amplitude: amplitudeLow
    });
  }
  if (maxMassMsun > KROUPA_BREAK_MSUN) {
    raw.push({
      loMsun: Math.max(KROUPA_BREAK_MSUN, minMassMsun),
      hiMsun: maxMassMsun,
      alpha: alphaHigh,
      amplitude: amplitudeHigh
    });
  }

  const segments: KroupaSegment[] = [];
  let cumulative = 0;
  for (const s of raw) {
    const weight = segmentIntegral(s.alpha, s.amplitude, s.loMsun, s.hiMsun);
    cumulative += weight;
    segments.push({ ...s, weight, cumulative });
  }
  const total = cumulative || 1;
  for (const s of segments) s.cumulative /= total;
  return segments;
}

/** Inverse-CDF draw of one mass [Msun] from prebuilt Kroupa segments. */
export function kroupaMassMsun(uniform: number, segments: KroupaSegment[]): number {
  let previousCumulative = 0;
  for (let i = 0; i < segments.length; i += 1) {
    const s = segments[i];
    if (uniform <= s.cumulative || i === segments.length - 1) {
      const withinSegment = (uniform - previousCumulative) / (s.cumulative - previousCumulative);
      const target = withinSegment * s.weight;
      const p = 1 - s.alpha;
      if (Math.abs(p) < 1e-9) return s.loMsun * Math.exp(target / s.amplitude);
      const base = s.loMsun ** p + (target * p) / s.amplitude;
      return base ** (1 / p);
    }
    previousCumulative = s.cumulative;
  }
  return segments[segments.length - 1].hiMsun;
}

/** Fraction of stars the normalized Kroupa law places in [loMsun, hiMsun]. */
export function kroupaMassFraction(
  loMsun: number,
  hiMsun: number,
  segments: KroupaSegment[]
): number {
  let accumulated = 0;
  let total = 0;
  for (const s of segments) {
    total += s.weight;
    const a = Math.max(loMsun, s.loMsun);
    const b = Math.min(hiMsun, s.hiMsun);
    if (b > a) accumulated += segmentIntegral(s.alpha, s.amplitude, a, b);
  }
  return total > 0 ? accumulated / total : 0;
}

/* ── Environment-dependent high-mass slope ────────────────────────────────────
 * The IMF is not universal: in dense, metal-poor clusters the high-mass slope flattens
 * (top-heavy). Jerabkova+2018 Eq. 6 with the 8-pi half-mass-density convention of
 * Marks+2012, assuming a star-formation efficiency of 0.33:
 *
 *   x      = -0.14*[Fe/H] + 0.6039*log10(M_ecl / 1e6) + 0.2161
 *   alpha3 = 2.3               (x <  -0.87, canonical)
 *          = -0.41*x + 1.94    (x >= -0.87, top-heavy), clipped to [0.5, 2.3]
 *
 * Sources: Jerabkova et al. (2018), A&A 620, A39; Marks et al. (2012), MNRAS 422, 2246
 * (with the 2014 erratum). */
export function highMassSlopeFromEnvironment(
  metallicityFeH: number,
  clusterMassMsun: number
): number {
  const x =
    -0.14 * metallicityFeH + 0.6039 * Math.log10(clusterMassMsun / 1e6) + 0.2161;
  const alpha3 = x < -0.87 ? CANONICAL_HIGH_MASS_SLOPE : -0.41 * x + 1.94;
  return Math.min(CANONICAL_HIGH_MASS_SLOPE, Math.max(0.5, alpha3));
}

export const InitialMassFunctionModel = {
  HYDROGEN_BURNING_MIN_MSUN,
  IMF_MAX_MSUN,
  MASCHBERGER_MU,
  MASCHBERGER_BETA,
  CANONICAL_HIGH_MASS_SLOPE,
  KROUPA_BREAK_MSUN,
  KROUPA_ALPHA_LOW,
  maschbergerMassMsun,
  maschbergerMassFraction,
  buildKroupaSegments,
  kroupaMassMsun,
  kroupaMassFraction,
  highMassSlopeFromEnvironment
} as const;
