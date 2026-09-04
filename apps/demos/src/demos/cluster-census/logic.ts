/**
 * Pure helpers for the cluster census instrument.
 *
 * Everything here is DOM-free and deterministic so it can be tested directly. `main.ts`
 * is thin wiring: read controls, call the physics, call these, draw.
 */

export type ImfLaw = "maschberger" | "kroupa";
export type ProfileKind = "plummer" | "eff";

/* ── Control mappings ─────────────────────────────────────────────────────────
 * Star count and age both span several decades, so their sliders are logarithmic.
 * The slider itself stays an integer 0..1000, which is what a range input handles
 * cleanly; these two functions are the only place that mapping exists. */

export const STAR_COUNT_MIN = 50;
export const STAR_COUNT_MAX = 20_000;
export const SLIDER_STEPS = 1000;

export function sliderToStarCount(slider: number): number {
  const t = clamp(slider, 0, SLIDER_STEPS) / SLIDER_STEPS;
  const value = STAR_COUNT_MIN * (STAR_COUNT_MAX / STAR_COUNT_MIN) ** t;
  return Math.round(value);
}

export function starCountToSlider(count: number): number {
  const clamped = clamp(count, STAR_COUNT_MIN, STAR_COUNT_MAX);
  const t = Math.log(clamped / STAR_COUNT_MIN) / Math.log(STAR_COUNT_MAX / STAR_COUNT_MIN);
  return Math.round(t * SLIDER_STEPS);
}

/** Age runs from a newborn cluster to older than the Galaxy's disc. */
export const AGE_MIN_MYR = 1;
export const AGE_MAX_MYR = 13_000;

export function sliderToAgeMyr(slider: number): number {
  const t = clamp(slider, 0, SLIDER_STEPS) / SLIDER_STEPS;
  // Zero is a real, useful setting (a cluster that has not aged at all), and a log
  // mapping cannot reach it, so the first step of the slider is reserved for it.
  if (slider <= 0) return 0;
  return AGE_MIN_MYR * (AGE_MAX_MYR / AGE_MIN_MYR) ** t;
}

export function ageMyrToSlider(ageMyr: number): number {
  if (ageMyr <= 0) return 0;
  const clamped = clamp(ageMyr, AGE_MIN_MYR, AGE_MAX_MYR);
  const t = Math.log(clamped / AGE_MIN_MYR) / Math.log(AGE_MAX_MYR / AGE_MIN_MYR);
  return Math.max(1, Math.round(t * SLIDER_STEPS));
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/* ── Mass histogram ──────────────────────────────────────────────────────────
 * The IMF spans more than three decades, so the histogram is binned in log mass.
 * Equal-width log bins are also what makes the power-law tail render as a straight
 * line, which is the shape students are being asked to see. */

export interface HistogramBins {
  /** binCount + 1 edges, in solar masses, geometrically spaced. */
  edgesMsun: number[];
  /** Geometric centre of each bin, for plotting. */
  centresMsun: number[];
}

export function buildLogMassBins(
  minMassMsun: number,
  maxMassMsun: number,
  binCount: number
): HistogramBins {
  const edgesMsun: number[] = [];
  const ratio = maxMassMsun / minMassMsun;
  for (let i = 0; i <= binCount; i += 1) {
    edgesMsun.push(minMassMsun * ratio ** (i / binCount));
  }
  const centresMsun: number[] = [];
  for (let i = 0; i < binCount; i += 1) {
    centresMsun.push(Math.sqrt(edgesMsun[i] * edgesMsun[i + 1]));
  }
  return { edgesMsun, centresMsun };
}

/**
 * Count masses into bins. The final bin is closed on both sides so a star drawn exactly
 * at the upper limit is counted rather than silently dropped.
 */
export function countIntoBins(massesMsun: readonly number[], edgesMsun: readonly number[]): number[] {
  const counts = new Array(Math.max(0, edgesMsun.length - 1)).fill(0);
  if (counts.length === 0) return counts;
  const last = counts.length - 1;
  for (const mass of massesMsun) {
    if (mass < edgesMsun[0] || mass > edgesMsun[edgesMsun.length - 1]) continue;
    // Binary search for the bin whose lower edge is the greatest one <= mass.
    let lo = 0;
    let hi = last;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (edgesMsun[mid] <= mass) lo = mid;
      else hi = mid - 1;
    }
    counts[Math.min(lo, last)] += 1;
  }
  return counts;
}

