/**
 * Pure UI logic for the spectral-lines demo.
 * No DOM access — all functions are testable in isolation.
 */

import type { ExportPayloadV1 } from "@cosmic/runtime";

export type TransitionMode = "emission" | "absorption";
export type ViewTab = "hydrogen" | "elements";
export type SeriesFilter = "all" | 1 | 2 | 3 | 4;
export type MysteryTarget = { element: string; mode: TransitionMode };

export interface SpectrumDomain {
  minNm: number;
  maxNm: number;
  ticksNm: number[];
  bandLabels: Array<{ label: string; wavelengthNm: number }>;
}

export interface ElementLineLike {
  wavelengthNm: number;
  relativeIntensity: number;
  label?: string;
}

export function isMysteryCopyLocked(args: {
  viewTab: ViewTab;
  mysteryActive: boolean;
  mysteryRevealed: boolean;
}): boolean {
  return args.viewTab === "elements" && args.mysteryActive && !args.mysteryRevealed;
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickMysteryTarget(args: {
  targets: MysteryTarget[];
  random: () => number;
  previous?: MysteryTarget | null;
}): MysteryTarget {
  if (args.targets.length === 0) {
    throw new Error("pickMysteryTarget requires at least one target.");
  }

  const rawIndex = Math.floor(args.random() * args.targets.length);
  let index = clamp(rawIndex, 0, args.targets.length - 1);
  const previous = args.previous;
  if (args.targets.length > 1 && previous) {
    const sameAsPrevious = args.targets[index].element === previous.element
      && args.targets[index].mode === previous.mode;
    if (sameAsPrevious) {
      index = (index + 1) % args.targets.length;
    }
  }
  return args.targets[index];
}

// ── Number formatting ───────────────────────────────────────

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function nextSequenceIndex(args: {
  currentIndex: number;
  length: number;
  direction: -1 | 1;
}): number {
  const length = Math.max(1, Math.floor(args.length));
  const currentIndex = clamp(Math.floor(args.currentIndex), 0, length - 1);
  return (currentIndex + args.direction + length) % length;
}

/**
 * Format a number for display: scientific notation for very large/small,
 * fixed-point otherwise. Returns em-dash for non-finite values.
 */
export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

/**
 * Format a frequency for display using SI prefix notation (Hz, kHz, MHz, GHz, THz, PHz).
 * Returns { value, unit } for readout separation.
 */
export function formatFrequencyReadout(hz: number): { value: string; unit: string } {
  if (!Number.isFinite(hz)) return { value: "\u2014", unit: "" };
  if (hz >= 1e15) return { value: (hz / 1e15).toFixed(2), unit: "PHz" };
  if (hz >= 1e14) return { value: (hz / 1e14).toFixed(2), unit: "x10^14 Hz" };
  if (hz >= 1e12) return { value: (hz / 1e12).toFixed(2), unit: "THz" };
  if (hz >= 1e9)  return { value: (hz / 1e9).toFixed(2), unit: "GHz" };
  if (hz >= 1e6)  return { value: (hz / 1e6).toFixed(2), unit: "MHz" };
  return { value: formatNumber(hz, 3), unit: "Hz" };
}

/**
 * Format a wavelength for the readout panel, returning separate value and unit.
 * Picks the most natural unit (nm / um) for readability.
 */
export function formatWavelengthReadout(nm: number): { value: string; unit: string } {
  if (!Number.isFinite(nm)) return { value: "\u2014", unit: "" };
  if (nm >= 1e4) return { value: (nm / 1e3).toFixed(0), unit: "um" };
  if (nm >= 1e3) return { value: (nm / 1e3).toFixed(1), unit: "um" };
  return { value: nm.toFixed(1), unit: "nm" };
}

// ── Wavelength to color ─────────────────────────────────────

/**
 * Map a wavelength (nm) to approximate visible-spectrum RGB string.
 * Uses Dan Bruton's piecewise-linear approximation.
 * Returns "rgb(r,g,b)" for visible wavelengths, or a dim grey for non-visible.
 */
export function wavelengthToRgbString(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380);
    b = 1;
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / (490 - 440);
    b = 1;
  } else if (nm >= 490 && nm < 510) {
    g = 1;
    b = -(nm - 510) / (510 - 490);
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510);
    g = 1;
  } else if (nm >= 580 && nm < 645) {
    r = 1;
    g = -(nm - 645) / (645 - 580);
  } else if (nm >= 645 && nm <= 750) {
    r = 1;
  }
  // Intensity tapering at edges of visible range
  let f = 0;
  if (nm >= 380 && nm < 420) f = 0.3 + 0.7 * (nm - 380) / (420 - 380);
  else if (nm >= 420 && nm <= 700) f = 1;
  else if (nm > 700 && nm <= 750) f = 0.3 + 0.7 * (750 - nm) / (750 - 700);

  if (f === 0) {
    // Non-visible wavelength: use a dim indicator
    if (nm < 380) return "rgb(120, 80, 200)";   // UV: dim violet
    return "rgb(100, 30, 30)";                    // IR: dim red
  }

  return `rgb(${Math.round(r * f * 255)}, ${Math.round(g * f * 255)}, ${Math.round(b * f * 255)})`;
}

