import {
  HydrostaticEquilibriumModel,
  type HydrostaticDensityModel,
  type HydrostaticRadialProfilePoint
} from "@cosmic/physics";

export type HydrostaticSupportMode =
  | "balanced"
  | "under-supported"
  | "over-supported";

export type HydrostaticExplorerMode = "student" | "instructor";

export type GuidedStepId =
  | "predict"
  | "local-shell"
  | "global-profile"
  | "compactness"
  | "density-model"
  | "thermal-bridge"
  | "synthesis";

export type HydrostaticProfileKey =
  | "pressure"
  | "pressure-gradient"
  | "enclosed-mass"
  | "gravity"
  | "density";

export type GuidedStep = {
  id: GuidedStepId;
  tag: string;
  title: string;
  prompt: string;
  noticeTitle: string;
  noticeBody: string;
  focusProfileKey: HydrostaticProfileKey;
};

export type GuidedStepPresentation = {
  showPresetChooser: boolean;
  showPredictionCard: boolean;
  showShellStage: boolean;
  showLocalShellStateControls: boolean;
  showProfileStage: boolean;
  showMassRadiusControls: boolean;
  showDensityModelControls: boolean;
  showThermalBridge: boolean;
  showReadoutStrip: boolean;
  showCheckpointDeck: boolean;
  showSynthesisCard: boolean;
};

export type HydrostaticPresetId =
  | "sun-like"
  | "same-mass-smaller-radius"
  | "massive-main-sequence"
  | "compact-toy"
  | "under-supported"
  | "over-supported";

export type HydrostaticPreset = {
  id: HydrostaticPresetId;
  label: string;
  massSolarMass: number;
  radiusSolarRadius: number;
  shellRadiusFraction: number;
  densityModel: HydrostaticDensityModel;
  supportMode: HydrostaticSupportMode;
  meanMolecularWeightMu: number;
  note: string;
};

export type HydrostaticScenario = {
  preset: HydrostaticPreset;
  massG: number;
  radiusCm: number;
  shellRadiusCm: number;
  shellRadiusFraction: number;
  densityModel: HydrostaticDensityModel;
  supportMode: HydrostaticSupportMode;
  meanMolecularWeightMu: number;
  meanDensityGPerCm3: number;
  centralPressureScaleDynePerCm2: number;
  centralPressureExactDynePerCm2: number;
  coreTemperatureScaleK: number;
  shellPoint: HydrostaticRadialProfilePoint;
  shellPatch: ReturnType<typeof HydrostaticEquilibriumModel.localShellPatchBalance>;
  profile: HydrostaticRadialProfilePoint[];
};

export type HydrostaticChallenge = {
  id: string;
  prompt: string;
  choices: Array<{ id: string; label: string }>;
  correctChoiceId: string;
  explanation: string;
  hint: string;
};

const SUN_REFERENCE = {
  massSolarMass: 1,
  radiusSolarRadius: 1,
  meanMolecularWeightMu: 0.62
} as const;

export const HYDROSTATIC_PRESETS: Record<HydrostaticPresetId, HydrostaticPreset> = {
  "sun-like": {
    id: "sun-like",
    label: "Sun-like star",
    massSolarMass: 1,
    radiusSolarRadius: 1,
    shellRadiusFraction: 0.55,
    densityModel: "uniform",
    supportMode: "balanced",
    meanMolecularWeightMu: 0.62,
    note: "Baseline ASTR 201 reference point with solar mass and radius."
  },
  "same-mass-smaller-radius": {
    id: "same-mass-smaller-radius",
    label: "Same mass, smaller radius",
    massSolarMass: 1,
    radiusSolarRadius: 0.5,
    shellRadiusFraction: 0.45,
    densityModel: "uniform",
    supportMode: "balanced",
    meanMolecularWeightMu: 0.62,
    note: "Hold mass fixed and squeeze the star to expose the strong $R^{-4}$ pressure scaling."
  },
  "massive-main-sequence": {
    id: "massive-main-sequence",
    label: "Massive main-sequence star",
    massSolarMass: 12,
    radiusSolarRadius: 4.8,
    shellRadiusFraction: 0.5,
    densityModel: "central-toy",
    supportMode: "balanced",
    meanMolecularWeightMu: 0.62,
    note: "Higher mass and modestly larger radius raise the required pressure and temperature scales."
  },
  "compact-toy": {
    id: "compact-toy",
    label: "Compact toy star",
    massSolarMass: 1.4,
    radiusSolarRadius: 0.12,
    shellRadiusFraction: 0.35,
    densityModel: "central-toy",
    supportMode: "balanced",
    meanMolecularWeightMu: 0.62,
    note: "A deliberately compact toy configuration for extreme hydrostatic support demands."
  },
  "under-supported": {
    id: "under-supported",
    label: "Under-supported shell",
    massSolarMass: 1,
    radiusSolarRadius: 1,
    shellRadiusFraction: 0.55,
    densityModel: "uniform",
    supportMode: "under-supported",
    meanMolecularWeightMu: 0.62,
    note: "Local pressure gradient is too weak, so the shell feels a net inward force."
  },
  "over-supported": {
    id: "over-supported",
    label: "Over-supported shell",
    massSolarMass: 1,
    radiusSolarRadius: 1,
    shellRadiusFraction: 0.55,
    densityModel: "uniform",
    supportMode: "over-supported",
    meanMolecularWeightMu: 0.62,
    note: "Local pressure gradient is too strong, so the shell feels a net outward force."
  }
} as const;

