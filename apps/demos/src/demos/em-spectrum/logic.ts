/**
 * Pure UI logic for the em-spectrum demo.
 * No DOM access -- all functions are testable in isolation.
 */

export type BandKey =
  | "radio"
  | "microwave"
  | "infrared"
  | "visible"
  | "ultraviolet"
  | "xray"
  | "gamma";

export type BandInfo = {
  key: BandKey;
  name: string;
  lambdaMinCm: number;
  lambdaMaxCm: number;
  description: string;
  examples: string;
  detection: string;
};

export const BANDS: Record<BandKey, BandInfo> = {
  radio: {
    key: "radio",
    name: "Radio",
    lambdaMinCm: 1e-1, // 1 mm
    lambdaMaxCm: 1e6, // 10 km
    description:
      "The longest wavelengths in the EM spectrum. Radio waves pass through clouds, dust, and even buildings.",
    examples:
      "AM/FM radio, WiFi, pulsars, the cosmic microwave background, radio galaxies",
    detection: "Large dish antennas and interferometers (VLA, ALMA, FAST)"
  },
  microwave: {
    key: "microwave",
    name: "Microwave",
    lambdaMinCm: 1e-2, // 0.1 mm
    lambdaMaxCm: 1e-1, // 1 mm
    description:
      "Between radio and infrared. Microwaves reveal the cosmic microwave background and cold molecular gas.",
    examples: "Microwave ovens, CMB, molecular clouds, radar",
    detection: "Microwave receivers and bolometers (Planck, WMAP)"
  },
  infrared: {
    key: "infrared",
    name: "Infrared",
    lambdaMinCm: 7e-5, // 700 nm
    lambdaMaxCm: 1e-2, // 0.1 mm
    description:
      "Emitted by warm objects. Infrared can penetrate dust clouds to reveal star-forming regions.",
    examples: "Thermal emission, brown dwarfs, dust-enshrouded star formation",
    detection: "Cooled IR detectors (JWST, Spitzer, Herschel)"
  },
  visible: {
    key: "visible",
    name: "Visible",
    lambdaMinCm: 3.8e-5, // 380 nm
    lambdaMaxCm: 7e-5, // 700 nm
    description:
      "The narrow band our eyes can see. Stars, galaxies, and nebulae shine brightly in visible light.",
    examples: "Sunlight, starlight, nebulae, galaxies",
    detection: "Human eyes, CCDs, ground optical telescopes, Hubble"
  },
  ultraviolet: {
    key: "ultraviolet",
    name: "Ultraviolet",
    lambdaMinCm: 1e-6, // 10 nm
    lambdaMaxCm: 3.8e-5, // 380 nm
    description:
      "Higher energy than visible light. UV reveals hot young stars and active galactic nuclei.",
    examples: "Sunburns, massive stars, accretion disks",
    detection: "UV-sensitive detectors, mostly space-based (HST, GALEX)"
  },
  xray: {
    key: "xray",
    name: "X-ray",
    lambdaMinCm: 1e-9, // 0.01 nm
    lambdaMaxCm: 1e-6, // 10 nm
    description:
      "Very high energy photons from extremely hot gas and violent events.",
    examples: "X-ray binaries, supernova remnants, hot cluster gas",
    detection: "Space telescopes with grazing-incidence optics (Chandra, XMM)"
  },
  gamma: {
    key: "gamma",
    name: "Gamma-ray",
    lambdaMinCm: 1e-13, // ~1 fm
    lambdaMaxCm: 1e-9, // 0.01 nm
    description:
      "The highest energy photons. Gamma rays come from the most extreme events in the universe.",
    examples: "Gamma-ray bursts, nuclear reactions, pulsars",
    detection: "Space detectors (Fermi) and ground Cherenkov telescopes (VERITAS)"
  }
};

export const LAMBDA_MIN_LOG = Math.log10(1e-12); // 10 fm
export const LAMBDA_MAX_LOG = Math.log10(1e6); // 10 km

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert a wavelength in cm to a position percentage on the spectrum bar.
 * Position 0% = longest wavelength (left/radio), 100% = shortest (right/gamma).
 */
export function wavelengthToPositionPercent(lambdaCm: number): number {
  const lambdaLog = Math.log10(Math.max(1e-13, Math.min(1e7, lambdaCm)));
  return 100 - ((lambdaLog - LAMBDA_MIN_LOG) / (LAMBDA_MAX_LOG - LAMBDA_MIN_LOG)) * 100;
}

