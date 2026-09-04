import { describe, expect, it } from "vitest";

import {
  GUIDED_STEPS,
  HYDROSTATIC_CHALLENGES,
  HYDROSTATIC_PRESETS,
  buildHydrostaticScenario,
  formatKelvinOrMegaKelvinLatex,
  formatScientificLatex,
  guidedStepPresentation,
  matchingPresetId,
  normalizedSolarRatio,
  profileTeachingNote,
  supportFactorForMode
} from "./logic";

describe("Hydrostatic Equilibrium Explorer logic", () => {
  it("maps support modes to ordered support factors", () => {
    expect(supportFactorForMode("under-supported")).toBeLessThan(1);
    expect(supportFactorForMode("balanced")).toBe(1);
    expect(supportFactorForMode("over-supported")).toBeGreaterThan(1);
  });

  it("formats scientific values with LaTeX powers of ten", () => {
    expect(formatScientificLatex(1.6e7, 3)).toBe("1.60 \\times 10^{7}");
    expect(formatScientificLatex(0, 3)).toBe("0");
  });

  it("formats solar-like temperatures in MK when they are large enough", () => {
    expect(formatKelvinOrMegaKelvinLatex(1.57e7)).toBe("15.7\\,{\\rm MK}");
    expect(formatKelvinOrMegaKelvinLatex(5800)).toBe("5800\\,{\\rm K}");
  });

  it("keeps the same-mass smaller-radius preset much more compact", () => {
    const sunLike = buildHydrostaticScenario(HYDROSTATIC_PRESETS["sun-like"]);
    const compact = buildHydrostaticScenario(HYDROSTATIC_PRESETS["same-mass-smaller-radius"]);

    expect(compact.centralPressureScaleDynePerCm2 / sunLike.centralPressureScaleDynePerCm2).toBeCloseTo(
      16,
      10
    );
    expect(compact.coreTemperatureScaleK / sunLike.coreTemperatureScaleK).toBeCloseTo(2, 10);
  });

  it("makes the centrally concentrated toy model require more central pressure than the uniform toy model", () => {
    const uniform = buildHydrostaticScenario({
      ...HYDROSTATIC_PRESETS["sun-like"],
      densityModel: "uniform"
    });
    const central = buildHydrostaticScenario({
      ...HYDROSTATIC_PRESETS["sun-like"],
      densityModel: "central-toy"
    });

    expect(central.centralPressureExactDynePerCm2).toBeGreaterThan(
      uniform.centralPressureExactDynePerCm2
    );
  });

  it("returns a solar-normalized ratio relative to the Sun reference state", () => {
    expect(normalizedSolarRatio(2, 1)).toBeCloseTo(2, 12);
    expect(normalizedSolarRatio(0, 1)).toBe(0);
  });

  it("includes the required checkpoint prompts", () => {
    expect(HYDROSTATIC_CHALLENGES).toHaveLength(5);
    expect(HYDROSTATIC_CHALLENGES[0].prompt).toContain("fixed mass");
    expect(HYDROSTATIC_CHALLENGES[1].prompt).toContain("True or false");
    expect(HYDROSTATIC_CHALLENGES[2].prompt).toContain("negative sign");
    expect(HYDROSTATIC_CHALLENGES[3].prompt).toContain("half the radius");
    expect(HYDROSTATIC_CHALLENGES[4].prompt).toContain("still be evolving");
  });

  it("orders the guided student flow from prediction to synthesis", () => {
    expect(GUIDED_STEPS.map((step) => step.id)).toEqual([
      "predict",
      "local-shell",
      "global-profile",
      "compactness",
      "density-model",
      "thermal-bridge",
      "synthesis"
    ]);
    expect(GUIDED_STEPS[0].tag).toBe("Predict");
    expect(GUIDED_STEPS.at(-1)?.tag).toBe("Synthesis");
  });

  it("reveals only the step-appropriate student surfaces", () => {
    expect(guidedStepPresentation("predict")).toMatchObject({
      showPresetChooser: true,
      showPredictionCard: true,
      showShellStage: false,
      showProfileStage: false,
      showMassRadiusControls: false,
      showDensityModelControls: false,
      showThermalBridge: false,
      showSynthesisCard: false
    });

    expect(guidedStepPresentation("local-shell")).toMatchObject({
      showPresetChooser: false,
      showPredictionCard: false,
      showShellStage: true,
      showLocalShellStateControls: true,
      showProfileStage: false,
      showMassRadiusControls: false,
      showDensityModelControls: false,
      showThermalBridge: false
    });

    expect(guidedStepPresentation("compactness")).toMatchObject({
      showShellStage: true,
      showProfileStage: true,
      showMassRadiusControls: true,
      showDensityModelControls: false,
      showThermalBridge: false,
      showReadoutStrip: true
    });

    expect(guidedStepPresentation("thermal-bridge")).toMatchObject({
      showShellStage: true,
      showProfileStage: true,
      showMassRadiusControls: true,
      showDensityModelControls: true,
      showThermalBridge: true,
      showSynthesisCard: false
    });

    expect(guidedStepPresentation("synthesis")).toMatchObject({
      showShellStage: true,
      showProfileStage: true,
      showThermalBridge: true,
      showCheckpointDeck: true,
      showSynthesisCard: true
    });
  });

  it("keeps profile teaching notes tied to the intended misconception fixes", () => {
    expect(profileTeachingNote("pressure")).toContain("Pressure alone");
    expect(profileTeachingNote("pressure-gradient")).toContain("support-producing quantity");
    expect(profileTeachingNote("enclosed-mass")).toContain("inside the shell");
    expect(profileTeachingNote("gravity")).toContain("inward pull");
    expect(profileTeachingNote("density")).toContain("centrally concentrated");
  });

  it("switches from a named preset to custom when the scenario is edited", () => {
    expect(matchingPresetId(HYDROSTATIC_PRESETS["sun-like"])).toBe("sun-like");
    expect(
      matchingPresetId({
        ...HYDROSTATIC_PRESETS["sun-like"],
        radiusSolarRadius: 0.83
      })
    ).toBeNull();
  });
});