const SOLAR_REFERENCE_SCENARIO = {
  massG: HydrostaticEquilibriumModel.solarMassToG(SUN_REFERENCE.massSolarMass),
  radiusCm: HydrostaticEquilibriumModel.solarRadiusToCm(SUN_REFERENCE.radiusSolarRadius)
} as const;

export const HYDROSTATIC_CHALLENGES: HydrostaticChallenge[] = [
  {
    id: "radius-pressure",
    prompt: "If radius shrinks at fixed mass, does the required central pressure go up or down?",
    choices: [
      { id: "up", label: "It goes up." },
      { id: "down", label: "It goes down." },
      { id: "same", label: "It stays the same." }
    ],
    correctChoiceId: "up",
    explanation:
      "At fixed mass, $P_c \\sim G M^2 / R^4$. Shrinking $R$ makes gravity harder to resist, so the required central pressure rises sharply.",
    hint: "Focus on the $R^{-4}$ scaling: smaller radius means much larger required pressure."
  },
  {
    id: "pressure-vs-gradient",
    prompt: "True or false: very large pressure automatically supports a star.",
    choices: [
      { id: "false", label: "False" },
      { id: "true", label: "True" }
    ],
    correctChoiceId: "false",
    explanation:
      "Support comes from a pressure gradient, not pressure by itself. Equal pressure on both faces of a local gas patch does not create a net outward force.",
    hint: "Ask which quantity appears in the hydrostatic equation: $P$ or $dP/dr$?"
  },
  {
    id: "negative-sign",
    prompt: "What does the negative sign in $dP/dr = -\\rho g$ mean physically?",
    choices: [
      { id: "decrease", label: "Pressure must decrease outward." },
      { id: "negative-gravity", label: "Gravity is a negative quantity." },
      { id: "cooler", label: "Temperature must always decrease outward." }
    ],
    correctChoiceId: "decrease",
    explanation:
      "The minus sign says the outward radial derivative is negative: pressure is larger deeper inside the star and falls as you move outward.",
    hint: "Think about which side of a shell patch needs to push harder to support weight."
  },
  {
    id: "half-radius",
    prompt: "A star has the same mass as the Sun but half the radius. Estimate how $P_c$ changes.",
    choices: [
      { id: "factor-2", label: "About $2\\times$ larger" },
      { id: "factor-4", label: "About $4\\times$ larger" },
      { id: "factor-16", label: "About $16\\times$ larger" }
    ],
    correctChoiceId: "factor-16",
    explanation:
      "Because $P_c \\propto R^{-4}$ at fixed mass, halving $R$ multiplies the pressure scale by $2^4 = 16$.",
    hint: "Use the exponent in the scaling law before plugging in numbers."
  },
  {
    id: "evolving-star",
    prompt: "Why can a star be in hydrostatic equilibrium and still be evolving?",
    choices: [
      { id: "equilibrium-not-static", label: "Force balance can hold while temperature, composition, and luminosity change slowly." },
      { id: "fusion-off", label: "Hydrostatic equilibrium means fusion has stopped." },
      { id: "no-energy-flow", label: "Equilibrium means there is no energy transport." }
    ],
    correctChoiceId: "equilibrium-not-static",
    explanation:
      "Hydrostatic equilibrium is a force-balance condition, not a promise of zero evolution. A star can remain nearly force balanced while fusion, composition, and energy transport change over longer timescales.",
    hint: "Separate support against gravity from the energy source that maintains temperature."
  }
];