/**
 * Convert a position percentage back to wavelength in cm.
 * Inverse of wavelengthToPositionPercent.
 */
export function positionPercentToWavelengthCm(positionPercent: number): number {
  const pos = clamp(positionPercent, 0, 100);
  const lambdaLog = LAMBDA_MAX_LOG - (pos / 100) * (LAMBDA_MAX_LOG - LAMBDA_MIN_LOG);
  return Math.pow(10, lambdaLog);
}

/**
 * Format a wavelength in cm for display with auto unit selection.
 * Returns {value, unit} for separate rendering.
 * Covers fm -> pm -> nm -> um -> mm -> m -> km.
 */
export function formatWavelength(lambdaCm: number): { value: string; unit: string } {
  if (!Number.isFinite(lambdaCm) || lambdaCm <= 0) return { value: "\u2014", unit: "" };
  if (lambdaCm >= 1e5) return { value: (lambdaCm / 1e5).toPrecision(3), unit: "km" };
  if (lambdaCm >= 100) return { value: (lambdaCm / 100).toPrecision(3), unit: "m" };
  if (lambdaCm >= 1) return { value: lambdaCm.toPrecision(3), unit: "cm" };
  if (lambdaCm >= 0.1) return { value: (lambdaCm * 10).toPrecision(3), unit: "mm" };
  if (lambdaCm >= 1e-4) return { value: (lambdaCm / 1e-4).toPrecision(3), unit: "um" };
  if (lambdaCm >= 1e-7) return { value: (lambdaCm / 1e-7).toPrecision(3), unit: "nm" };
  if (lambdaCm >= 1e-10) return { value: (lambdaCm / 1e-10).toPrecision(3), unit: "pm" };
  return { value: (lambdaCm / 1e-13).toPrecision(3), unit: "fm" };
}

/**
 * Format a frequency in Hz for display with auto unit selection.
 * Returns {value, unit} for separate rendering.
 * Covers Hz -> kHz -> MHz -> GHz -> THz -> PHz -> EHz.
 */
export function formatFrequency(nuHz: number): { value: string; unit: string } {
  if (!Number.isFinite(nuHz) || nuHz <= 0) return { value: "\u2014", unit: "" };
  if (nuHz >= 1e18) return { value: (nuHz / 1e18).toPrecision(3), unit: "EHz" };
  if (nuHz >= 1e15) return { value: (nuHz / 1e15).toPrecision(3), unit: "PHz" };
  if (nuHz >= 1e12) return { value: (nuHz / 1e12).toPrecision(3), unit: "THz" };
  if (nuHz >= 1e9) return { value: (nuHz / 1e9).toPrecision(3), unit: "GHz" };
  if (nuHz >= 1e6) return { value: (nuHz / 1e6).toPrecision(3), unit: "MHz" };
  if (nuHz >= 1e3) return { value: (nuHz / 1e3).toPrecision(3), unit: "kHz" };
  return { value: nuHz.toPrecision(3), unit: "Hz" };
}

/**
 * Format a photon energy given in erg for display with auto unit selection.
 * Uses a DI callback for erg->eV conversion to avoid importing @cosmic/physics in tests.
 * Returns {value, unit} for separate rendering.
 * Covers erg -> eV -> keV -> MeV.
 */
export function formatEnergyFromErg(
  energyErg: number,
  ergToEv: (erg: number) => number
): { value: string; unit: string } {
  if (!Number.isFinite(energyErg) || energyErg <= 0) return { value: "\u2014", unit: "" };
  const energyEv = ergToEv(energyErg);
  if (energyEv >= 1e6) return { value: (energyEv / 1e6).toPrecision(3), unit: "MeV" };
  if (energyEv >= 1e3) return { value: (energyEv / 1e3).toPrecision(3), unit: "keV" };
  if (energyEv >= 1e-3) return { value: energyEv.toPrecision(3), unit: "eV" };
  return { value: energyErg.toPrecision(3), unit: "erg" };
}

/**
 * Determine which EM band a wavelength (cm) falls into.
 */