/**
 * Determine if a wavelength is in the visible range (380–750 nm).
 */
export function isVisible(nm: number): boolean {
  return nm >= 380 && nm <= 750;
}

// ── Bohr atom display geometry ──────────────────────────────

/**
 * Compute compressed display radius for Bohr orbit n.
 * Physical radii go as n^2, but we compress for visual clarity.
 * Uses r = baseRadius + (n - 1) * step, where step adapts to nMax.
 */
export function compressedOrbitRadius(args: {
  n: number;
  viewSize: number;
  nMax: number;
  padding?: number;
}): number {
  const { n, viewSize, nMax } = args;
  const padding = args.padding ?? 60;
  const maxRadius = (viewSize / 2) - padding;
  const minRadius = 30;
  const step = nMax > 1 ? (maxRadius - minRadius) / (nMax - 1) : 0;
  return minRadius + (n - 1) * step;
}

/**
 * Compute energy-level Y position in the energy diagram SVG.
 * Maps energy from -13.6 eV (bottom, n=1) to ~0 eV (top, ionization).
 * Uses linear mapping of energy values.
 */
export function energyLevelY(args: {
  energyEv: number;
  svgHeight: number;
  topPad?: number;
  bottomPad?: number;
}): number {
  const { energyEv, svgHeight } = args;
  const topPad = args.topPad ?? 30;
  const bottomPad = args.bottomPad ?? 40;
  const plotH = svgHeight - topPad - bottomPad;
  // Map: -13.6 eV -> bottom (topPad + plotH), 0 eV -> top (topPad)
  const eMin = -13.606;
  const eMax = 0;
  const frac = (energyEv - eMin) / (eMax - eMin);
  return topPad + plotH * (1 - frac);
}

// ── Spectrum strip geometry ─────────────────────────────────

/**
 * Default wavelength domain for the spectrum strip (all-series view).
 */
export const SPECTRUM_DOMAIN = { minNm: 50, maxNm: 5000 } as const;

const SERIES_DOMAIN_MAP: Record<"all" | "1" | "2" | "3" | "4", SpectrumDomain> = {
  all: {
    minNm: 50,
    maxNm: 5000,
    ticksNm: [100, 200, 400, 656, 1000, 2000, 4000],
    bandLabels: [
      { label: "UV", wavelengthNm: 150 },
      { label: "Visible", wavelengthNm: 550 },
      { label: "IR", wavelengthNm: 1800 },
    ],
  },
  "1": {
    minNm: 80,
    maxNm: 130,
    ticksNm: [80, 90, 100, 110, 120, 130],
    bandLabels: [{ label: "UV", wavelengthNm: 105 }],
  },
  "2": {
    minNm: 350,
    maxNm: 700,
    ticksNm: [350, 400, 486, 500, 600, 656, 700],
    bandLabels: [{ label: "Visible", wavelengthNm: 540 }],
  },
  "3": {
    minNm: 800,
    maxNm: 1900,
    ticksNm: [800, 1000, 1282, 1500, 1875],
    bandLabels: [{ label: "IR", wavelengthNm: 1400 }],
  },
  "4": {
    minNm: 1400,
    maxNm: 4200,
    ticksNm: [1400, 1800, 2200, 3000, 4051],
    bandLabels: [{ label: "IR", wavelengthNm: 2600 }],
  },
};

function seriesFilterKey(seriesFilter: SeriesFilter): "all" | "1" | "2" | "3" | "4" {
  return seriesFilter === "all" ? "all" : String(seriesFilter) as "1" | "2" | "3" | "4";
}

export function spectrumDomainForSeries(seriesFilter: SeriesFilter): SpectrumDomain {
  const key = seriesFilterKey(seriesFilter);
  const domain = SERIES_DOMAIN_MAP[key];
  return {
    minNm: domain.minNm,
    maxNm: domain.maxNm,
    ticksNm: [...domain.ticksNm],
    bandLabels: domain.bandLabels.map((entry) => ({ ...entry })),
  };
}

/**
 * Convert a wavelength to x-position on a linear spectrum strip.
 * Returns fractional position 0..1.
 */
export function wavelengthToFraction(
  nm: number,
  domain: Pick<SpectrumDomain, "minNm" | "maxNm"> = SPECTRUM_DOMAIN
): number {
  const { minNm, maxNm } = domain;
  return clamp((nm - minNm) / (maxNm - minNm), 0, 1);
}

export function filterHydrogenTransitionsBySeries<T extends { nLower: number }>(args: {
  seriesFilter: SeriesFilter;
  transitions: T[];
}): T[] {
  if (args.seriesFilter === "all") return [...args.transitions];
  return args.transitions.filter((transition) => transition.nLower === args.seriesFilter);
}

export function shouldRenderEmission(args: { mode: TransitionMode; viewTab: ViewTab }): boolean {
  void args.viewTab;
  return args.mode === "emission";
}