export const PROFILE_TABS: Array<{
  key: HydrostaticProfileKey;
  label: string;
  quantityLabel: string;
  unitLatex: string;
}> = [
  {
    key: "pressure",
    label: "Pressure",
    quantityLabel: "$P(r)$",
    unitLatex: "{\\rm dyne\\,cm^{-2}}"
  },
  {
    key: "pressure-gradient",
    label: "Gradient",
    quantityLabel: "$dP/dr$",
    unitLatex: "{\\rm dyne\\,cm^{-3}}"
  },
  {
    key: "enclosed-mass",
    label: "Enclosed mass",
    quantityLabel: "$M(r)$",
    unitLatex: "M_{\\odot}"
  },
  {
    key: "gravity",
    label: "Gravity",
    quantityLabel: "$g(r)$",
    unitLatex: "{\\rm cm\\,s^{-2}}"
  },
  {
    key: "density",
    label: "Density",
    quantityLabel: "$\\rho(r)$",
    unitLatex: "{\\rm g\\,cm^{-3}}"
  }
];

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: "predict",
    tag: "Predict",
    title: "Start with a prediction",
    prompt: "If the same mass is squeezed into a smaller radius, what happens to the required central pressure?",
    noticeTitle: "Lead with the causal question",
    noticeBody:
      "Before you calculate anything, decide whether a more compact star should be easier or harder to support against gravity.",
    focusProfileKey: "pressure"
  },
  {
    id: "local-shell",
    tag: "Local shell",
    title: "Inspect one shell",
    prompt: "Move the shell radius and switch the local shell state. Which side has to push harder for the shell to stay balanced?",
    noticeTitle: "Support requires a pressure difference",
    noticeBody:
      "Equal pressure on both faces cancels. The inner side must push harder than the outer side, so support comes from a pressure gradient.",
    focusProfileKey: "pressure-gradient"
  },
  {
    id: "global-profile",
    tag: "Global profile",
    title: "Connect one shell to the whole star",
    prompt: "Use the profile tabs to ask how the highlighted shell fits into the whole structure: where do the pressure, gradient, enclosed mass, and gravity come from?",
    noticeTitle: "One shell belongs to a full radial structure",
    noticeBody:
      "The highlighted shell is not isolated. The profile plot shows how local shell quantities are embedded in the full stellar interior.",
    focusProfileKey: "gravity"
  },
  {
    id: "compactness",
    tag: "Compactness",
    title: "Change mass and radius",
    prompt: "Hold mass fixed and shrink radius. How do the gravity problem and the required central pressure scale respond?",
    noticeTitle: "Compactness makes support harder",
    noticeBody:
      "At fixed mass, shrinking radius strengthens the self-gravity problem and drives the characteristic support requirement upward as $P_c \\propto R^{-4}$.",
    focusProfileKey: "pressure"
  },
  {
    id: "density-model",
    tag: "Structure",
    title: "Change the internal mass distribution",
    prompt: "Keep total mass and radius fixed, then switch density models. Why does the exact central pressure change even when the scaling estimate still helps?",
    noticeTitle: "Same $M$ and $R$, different interior concentration",
    noticeBody:
      "A centrally concentrated toy star packs more mass deep inside. The $GM^2/R^4$ scaling stays useful, but the exact center shifts because the internal structure changed.",
    focusProfileKey: "density"
  },
  {
    id: "thermal-bridge",
    tag: "Thermal bridge",
    title: "Bridge support to temperature",
    prompt: "If gas pressure provides the support, what temperature scale is required and why does $\\mu$ matter?",
    noticeTitle: "Support scale is not the same as the energy source",
    noticeBody:
      "Hydrostatic equilibrium tells you the pressure requirement. The ideal-gas bridge turns that support requirement into a temperature scale without claiming fusion is the support law itself.",
    focusProfileKey: "pressure"
  },
  {
    id: "synthesis",
    tag: "Synthesis",
    title: "Build the full reasoning ladder",
    prompt: "Use one local observation and one scaling law to explain how gravity leads to a core-temperature requirement in an ideal-gas-supported star.",
    noticeTitle: "Local balance leads to global inference",
    noticeBody:
      "The shell law tells you the support problem at each radius. Scaling then converts that local logic into central pressure and core-temperature estimates.",
    focusProfileKey: "pressure"
  }
] as const;