export function bandFromWavelengthCm(lambdaCm: number): BandKey {
  // Teaching policy: visible-light boundaries (380 nm and 700 nm) map to visible.
  if (lambdaCm >= BANDS.visible.lambdaMinCm && lambdaCm <= BANDS.visible.lambdaMaxCm) {
    return "visible";
  }
  if (lambdaCm > BANDS.visible.lambdaMaxCm) {
    if (lambdaCm <= BANDS.infrared.lambdaMaxCm) return "infrared";
    if (lambdaCm <= BANDS.microwave.lambdaMaxCm) return "microwave";
    return "radio";
  }
  if (lambdaCm < BANDS.visible.lambdaMinCm) {
    if (lambdaCm >= BANDS.ultraviolet.lambdaMinCm) return "ultraviolet";
    if (lambdaCm >= BANDS.xray.lambdaMinCm) return "xray";
    return "gamma";
  }
  return "visible";
}

/**
 * Compute the geometric center wavelength of a band (in cm).
 * Used to jump the slider to a band's center when a band button is clicked.
 */
export function bandCenterCm(key: BandKey): number {
  const band = BANDS[key];
  return Math.sqrt(band.lambdaMinCm * band.lambdaMaxCm);
}

/**
 * Scale-object labels positioned at their approximate wavelength.
 * Used to annotate the spectrum bar with familiar size comparisons.
 */
export const SCALE_OBJECTS: Array<{ label: string; lambdaCm: number }> = [
  { label: "Buildings", lambdaCm: 1e4 },
  { label: "Humans",    lambdaCm: 1.7e2 },
  { label: "Insects",   lambdaCm: 1e0 },
  { label: "Cells",     lambdaCm: 1e-3 },
  { label: "Molecules", lambdaCm: 1e-7 },
  { label: "Atoms",     lambdaCm: 1e-8 },
  { label: "Nuclei",    lambdaCm: 1e-12 },
];

/**
 * CSS linear-gradient string for the EM spectrum.
 *
 * Uses the legacy demo's color scheme (dark maroon for radio through
 * the visible rainbow to deep purple/black for gamma), adapted to
 * log-scale positions. Hex colors here represent physical spectral data,
 * not design tokens -- acceptable in JS per architecture rules.
 */
export function spectrumGradientCSS(): string {
  const stops: Array<[number, string]> = [
    // Radio -- dark maroon to warm red
    [0,    "#800000"],
    [8,    "#993000"],
    [15,   "#cc3300"],
    [22,   "#ff3300"],
    [28,   "#ff0000"],
    // Near-IR edge / visible red
    [32,   "#ff0000"],
    [34,   "#ff4500"],
    [37,   "#ffa500"],
    [40,   "#ffff00"],
    [44,   "#00ff00"],
    [48,   "#00ffff"],
    [52,   "#0000ff"],
    [55,   "#4b0082"],
    // UV
    [58,   "#8b00ff"],
    [65,   "#9932cc"],
    // X-ray
    [80,   "#4b0082"],
    // Gamma -- deep purple to near-black
    [100,  "#1a0033"],
  ];
  const parts = stops.map(([pos, color]) => `${color} ${pos}%`);
  return `linear-gradient(to right, ${parts.join(", ")})`;
}

/**
 * Draw a chirp wave overlay on a canvas context.
 *
 * The wave frequency increases smoothly from left (low freq / radio)
 * to right (high freq / gamma), visually demonstrating that shorter
 * wavelengths = higher frequency. The range is normalized so the wave
 * is visible across the entire bar (not physically literal, since the
 * actual range spans 20 orders of magnitude).
 *
 * @param ctx - Canvas 2D rendering context
 * @param width - canvas pixel width
 * @param height - canvas pixel height
 */
export function drawSpectrumWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const midY = height / 2;
  const amplitude = height * 0.32;

  // Chirp: frequency increases exponentially from left to right.
  // minCycles = cycles in leftmost pixel-region, maxCycles = rightmost.
  // A 10:1 ratio gives a clear visual chirp without extremes.
  const minFreq = 3;   // cycles across full width at x=0
  const maxFreq = 60;  // cycles across full width at x=width

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  let phase = 0;
  for (let x = 0; x <= width; x++) {
    // Exponential frequency sweep
    const t = x / width;
    const localFreq = minFreq * Math.pow(maxFreq / minFreq, t);
    // Accumulate phase (integral of frequency)
    const dx = 1 / width;
    phase += localFreq * dx * 2 * Math.PI;
    const y = midY + amplitude * Math.sin(phase);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
}