export function selectRepresentativeElementLine<T extends ElementLineLike>(lines: T[]): T | undefined {
  if (lines.length === 0) return undefined;
  let best = lines[0];
  for (const line of lines.slice(1)) {
    if (line.relativeIntensity > best.relativeIntensity) {
      best = line;
      continue;
    }
    if (line.relativeIntensity === best.relativeIntensity && line.wavelengthNm < best.wavelengthNm) {
      best = line;
    }
  }
  return best;
}

export function transitionAnnouncement(args: {
  mode: TransitionMode;
  viewTab: ViewTab;
  selectedElement: string;
  nUpper: number;
  nLower: number;
  wavelengthNm: number;
  seriesName: string;
  representativeLineLabel?: string;
}): string {
  const modeLabel = args.mode === "emission" ? "Emission" : "Absorption";
  const wavelength = formatWavelengthReadout(args.wavelengthNm);
  const levelLabel = transitionLabel(args.nUpper, args.nLower);
  if (args.viewTab === "elements") {
    const representativeLabel = args.representativeLineLabel ?? `${args.selectedElement} strongest line`;
    return `${modeLabel}: Element ${args.selectedElement}, Representative line ${representativeLabel}, ${wavelength.value} ${wavelength.unit}.`;
  }
  return `${modeLabel}: ${levelLabel}, ${wavelength.value} ${wavelength.unit} (${args.seriesName} series).`;
}

// ── Transition label formatting ─────────────────────────────

/**
 * Format a transition label like "n = 3 → n = 2".
 */
export function transitionLabel(nUpper: number, nLower: number): string {
  return `n = ${nUpper} \u2192 n = ${nLower}`;
}

function modeLabel(mode: TransitionMode): string {
  return mode === "emission" ? "Emission" : "Absorption";
}

function tabLabel(viewTab: ViewTab): string {
  return viewTab === "hydrogen" ? "Hydrogen" : "Elements";
}

function seriesFilterLabel(seriesFilter: SeriesFilter): string {
  if (seriesFilter === "all") return "All";
  const nameMap: Record<number, string> = {
    1: "Lyman",
    2: "Balmer",
    3: "Paschen",
    4: "Brackett",
  };
  return nameMap[seriesFilter] ?? String(seriesFilter);
}

export function buildSpectralExportPayload(args: {
  timestampIso?: string;
  mode: TransitionMode;
  viewTab: ViewTab;
  selectedElement: string;
  nUpper: number;
  nLower: number;
  seriesFilter: SeriesFilter;
  wavelengthNm: number;
  energyEv: number;
  frequencyHz: number;
  seriesName: string;
  band: string;
  representativeLineLabel?: string;
}): ExportPayloadV1 {
  const timestampIso = args.timestampIso ?? new Date().toISOString();
  const isElementsTab = args.viewTab === "elements";
  const transitionValue = isElementsTab
    ? (args.representativeLineLabel ?? `${args.selectedElement} strongest line`)
    : transitionLabel(args.nUpper, args.nLower);

  const parameters: ExportPayloadV1["parameters"] = [
    { name: "Mode", value: modeLabel(args.mode) },
    { name: "Tab", value: tabLabel(args.viewTab) },
    { name: "Element", value: args.selectedElement },
    { name: "n_upper", value: String(args.nUpper) },
    { name: "n_lower", value: String(args.nLower) },
    { name: "Series filter", value: seriesFilterLabel(args.seriesFilter) },
  ];
  if (isElementsTab) {
    parameters.push({ name: "Representative line", value: transitionValue });
  }

  const readouts: ExportPayloadV1["readouts"] = [
    { name: isElementsTab ? "Representative line" : "Transition", value: transitionValue },
    {
      name: "Wavelength lambda (nm)",
      value: Number.isFinite(args.wavelengthNm) ? args.wavelengthNm.toFixed(1) : "\u2014",
    },
    { name: "Energy E_gamma (eV)", value: Number.isFinite(args.energyEv) ? args.energyEv.toFixed(4) : "\u2014" },
    {
      name: "Frequency nu (Hz)",
      value: Number.isFinite(args.frequencyHz) ? args.frequencyHz.toExponential(3) : "\u2014",
    },
    { name: "Series", value: args.seriesName },
    { name: "Band", value: args.band },
  ];

  return {
    version: 1,
    timestamp: timestampIso,
    parameters,
    readouts,
    notes: [
      "Hydrogen energy levels from the Bohr model: E_n = -13.6 eV / n^2.",
      "Wavelengths computed via lambda = hc / Delta E (vacuum wavelengths).",
      "Multi-element line data from NIST Atomic Spectra Database (strongest lines only).",
      "Elements tab readouts use each selected element's canonical strongest-intensity representative line.",
      "Bohr atom radii in the visualization use a compressed display scale (not physical n^2 scaling).",
      "Line widths in the spectrum strip are for display only (fixed width, not physical broadening).",
    ],
  };
}