/**
 * Expected counts per bin from an analytic mass fraction, scaled to the sample size.
 *
 * This is the curve the sampled bars are compared against. The two are computed by
 * genuinely different routes -- one inverts the law's primitive, the other differences it
 * -- so agreement is evidence rather than tautology.
 */
export function expectedCounts(
  edgesMsun: readonly number[],
  totalStars: number,
  massFraction: (loMsun: number, hiMsun: number) => number
): number[] {
  const expected: number[] = [];
  for (let i = 0; i < edgesMsun.length - 1; i += 1) {
    expected.push(totalStars * massFraction(edgesMsun[i], edgesMsun[i + 1]));
  }
  return expected;
}

/* ── Derived cluster quantities ──────────────────────────────────────────────*/

export interface CensusStar {
  massMsun: number;
  temperatureK: number;
  luminosityLsun: number;
  phase: string;
  radiusPc: number;
  positionPc: { x: number; y: number; z: number };
}

/**
 * Mass of the heaviest star still on the main sequence: the turnoff.
 *
 * Returns null for a cluster with nothing left shining, which is the honest answer rather
 * than zero -- a turnoff mass of zero would plot as a real point.
 */
export function turnoffMassMsun(stars: readonly CensusStar[]): number | null {
  let heaviest: number | null = null;
  for (const star of stars) {
    if (star.phase !== "main-sequence") continue;
    if (heaviest === null || star.massMsun > heaviest) heaviest = star.massMsun;
  }
  return heaviest;
}

/** Radius enclosing a given fraction of the stars by number [pc]. */
export function radiusEnclosingFractionPc(
  stars: readonly CensusStar[],
  fraction: number
): number {
  if (stars.length === 0) return 0;
  const sorted = stars.map((s) => s.radiusPc).sort((a, b) => a - b);
  const index = clamp(Math.floor(fraction * sorted.length), 0, sorted.length - 1);
  return sorted[index];
}

/* ── Rendering helpers ───────────────────────────────────────────────────────*/

/**
 * Approximate sRGB for a blackbody of temperature T.
 *
 * A display fit (Helland's piecewise approximation to the Planckian locus), not physics:
 * it exists so a hot star looks blue and a cool star looks red at a glance. Anything that
 * needs real colour should integrate a spectrum through filters instead.
 */
export function temperatureToRgb(temperatureK: number): [number, number, number] {
  const t = clamp(temperatureK, 1000, 40000) / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    r = 329.698727446 * (t - 60) ** -0.1332047592;
    g = 288.1221695283 * (t - 60) ** -0.0755148492;
  }
  if (t >= 66) b = 255;
  else if (t <= 19) b = 0;
  else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const channel = (value: number) => Math.round(clamp(value, 0, 255));
  return [channel(r), channel(g), channel(b)];
}