const PROFILE_TEACHING_NOTES: Record<HydrostaticProfileKey, string> = {
  pressure:
    "This shows the local pressure itself. Pressure alone does not support the shell unless it decreases outward.",
  "pressure-gradient":
    "This is the support-producing quantity. The pressure gradient tells you how much harder the lower side pushes than the upper side.",
  "enclosed-mass":
    "This is cumulative interior mass. In spherical symmetry, only the mass inside the shell sets the local gravitational field there.",
  gravity:
    "This is the local inward pull. Larger enclosed mass or smaller radius makes the gravity problem harder at that shell.",
  density:
    "This shows where the matter sits. A more centrally concentrated toy model changes the exact center even when the same total mass and radius are held fixed."
};

export function guidedStepIndex(stepId: GuidedStepId): number {
  return GUIDED_STEPS.findIndex((step) => step.id === stepId);
}

export function guidedStepUnlocks(stepId: GuidedStepId): {
  basic: boolean;
  structure: boolean;
  advanced: boolean;
} {
  const index = guidedStepIndex(stepId);
  return {
    basic: index >= guidedStepIndex("local-shell"),
    structure: index >= guidedStepIndex("compactness"),
    advanced: index >= guidedStepIndex("thermal-bridge")
  };
}

export function guidedStepPresentation(stepId: GuidedStepId): GuidedStepPresentation {
  switch (stepId) {
    case "predict":
      return {
        showPresetChooser: true,
        showPredictionCard: true,
        showShellStage: false,
        showLocalShellStateControls: false,
        showProfileStage: false,
        showMassRadiusControls: false,
        showDensityModelControls: false,
        showThermalBridge: false,
        showReadoutStrip: false,
        showCheckpointDeck: false,
        showSynthesisCard: false
      };
    case "local-shell":
      return {
        showPresetChooser: false,
        showPredictionCard: false,
        showShellStage: true,
        showLocalShellStateControls: true,
        showProfileStage: false,
        showMassRadiusControls: false,
        showDensityModelControls: false,
        showThermalBridge: false,
        showReadoutStrip: false,
        showCheckpointDeck: false,
        showSynthesisCard: false
      };
    case "global-profile":
      return {
        showPresetChooser: false,
        showPredictionCard: false,
        showShellStage: true,
        showLocalShellStateControls: true,
        showProfileStage: true,
        showMassRadiusControls: false,
        showDensityModelControls: false,
        showThermalBridge: false,
        showReadoutStrip: false,
        showCheckpointDeck: false,
        showSynthesisCard: false
      };
    case "compactness":
      return {
        showPresetChooser: false,
        showPredictionCard: false,
        showShellStage: true,
        showLocalShellStateControls: true,
        showProfileStage: true,
        showMassRadiusControls: true,
        showDensityModelControls: false,
        showThermalBridge: false,
        showReadoutStrip: true,
        showCheckpointDeck: false,
        showSynthesisCard: false
      };
    case "density-model":
      return {
        showPresetChooser: false,
        showPredictionCard: false,
        showShellStage: true,
        showLocalShellStateControls: true,
        showProfileStage: true,
        showMassRadiusControls: true,
        showDensityModelControls: true,
        showThermalBridge: false,
        showReadoutStrip: true,
        showCheckpointDeck: false,
        showSynthesisCard: false
      };
    case "thermal-bridge":
      return {
        showPresetChooser: false,
        showPredictionCard: false,
        showShellStage: true,
        showLocalShellStateControls: true,
        showProfileStage: true,
        showMassRadiusControls: true,
        showDensityModelControls: true,
        showThermalBridge: true,
        showReadoutStrip: true,
        showCheckpointDeck: false,
        showSynthesisCard: false
      };
    case "synthesis":
      return {
        showPresetChooser: false,
        showPredictionCard: false,
        showShellStage: true,
        showLocalShellStateControls: true,
        showProfileStage: true,
        showMassRadiusControls: true,
        showDensityModelControls: true,
        showThermalBridge: true,
        showReadoutStrip: true,
        showCheckpointDeck: true,
        showSynthesisCard: true
      };
  }
}

