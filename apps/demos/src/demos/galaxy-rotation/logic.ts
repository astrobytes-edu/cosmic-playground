import type { ExportPayloadV1 } from "@cosmic/runtime";
import type { GalaxyParams } from "@cosmic/physics";

export type PlotMode = "velocity" | "mass";
export type OuterCurveBehavior = "flat" | "keplerian";
export type GalaxyPresetId =
  | "milky-way-like"
  | "dwarf-galaxy"
  | "massive-spiral"
  | "no-dark-matter"
  | "custom";

export interface RotationSample {
  radiusKpc: number;
  vTotalKmS: number;
  vKeplerianKmS: number;
  mVisible10: number;
  mDark10: number;
  mTotal10: number;
}

export interface ChallengeTarget {
  presetId: Exclude<GalaxyPresetId, "custom">;
  outerBehavior: OuterCurveBehavior;
}

export const RADIAL_PROFILE_SAMPLE_KPC = [2, 5, 10, 15, 20, 30, 40, 50] as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

export function formatSigned(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}`;
}

export function findDarkDominanceRadiusKpc(samples: RotationSample[]): number | null {
  const sorted = [...samples].sort((a, b) => a.radiusKpc - b.radiusKpc);
  for (const row of sorted) {
    if (Number.isFinite(row.mDark10) && Number.isFinite(row.mVisible10) && row.mDark10 >= row.mVisible10) {
      return row.radiusKpc;
    }
  }
  return null;
}

export function classifyOuterCurveBehavior(samples: RotationSample[]): OuterCurveBehavior {
  const sample30 = samples.find((row) => Math.abs(row.radiusKpc - 30) < 0.6);
  const sample50 = samples.find((row) => Math.abs(row.radiusKpc - 50) < 0.6);
  if (!sample30 || !sample50 || sample30.vTotalKmS <= 0 || sample50.vTotalKmS <= 0) {
    return "flat";
  }
  const ratio = sample50.vTotalKmS / sample30.vTotalKmS;
  const keplerianRatio = Math.sqrt(30 / 50);
  return Math.abs(ratio - keplerianRatio) < 0.06 ? "keplerian" : "flat";
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
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickChallengeTarget(args: {
  targets: ChallengeTarget[];
  random: () => number;
  previous?: ChallengeTarget | null;
}): ChallengeTarget {
  if (args.targets.length === 0) {
    throw new Error("pickChallengeTarget requires at least one target.");
  }

  const rawIndex = Math.floor(args.random() * args.targets.length);
  let index = clamp(rawIndex, 0, args.targets.length - 1);

  if (args.targets.length > 1 && args.previous) {
    const picked = args.targets[index];
    const isRepeat = picked.presetId === args.previous.presetId
      && picked.outerBehavior === args.previous.outerBehavior;
    if (isRepeat) {
      index = (index + 1) % args.targets.length;
    }
  }

  return args.targets[index];
}

export function isChallengeCopyLocked(args: {
  challengeActive: boolean;
  challengeRevealed: boolean;
}): boolean {
  return args.challengeActive && !args.challengeRevealed;
}

function outerBehaviorLabel(behavior: OuterCurveBehavior): string {
  return behavior === "flat" ? "flat" : "Keplerian decline";
}

export function buildChallengeEvidenceText(args: {
  checkedAtIso?: string;
  guessedPresetLabel: string;
  guessedOuterBehavior: OuterCurveBehavior;
  targetPresetLabel: string;
  targetOuterBehavior: OuterCurveBehavior;
  correct: boolean;
  radiusKpc: number;
  vTotalKmS: number;
  vKeplerianKmS: number;
  darkVisibleRatio: number;
  baryonFraction: number;
  deltaLambda21mm: number;
}): string {
  const checkedAtIso = args.checkedAtIso ?? new Date().toISOString();
  return [
    "Galaxy Rotation — Challenge Evidence",
    `Checked at: ${checkedAtIso}`,
    `Outcome: ${args.correct ? "Correct" : "Incorrect"}`,
    `Guess preset: ${args.guessedPresetLabel}`,
    `Guess outer behavior: ${outerBehaviorLabel(args.guessedOuterBehavior)}`,
    `Target preset: ${args.targetPresetLabel}`,
    `Target outer behavior: ${outerBehaviorLabel(args.targetOuterBehavior)}`,
    `Radius R (kpc): ${formatNumber(args.radiusKpc, 1)}`,
    `V_total (km/s): ${formatNumber(args.vTotalKmS, 2)}`,
    `V_Keplerian (km/s): ${formatNumber(args.vKeplerianKmS, 2)}`,
    `Dark-to-visible ratio: ${formatNumber(args.darkVisibleRatio, 3)}`,
    `Baryon fraction f_b: ${formatNumber(args.baryonFraction, 3)}`,
    `Delta-lambda 21cm (mm): ${formatNumber(args.deltaLambda21mm, 3)}`,
    "Debrief prompt: Claim + evidence + mechanism (why does the curve shape demand additional gravity, or not?).",
  ].join("\n");
}

export function buildGalaxyRotationExportPayload(args: {
  timestampIso?: string;
  presetLabel: string;
  plotMode: PlotMode;
  radiusKpc: number;
  params: GalaxyParams;
  derived: {
    concentration: number;
    rVirKpc: number;
  };
  readouts: {
    vTotalKmS: number;
    vKeplerianKmS: number;
    vMondKmS: number;
    mTotal10: number;
    mVisible10: number;
    mDark10: number;
    darkVisRatio: number;
    baryonFraction: number;
    deltaLambda21mm: number;
  };
  challengeState: "inactive" | "active-hidden" | "revealed";
}): ExportPayloadV1 {
  const timestampIso = args.timestampIso ?? new Date().toISOString();

  return {
    version: 1,
    timestamp: timestampIso,
    parameters: [
      { name: "Galaxy model", value: args.presetLabel },
      { name: "Plot mode", value: args.plotMode === "velocity" ? "Velocity V(R)" : "Enclosed mass M(<R)" },
      { name: "Bulge mass (10^10 Msun)", value: formatNumber(args.params.bulgeMass10, 3) },
      { name: "Bulge scale radius (kpc)", value: formatNumber(args.params.bulgeScaleKpc, 3) },
      { name: "Disk mass (10^10 Msun)", value: formatNumber(args.params.diskMass10, 3) },
      { name: "Disk scale length (kpc)", value: formatNumber(args.params.diskScaleLengthKpc, 3) },
      { name: "Dark halo mass (10^10 Msun)", value: formatNumber(args.params.haloMass10, 3) },
      { name: "Halo scale radius (kpc)", value: formatNumber(args.params.haloScaleRadiusKpc, 3) },
      { name: "Challenge state", value: args.challengeState },
    ],
    readouts: [
      { name: "Radius R (kpc)", value: formatNumber(args.radiusKpc, 3) },
      { name: "V_total (km/s)", value: formatNumber(args.readouts.vTotalKmS, 3) },
      { name: "V_Keplerian (km/s)", value: formatNumber(args.readouts.vKeplerianKmS, 3) },
      { name: "V_MOND (km/s)", value: formatNumber(args.readouts.vMondKmS, 3) },
      { name: "M_total(<R) (10^10 Msun)", value: formatNumber(args.readouts.mTotal10, 3) },
      { name: "M_visible(<R) (10^10 Msun)", value: formatNumber(args.readouts.mVisible10, 3) },
      { name: "M_dark(<R) (10^10 Msun)", value: formatNumber(args.readouts.mDark10, 3) },
      { name: "Dark-to-visible ratio", value: formatNumber(args.readouts.darkVisRatio, 3) },
      { name: "Baryon fraction f_b", value: formatNumber(args.readouts.baryonFraction, 3) },
      { name: "Delta-lambda 21cm (mm)", value: formatNumber(args.readouts.deltaLambda21mm, 3) },
      { name: "Concentration c", value: formatNumber(args.derived.concentration, 3) },
      { name: "Virial radius R_vir (kpc)", value: formatNumber(args.derived.rVirKpc, 3) },
    ],
    notes: [
      "Uses Hernquist bulge + exact exponential disk (modified Bessel I_n and K_n terms) + NFW halo decomposition.",
      "Velocities add in quadrature: V_total^2 = V_bulge^2 + V_disk^2 + V_halo^2.",
      "NFW virial radius is derived with Planck-like cosmology defaults (H_0 = 67.4 km/s/Mpc, Omega_m = 0.315).",
      "MOND curve is included as a comparison using full interpolation, not as a full alternative fit workflow.",
      "21-cm shift is Delta-lambda_21 = lambda_0 * V / c with lambda_0 = 21.106 cm.",
      "Galaxy schematic is face-on pedagogical context; published rotation curves are inclination-corrected intrinsic V(R).",
    ],
  };
}