export function rgbToCss(rgb: readonly [number, number, number], alpha = 1): string {
  return alpha >= 1
    ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
    : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/**
 * On-screen radius for a star of a given mass.
 *
 * A cube-root law, so the dot's AREA is not proportional to mass and a 100 Msun star does
 * not swamp the frame. Deliberately not a physical stellar radius: this is a legibility
 * scale, and the demo says so.
 */
export function massToDotRadiusPx(massMsun: number, scale = 1): number {
  return scale * (0.9 + 1.9 * Math.cbrt(clamp(massMsun, 0.01, 200)));
}

export interface AxisRange {
  min: number;
  max: number;
}

/** Map a value onto a pixel axis, with `invert` for axes that run right to left. */
export function projectToPixels(
  value: number,
  range: AxisRange,
  pixelLow: number,
  pixelHigh: number,
  invert = false
): number {
  const span = range.max - range.min;
  const t = span === 0 ? 0 : (value - range.min) / span;
  const clamped = clamp(t, 0, 1);
  return invert ? pixelHigh - clamped * (pixelHigh - pixelLow) : pixelLow + clamped * (pixelHigh - pixelLow);
}

/* ── Formatting ──────────────────────────────────────────────────────────────*/

export function formatMassMsun(massMsun: number): string {
  if (!Number.isFinite(massMsun)) return "--";
  if (massMsun >= 100) return massMsun.toFixed(0);
  if (massMsun >= 10) return massMsun.toFixed(1);
  return massMsun.toFixed(2);
}

export function formatCount(count: number): string {
  return Number.isFinite(count) ? Math.round(count).toLocaleString("en-US") : "--";
}

export interface AgeReadout {
  value: string;
  unit: string;
}

/** Ages span four decades, so the unit switches rather than the number growing. */
export function formatAge(ageMyr: number): AgeReadout {
  if (!Number.isFinite(ageMyr) || ageMyr < 0) return { value: "--", unit: "Myr" };
  if (ageMyr === 0) return { value: "0", unit: "Myr" };
  if (ageMyr >= 1000) return { value: (ageMyr / 1000).toFixed(1), unit: "Gyr" };
  if (ageMyr >= 10) return { value: ageMyr.toFixed(0), unit: "Myr" };
  return { value: ageMyr.toFixed(1), unit: "Myr" };
}

export function formatRadiusPc(radiusPc: number): string {
  if (!Number.isFinite(radiusPc)) return "--";
  return radiusPc >= 10 ? radiusPc.toFixed(1) : radiusPc.toFixed(2);
}

/**
 * One sentence naming what is currently on screen, for the live region.
 *
 * A screen-reader user gets the census, not the picture, so this has to carry the numbers
 * the picture is showing rather than describing the picture.
 */
export function censusAnnouncement(input: {
  starCount: number;
  law: ImfLaw;
  ageMyr: number;
  mostMassiveMsun: number;
  turnoffMsun: number | null;
  remnantCount: number;
  giantCount: number;
}): string {
  const lawName = input.law === "kroupa" ? "Kroupa" : "Maschberger";
  const age = formatAge(input.ageMyr);
  // Mirrors the turnoff readout: at age zero the turnoff is not a measurement, it is just
  // the heaviest star wearing a different label, and saying so twice helps nobody.
  const turnoffHasHappened = input.ageMyr > 0 && input.remnantCount + input.giantCount > 0;
  const turnoff =
    input.turnoffMsun === null
      ? "no stars remain on the main sequence"
      : turnoffHasHappened
        ? `turnoff at ${formatMassMsun(input.turnoffMsun)} solar masses`
        : "no star has left the main sequence yet";
  return (
    `${formatCount(input.starCount)} stars drawn from the ${lawName} mass function ` +
    `at age ${age.value} ${age.unit}. Heaviest star ${formatMassMsun(input.mostMassiveMsun)} ` +
    `solar masses, ${turnoff}, ${formatCount(input.giantCount)} giants, ` +
    `${formatCount(input.remnantCount)} remnants.`
  );
}

/* ── Canvas typography ───────────────────────────────────────────────────────
 * Canvas 2D cannot render KaTeX, so this is the one place the project allows real
 * Unicode for maths. The source stays ASCII because `validate-math-formatting` scans
 * raw text: the symbols are written as escapes and only become themselves at runtime. */

const SUPERSCRIPT_DIGITS = [
  "\u2070",
  "\u00b9",
  "\u00b2",
  "\u00b3",
  "\u2074",
  "\u2075",
  "\u2076",
  "\u2077",
  "\u2078",
  "\u2079"
] as const;

const SUPERSCRIPT_MINUS = "\u207b";

/** Solar-mass and solar-luminosity symbols, for axis titles. */
export const MSUN_SYMBOL = "M\u2609";
export const LSUN_SYMBOL = "L\u2609";

/** An integer rendered in Unicode superscript digits: -4 becomes a raised minus four. */
export function toSuperscript(value: number): string {
  const rounded = Math.trunc(value);
  const digits = Math.abs(rounded)
    .toString()
    .split("")
    .map((d) => SUPERSCRIPT_DIGITS[Number(d)])
    .join("");
  return rounded < 0 ? `${SUPERSCRIPT_MINUS}${digits}` : digits;
}

/** A decade tick label: 10 to the given power, as a reader expects to see it. */
export function powerOfTenLabel(exponent: number): string {
  return `10${toSuperscript(exponent)}`;
}

/**
 * Temperature tick label [K].
 *
 * Mixing "40k" with "5000" on one axis makes the reader do unit arithmetic mid-glance,
 * so every tick uses the same form.
 */
export function temperatureTickLabel(temperatureK: number): string {
  if (temperatureK < 1000) return String(temperatureK);
  const thousands = temperatureK / 1000;
  // 2500 and 3000 both round to "3k", and an axis that prints the same label twice in a
  // row is worse than no label at all.
  return Number.isInteger(thousands) ? `${thousands}k` : `${thousands.toFixed(1)}k`;
}

/**
 * Axis font size [px] for a panel of this width.
 *
 * A fixed 11px is legible in a 500px panel and vanishes in a 1200px one. Tying the size
 * to the panel keeps the plot readable on a lecture projector, which is where these are
 * actually used.
 */
export function axisFontPx(panelWidthPx: number): number {
  return Math.round(Math.min(16, Math.max(11, panelWidthPx / 42)));
}

/* ── Hit testing ─────────────────────────────────────────────────────────────
 * A cluster panel and an HR diagram show the SAME stars in two spaces, so pointing at a
 * star in one has to light it up in the other. That link is the whole reason both panels
 * are on screen at once, and it only works if picking is exact -- which means picking has
 * to use the projection the renderer just used, not a re-derived one. */

export interface PickCandidate {
  id: number;
  x: number;
  y: number;
  radiusPx: number;
}

/**
 * The drawn star nearest the pointer, or null if the pointer is over empty sky.
 *
 * Ties break toward the SMALLER dot: a massive star's halo can cover a dozen dwarfs, and
 * a picker that always returns the big one makes the faint stars unselectable.
 */
export function pickNearest(
  candidates: readonly PickCandidate[],
  pointerX: number,
  pointerY: number,
  slopPx = 6
): number | null {
  let bestId: number | null = null;
  let bestDistance = Infinity;
  let bestRadius = Infinity;
  for (const candidate of candidates) {
    const distance = Math.hypot(candidate.x - pointerX, candidate.y - pointerY);
    // Reach scales with the drawn dot, so a big star stays clickable anywhere on its
    // disc while a 2px dwarf is still catchable a few pixels off.
    if (distance > candidate.radiusPx + slopPx) continue;
    // Rank on distance to the CENTRE, not on distance minus radius. The latter scores a
    // big star better simply for being big, so a dwarf drawn on top of a supergiant's
    // disc could never be selected however precisely you pointed at it.
    if (
      distance < bestDistance - 0.001 ||
      (Math.abs(distance - bestDistance) <= 0.001 && candidate.radiusPx < bestRadius)
    ) {
      bestDistance = distance;
      bestRadius = candidate.radiusPx;
      bestId = candidate.id;
    }
  }
  return bestId;
}

/** Luminosity as a base-10 log, or "--" when the star has no luminosity to report. */
export function formatLogLuminosity(luminosityLsun: number): string {
  return luminosityLsun > 0 ? Math.log10(luminosityLsun).toFixed(2) : "--";
}

/** Stellar radius [Rsun], with the precision switching where the numbers get large. */
export function formatStellarRadius(radiusRsun: number): string {
  if (!(radiusRsun > 0)) return "--";
  if (radiusRsun >= 100) return String(Math.round(radiusRsun));
  if (radiusRsun >= 10) return radiusRsun.toFixed(1);
  return radiusRsun.toFixed(2);
}

/* ── Derived high-mass slope ─────────────────────────────────────────────────*/

/** Slider integer to metallicity [Fe/H]. The slider carries hundredths of a dex. */
export function sliderToFeH(sliderValue: number): number {
  return sliderValue / 100;
}

/** Slider integer to log10 of the cluster mass [Msun]. Hundredths of a dex again. */
export function sliderToLogClusterMass(sliderValue: number): number {
  return sliderValue / 100;
}

export function fehToSlider(feH: number): number {
  return Math.round(feH * 100);
}

export function logClusterMassToSlider(logMass: number): number {
  return Math.round(logMass * 100);
}

/**
 * One line saying what the environment did to the slope.
 *
 * The whole point of the derived mode is that the slope stops being arbitrary, so the
 * reader needs to be told which way it moved and why -- otherwise the number just changes
 * on its own.
 */
export function slopeVerdict(alphaHigh: number, canonical: number): string {
  const gap = canonical - alphaHigh;
  if (gap < 0.02) return "Canonical slope: this environment is nothing special.";
  if (gap < 0.4) return "Slightly top-heavy: a few more massive stars than canonical.";
  return "Top-heavy: markedly more massive stars than a canonical cluster.";
}