export function profileTeachingNote(key: HydrostaticProfileKey): string {
  return PROFILE_TEACHING_NOTES[key];
}

export function supportFactorForMode(mode: HydrostaticSupportMode): number {
  if (mode === "under-supported") return 0.78;
  if (mode === "over-supported") return 1.22;
  return 1;
}

export function normalizedSolarRatio(value: number, solarValue: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(solarValue) || solarValue === 0) {
    return 0;
  }
  return value / solarValue;
}

export function formatScientificLatex(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\\text{--}";
  if (value === 0) return "0";

  const abs = Math.abs(value);
  if (abs >= 1.0e4 || abs < 1.0e-2) {
    const exponent = Math.floor(Math.log10(abs));
    const mantissa = value / Math.pow(10, exponent);
    return `${mantissa.toFixed(Math.max(0, digits - 1))} \\times 10^{${exponent}}`;
  }

  const rounded =
    abs >= 100 ? value.toFixed(0) : abs >= 10 ? value.toFixed(1) : value.toFixed(2);
  return rounded.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

export function formatKelvinOrMegaKelvinLatex(valueK: number): string {
  if (!Number.isFinite(valueK)) return "\\text{--}";
  if (Math.abs(valueK) >= 1.0e6) {
    return `${(valueK / 1.0e6).toFixed(1)}\\,{\\rm MK}`;
  }
  return `${Math.round(valueK)}\\,{\\rm K}`;
}

export function formatSolarNormalizedLatex(args: {
  value: number;
  solarValue: number;
  symbolLatex: string;
  digits?: number;
}): string {
  const { value, solarValue, symbolLatex, digits = 2 } = args;
  const ratio = normalizedSolarRatio(value, solarValue);
  if (!Number.isFinite(ratio)) return "\\text{--}";
  return `${ratio.toFixed(digits)}\\,${symbolLatex}`;
}

export function applyPreset(
  preset: HydrostaticPreset,
  overrides: Partial<Pick<HydrostaticPreset, "densityModel" | "supportMode">> = {}
): HydrostaticPreset {
  return {
    ...preset,
    ...overrides
  };
}

export function matchingPresetId(
  preset: Pick<
    HydrostaticPreset,
    | "massSolarMass"
    | "radiusSolarRadius"
    | "shellRadiusFraction"
    | "densityModel"
    | "supportMode"
    | "meanMolecularWeightMu"
  >
): HydrostaticPresetId | null {
  for (const candidate of Object.values(HYDROSTATIC_PRESETS)) {
    if (
      candidate.massSolarMass === preset.massSolarMass &&
      candidate.radiusSolarRadius === preset.radiusSolarRadius &&
      candidate.shellRadiusFraction === preset.shellRadiusFraction &&
      candidate.densityModel === preset.densityModel &&
      candidate.supportMode === preset.supportMode &&
      candidate.meanMolecularWeightMu === preset.meanMolecularWeightMu
    ) {
      return candidate.id;
    }
  }

  return null;
}

export function buildHydrostaticScenario(
  preset: HydrostaticPreset,
  options: { sampleCount?: number } = {}
): HydrostaticScenario {
  const massG = HydrostaticEquilibriumModel.solarMassToG(preset.massSolarMass);
  const radiusCm = HydrostaticEquilibriumModel.solarRadiusToCm(preset.radiusSolarRadius);
  const shellRadiusFraction = clamp01(preset.shellRadiusFraction);
  const shellRadiusCm = shellRadiusFraction * radiusCm;
  const meanDensityGPerCm3 = HydrostaticEquilibriumModel.meanDensityGPerCm3({
    massG,
    radiusCm
  });
  const centralPressureScaleDynePerCm2 =
    HydrostaticEquilibriumModel.centralPressureScaleDynePerCm2({
      massG,
      radiusCm
    });
  const centralPressureExactDynePerCm2 =
    preset.densityModel === "central-toy"
      ? HydrostaticEquilibriumModel.pressureProfileCentralToyDynePerCm2({
          radiusCm: 0,
          totalRadiusCm: radiusCm,
          totalMassG: massG
        })
      : HydrostaticEquilibriumModel.pressureProfileUniformDynePerCm2({
          radiusCm: 0,
          totalRadiusCm: radiusCm,
          totalMassG: massG
        });
  const coreTemperatureScaleK = HydrostaticEquilibriumModel.coreTemperatureScaleK({
    massG,
    radiusCm,
    meanMolecularWeightMu: preset.meanMolecularWeightMu
  });
  const shellPoint = HydrostaticEquilibriumModel.evaluateDensityModelAtRadius({
    densityModel: preset.densityModel,
    radiusCm: shellRadiusCm,
    totalRadiusCm: radiusCm,
    totalMassG: massG
  });
  const shellPatch = HydrostaticEquilibriumModel.localShellPatchBalance({
    densityModel: preset.densityModel,
    shellRadiusCm,
    totalRadiusCm: radiusCm,
    totalMassG: massG,
    shellThicknessCm: 0.06 * radiusCm,
    patchAreaCm2: 1,
    supportFactor: supportFactorForMode(preset.supportMode)
  });
  const profile = HydrostaticEquilibriumModel.sampleRadialProfile({
    densityModel: preset.densityModel,
    totalMassG: massG,
    totalRadiusCm: radiusCm,
    sampleCount: options.sampleCount ?? 180
  });

  return {
    preset,
    massG,
    radiusCm,
    shellRadiusCm,
    shellRadiusFraction,
    densityModel: preset.densityModel,
    supportMode: preset.supportMode,
    meanMolecularWeightMu: preset.meanMolecularWeightMu,
    meanDensityGPerCm3,
    centralPressureScaleDynePerCm2,
    centralPressureExactDynePerCm2,
    coreTemperatureScaleK,
    shellPoint,
    shellPatch,
    profile
  };
}

export function solarReferenceScales(args: {
  meanMolecularWeightMu?: number;
} = {}): {
  centralPressureScaleDynePerCm2: number;
  coreTemperatureScaleK: number;
} {
  const meanMolecularWeightMu =
    args.meanMolecularWeightMu ?? SUN_REFERENCE.meanMolecularWeightMu;
  return {
    centralPressureScaleDynePerCm2:
      HydrostaticEquilibriumModel.centralPressureScaleDynePerCm2({
        massG: SOLAR_REFERENCE_SCENARIO.massG,
        radiusCm: SOLAR_REFERENCE_SCENARIO.radiusCm
      }),
    coreTemperatureScaleK: HydrostaticEquilibriumModel.coreTemperatureScaleK({
      massG: SOLAR_REFERENCE_SCENARIO.massG,
      radiusCm: SOLAR_REFERENCE_SCENARIO.radiusCm,
      meanMolecularWeightMu
    })
  };
}

export function profileValueForKey(
  point: HydrostaticRadialProfilePoint,
  key: HydrostaticProfileKey
): number {
  if (key === "pressure") return point.pressureDynePerCm2;
  if (key === "pressure-gradient") return point.pressureGradientDynePerCm3;
  if (key === "enclosed-mass") {
    return HydrostaticEquilibriumModel.massGToSolarMass(point.enclosedMassG);
  }
  if (key === "gravity") return point.gravityCmPerS2;
  return point.densityGPerCm3;
}

export function profileValueLabel(
  key: HydrostaticProfileKey,
  value: number
): string {
  if (key === "enclosed-mass") {
    return `${formatScientificLatex(value, 3)}\\,M_{\\odot}`;
  }
  if (key === "gravity") {
    return `${formatScientificLatex(value, 3)}\\,{\\rm cm\\,s^{-2}}`;
  }
  if (key === "density") {
    return `${formatScientificLatex(value, 3)}\\,{\\rm g\\,cm^{-3}}`;
  }
  if (key === "pressure-gradient") {
    return `${formatScientificLatex(value, 3)}\\,{\\rm dyne\\,cm^{-3}}`;
  }
  return `${formatScientificLatex(value, 3)}\\,{\\rm dyne\\,cm^{-2}}`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
