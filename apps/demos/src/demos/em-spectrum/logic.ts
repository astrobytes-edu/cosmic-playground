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
  for (const key of Object.keys(BANDS) as BandKey[]) {
    const band = BANDS[key];
    if (lambdaCm >= band.lambdaMinCm && lambdaCm <= band.lambdaMaxCm) return key;
  }
  if (lambdaCm > BANDS.radio.lambdaMaxCm) return "radio";
  if (lambdaCm < BANDS.gamma.lambdaMinCm) return "gamma";
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
