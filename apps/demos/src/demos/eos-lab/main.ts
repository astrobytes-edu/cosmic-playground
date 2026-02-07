import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  renderMath,
  setLiveRegionText
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import {
  StellarEosModel,
  type StellarCompositionFractions,
  type StellarEosStateCgs
} from "@cosmic/physics";
import {
  clamp,
  compositionFromXY,
  formatFraction,
  formatScientific,
  gasDeepDiveData,
  gasEquationLatex,
  logSliderToValue,
  percent,
  pressureBarPercent,
  pressureCurveData,
  pressureTone,
  radDeepDiveData,
  radEquationLatex,
  degDeepDiveData,
  degEquationLatex,
  superscript,
  valueToLogSlider
} from "./logic";
import { createEosPlot, destroyPlot, resolveCssColor } from "./uplotHelpers";
import type { uPlot } from "./uplotHelpers";
import { renderRegimeMap, invalidateRegimeGrid } from "./regimeMap";
import {
  GasPressureAnimation,
  RadiationPressureAnimation,
  DegeneracyPressureAnimation
} from "./mechanismViz";
import type { MechanismAnimation } from "./mechanismViz";

/* ================================================================
 * Formatting helpers
 * ================================================================ */

/** Format log-scale tick values as 10^n using Unicode superscripts. */
const logTickValues = (_self: unknown, splits: number[]) =>
  splits.map(v => {
    if (v <= 0) return "";
    const exp = Math.round(Math.log10(v));
    if (Math.abs(v - Math.pow(10, exp)) / v > 0.01) return "";
    return `10${superscript(exp)}`;
  });

/* ================================================================
 * Presets
 * ================================================================ */

type Preset = {
  id:
    | "solar-core"
    | "solar-envelope"
    | "massive-core"
    | "red-giant-envelope"
    | "white-dwarf-core"
    | "brown-dwarf-interior";
  label: string;
  note: string;
  expectedDominance: string;
  temperatureK: number;
  densityGPerCm3: number;
  composition: StellarCompositionFractions;
};

const PRESETS: readonly Preset[] = [
  {
    id: "solar-core",
    label: "Solar core",
    note: "Hot and dense plasma where gas pressure dominates but radiation is non-negligible.",
    expectedDominance: "Gas with meaningful radiation fraction",
    temperatureK: 1.57e7,
    densityGPerCm3: 150,
    composition: { hydrogenMassFractionX: 0.34, heliumMassFractionY: 0.64, metalMassFractionZ: 0.02 }
  },
  {
    id: "solar-envelope",
    label: "Solar envelope",
    note: "Cool, low-density layers with weak radiation and negligible degeneracy.",
    expectedDominance: "Gas",
    temperatureK: 5800,
    densityGPerCm3: 1e-7,
    composition: { hydrogenMassFractionX: 0.74, heliumMassFractionY: 0.24, metalMassFractionZ: 0.02 }
  },
  {
    id: "massive-core",
    label: "Massive-star core",
    note: "Higher core temperatures increase radiation support strongly via T^4 scaling.",
    expectedDominance: "Radiation can become competitive",
    temperatureK: 4e7,
    densityGPerCm3: 10,
    composition: { hydrogenMassFractionX: 0.35, heliumMassFractionY: 0.63, metalMassFractionZ: 0.02 }
  },
  {
    id: "red-giant-envelope",
    label: "Red giant envelope",
    note: "Very low density keeps both radiation and degeneracy weak in envelope layers.",
    expectedDominance: "Gas",
    temperatureK: 4000,
    densityGPerCm3: 1e-9,
    composition: { hydrogenMassFractionX: 0.7, heliumMassFractionY: 0.28, metalMassFractionZ: 0.02 }
  },
  {
    id: "white-dwarf-core",
    label: "White dwarf core",
    note: "Extreme density drives electron degeneracy pressure dominance.",
    expectedDominance: "Electron degeneracy",
    temperatureK: 1e7,
    densityGPerCm3: 1e6,
    composition: { hydrogenMassFractionX: 0, heliumMassFractionY: 0.98, metalMassFractionZ: 0.02 }
  },
  {
    id: "brown-dwarf-interior",
    label: "Brown dwarf interior",
    note: "Intermediate regime where degeneracy becomes important without full white-dwarf conditions.",
    expectedDominance: "Gas/degeneracy transition",
    temperatureK: 1e6,
    densityGPerCm3: 100,
    composition: { hydrogenMassFractionX: 0.7, heliumMassFractionY: 0.28, metalMassFractionZ: 0.02 }
  }
] as const;

const PRESET_BY_ID: Record<Preset["id"], Preset> = PRESETS.reduce(
  (acc, preset) => { acc[preset.id] = preset; return acc; },
  {} as Record<Preset["id"], Preset>
);

/* ================================================================
 * Constants
 * ================================================================ */

const TEMPERATURE_MIN_K = 1e3;
const TEMPERATURE_MAX_K = 1e9;
const DENSITY_MIN_G_PER_CM3 = 1e-10;
const DENSITY_MAX_G_PER_CM3 = 1e10;

/* ================================================================
 * DOM queries
 * ================================================================ */

function q<T extends HTMLElement>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Missing DOM element: ${sel}`);
  return el;
}

const tempSlider = q<HTMLInputElement>("#tempSlider");
const tempValue = q<HTMLSpanElement>("#tempValue");
const rhoSlider = q<HTMLInputElement>("#rhoSlider");
const rhoValue = q<HTMLSpanElement>("#rhoValue");
const xSlider = q<HTMLInputElement>("#xSlider");
const xValue = q<HTMLSpanElement>("#xValue");
const ySlider = q<HTMLInputElement>("#ySlider");
const yValue = q<HTMLSpanElement>("#yValue");
const zValue = q<HTMLSpanElement>("#zValue");
const presetNote = q<HTMLParagraphElement>("#presetNote");

const radiationClosureChip = q("#radiationClosureChip");
const radiationClosureLabel = q("#radiationClosureLabel");
const radiationClosureNote = q("#radiationClosureNote");

const cardGas = q("#cardGas");
const cardRadiation = q("#cardRadiation");
const cardDegeneracy = q("#cardDegeneracy");

const pGasValue = q("#pGasValue");
const pGasBar = q("#pGasBar");
const pRadValue = q("#pRadValue");
const pRadBar = q("#pRadBar");
const pDegValue = q("#pDegValue");
const pDegBar = q("#pDegBar");
const pTotalValue = q("#pTotalValue");
const dominantChannel = q("#dominantChannel");
const pressureCurvePlotEl = q("#pressureCurvePlot");
const regimeMapCanvas = q<HTMLCanvasElement>("#regimeMapCanvas");
const regimeDetail = q("#regimeDetail");
const regimeSummary = q("#regimeSummary");

const muValue = q("#muValue");
const muEValue = q("#muEValue");
const betaValue = q("#betaValue");
const radGasValue = q("#radGasValue");
const degTotalValue = q("#degTotalValue");
const chiDegValue = q("#chiDegValue");
const degRegimeValue = q("#degRegimeValue");
const xFValue = q("#xFValue");
const fermiRegimeValue = q("#fermiRegimeValue");
const finiteTCorrectionValue = q("#finiteTCorrectionValue");
const finiteTValidityValue = q("#finiteTValidityValue");
const neutronExtensionValue = q("#neutronExtensionValue");

const stationModeButton = q<HTMLButtonElement>("#stationMode");
const helpButton = q<HTMLButtonElement>("#help");
const copyResults = q<HTMLButtonElement>("#copyResults");
const status = q<HTMLParagraphElement>("#status");

const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("button.preset[data-preset-id]")
);

/* ================================================================
 * Deep-dive panel DOM queries
 * ================================================================ */

const pressureGrid = q(".pressure-grid");

const deepDiveGas = q<HTMLElement>("#deepDiveGas");
const deepDiveRadiation = q<HTMLElement>("#deepDiveRadiation");
const deepDiveDegeneracy = q<HTMLElement>("#deepDiveDegeneracy");

const gasAnimCanvas = q<HTMLCanvasElement>("#gasAnimCanvas");
const radAnimCanvas = q<HTMLCanvasElement>("#radAnimCanvas");
const degAnimCanvas = q<HTMLCanvasElement>("#degAnimCanvas");

const gasEquationEl = q("#gasEquation");
const radEquationEl = q("#radEquation");
const degEquationEl = q("#degEquation");

const gasDeepT = q<HTMLInputElement>("#gasDeepT");
const gasDeepTVal = q("#gasDeepTVal");
const gasDeepRho = q<HTMLInputElement>("#gasDeepRho");
const gasDeepRhoVal = q("#gasDeepRhoVal");
const gasDeepChartEl = q("#gasDeepChart");

const radDeepT = q<HTMLInputElement>("#radDeepT");
const radDeepTVal = q("#radDeepTVal");
const radDeepChartEl = q("#radDeepChart");

const degDeepRho = q<HTMLInputElement>("#degDeepRho");
const degDeepRhoVal = q("#degDeepRhoVal");
const degDeepChartEl = q("#degDeepChart");

/* ================================================================
 * Runtime + state
 * ================================================================ */

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:eos-lab:mode",
  url: new URL(window.location.href)
});

type DemoState = {
  selectedPresetId: Preset["id"];
  temperatureK: number;
  densityGPerCm3: number;
  composition: StellarCompositionFractions;
  radiationDepartureEta: number;
};

const state: DemoState = {
  selectedPresetId: "solar-core",
  temperatureK: PRESET_BY_ID["solar-core"].temperatureK,
  densityGPerCm3: PRESET_BY_ID["solar-core"].densityGPerCm3,
  composition: PRESET_BY_ID["solar-core"].composition,
  radiationDepartureEta: 1
};

/** Most recent model evaluation — used by the marker plugin. */
let lastModel: StellarEosStateCgs | null = null;

function evaluateModel(): StellarEosStateCgs {
  return StellarEosModel.evaluateStateCgs({
    input: {
      temperatureK: state.temperatureK,
      densityGPerCm3: state.densityGPerCm3,
      composition: state.composition,
      radiationDepartureEta: state.radiationDepartureEta
    }
  });
}

/* ================================================================
 * Pressure curve plot (uPlot, log-log axes)
 * ================================================================ */

const gasColor = resolveCssColor("--cp-success") || "#4ade80";
const radColor = resolveCssColor("--cp-accent") || "#38bdf8";
const degColor = resolveCssColor("--cp-glow-teal") || "#54cddc";
const totalColor = resolveCssColor("--cp-text1") || "#e0e0e0";
const markerColor = resolveCssColor("--cp-accent-amber") || "#f5a623";

/** uPlot plugin: draw a diamond marker at the current (rho, P_total) state. */
function currentStatePlugin(): { hooks: { draw: Array<(u: uPlot) => void> } } {
  return {
    hooks: {
      draw: [(u: uPlot) => {
        if (!lastModel) return;
        const rho = state.densityGPerCm3;
        const pTotal = lastModel.totalPressureDynePerCm2;
        if (!Number.isFinite(pTotal) || pTotal <= 0) return;

        const cx = u.valToPos(rho, "x", true);
        const cy = u.valToPos(pTotal, "y", true);
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

        const ctx = u.ctx;
        const dpr = window.devicePixelRatio ?? 1;
        const s = 6 * dpr;

        ctx.save();
        ctx.fillStyle = markerColor;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s, cy);
        ctx.lineTo(cx, cy + s);
        ctx.lineTo(cx - s, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }]
    }
  };
}

const initialCurveData = pressureCurveData({
  temperatureK: state.temperatureK,
  composition: state.composition,
  radiationDepartureEta: state.radiationDepartureEta,
});

const pressurePlotHandle = createEosPlot(pressureCurvePlotEl, {
  scales: { x: { distr: 3 }, y: { distr: 3 } },
  series: [
    {},
    { label: "P_gas", stroke: gasColor, width: 2 },
    { label: "P_rad", stroke: radColor, width: 2 },
    { label: "P_deg,e", stroke: degColor, width: 2 },
    { label: "P_total", stroke: totalColor, width: 2.5, dash: [6, 3] },
  ],
  axes: [
    { label: "\u03C1 (g cm\u207B\u00B3)", values: logTickValues },
    { label: "P (dyne cm\u207B\u00B2)", values: logTickValues },
  ],
  legend: { show: true },
  plugins: [currentStatePlugin()],
}, [
  initialCurveData.densities,
  initialCurveData.pGas,
  initialCurveData.pRad,
  initialCurveData.pDeg,
  initialCurveData.pTotal,
]);

/* ================================================================
 * Helper functions
 * ================================================================ */

function applyPreset(presetId: Preset["id"]): void {
  const preset = PRESET_BY_ID[presetId];
  state.selectedPresetId = preset.id;
  state.temperatureK = preset.temperatureK;
  state.densityGPerCm3 = preset.densityGPerCm3;
  state.composition = preset.composition;
}

function setCompositionFromXY(args: {
  hydrogenMassFractionX: number;
  heliumMassFractionY: number;
}): void {
  state.composition = compositionFromXY(args);
}

function renderPresetState(): void {
  for (const button of presetButtons) {
    const isActive = button.dataset.presetId === state.selectedPresetId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
  const preset = PRESET_BY_ID[state.selectedPresetId];
  const c = state.composition;
  presetNote.textContent = `${preset.note} Expected: ${preset.expectedDominance}. X=${formatFraction(c.hydrogenMassFractionX, 2)}, Y=${formatFraction(c.heliumMassFractionY, 2)}, Z=${formatFraction(c.metalMassFractionZ, 2)}.`;
}

function setPressureCard(
  card: HTMLElement,
  bar: HTMLElement,
  valueEl: HTMLElement,
  pressureDynePerCm2: number,
  dominantPressureDynePerCm2: number
): void {
  valueEl.textContent = formatScientific(pressureDynePerCm2, 4);
  const widthPct = pressureBarPercent({
    pressureDynePerCm2,
    maxPressureDynePerCm2: dominantPressureDynePerCm2
  });
  bar.style.width = `${widthPct.toFixed(1)}%`;
  card.dataset.tone = pressureTone({ pressureDynePerCm2, dominantPressureDynePerCm2 });
}

function renderRadiationClosure(model: StellarEosStateCgs): void {
  const closure = model.radiationClosureAssessment;
  const kind = closure.tag === "lte-like" ? "tip" : "warn";
  radiationClosureChip.setAttribute("data-kind", kind);
  radiationClosureLabel.textContent = closure.label;
  radiationClosureNote.textContent = closure.note;
}

function dominantPressureValue(model: StellarEosStateCgs): number {
  return Math.max(
    model.gasPressureDynePerCm2,
    model.radiationPressureDynePerCm2,
    model.electronDegeneracyPressureDynePerCm2,
    1
  );
}

function dominantChannelLabel(model: StellarEosStateCgs): string {
  switch (model.dominantPressureChannel) {
    case "gas": return "Gas pressure";
    case "radiation": return "Radiation pressure";
    case "degeneracy": return "Electron degeneracy pressure";
    case "extension": return "Extension pressure term(s)";
    case "mixed": return "Mixed (no single dominant channel)";
    default: return "Unavailable";
  }
}

function electronDegeneracyMethodLabel(
  method: StellarEosStateCgs["electronDegeneracyMethod"]
): string {
  switch (method) {
    case "nonrel-fd": return "Finite-T nonrelativistic Fermi-Dirac";
    case "relativistic-fd": return "Finite-T relativistic Fermi-Dirac";
    case "zero-t-limit": return "Zero-temperature limit";
    case "classical-limit": return "Classical electron limit";
    case "override": return "Custom override";
    default: return "Unavailable";
  }
}

function degeneracyRegimeLabelLatex(regime: StellarEosStateCgs["degeneracyRegime"]): string {
  switch (regime.tag) {
    case "strong": return `Strongly degenerate ($T/T_F \\ll 1$)`;
    case "transition": return `Transition regime ($T/T_F \\sim 1$)`;
    case "weak": return `Weakly/non-degenerate ($T/T_F \\gg 1$)`;
    default: return "Degeneracy diagnostic unavailable";
  }
}

function fermiRelativityRegimeLabelLatex(regime: StellarEosStateCgs["fermiRelativityRegime"]): string {
  switch (regime.tag) {
    case "non-relativistic": return `Non-relativistic electron momenta ($x_F \\ll 1$)`;
    case "trans-relativistic": return `Trans-relativistic electron momenta ($x_F \\sim 1$)`;
    case "relativistic": return `Relativistic electron momenta ($x_F > 1$)`;
    default: return "Fermi relativity diagnostic unavailable";
  }
}

/* ================================================================
 * Advanced diagnostics
 * ================================================================ */

function renderAdvancedDiagnostics(model: StellarEosStateCgs): void {
  xFValue.textContent = formatScientific(model.fermiRelativityX, 5);
  fermiRegimeValue.textContent = fermiRelativityRegimeLabelLatex(model.fermiRelativityRegime);
  renderMath(fermiRegimeValue);
  finiteTCorrectionValue.textContent = Number.isFinite(model.finiteTemperatureDegeneracyCorrectionFactor)
    ? formatScientific(model.finiteTemperatureDegeneracyCorrectionFactor, 5)
    : "\u2014";
  finiteTValidityValue.textContent = `${model.finiteTemperatureDegeneracyAssessment.label} (${electronDegeneracyMethodLabel(model.electronDegeneracyMethod)})`;
  renderMath(finiteTValidityValue);
  neutronExtensionValue.textContent = formatScientific(model.neutronExtensionPressureDynePerCm2, 5);
}

/* ================================================================
 * Export results
 * ================================================================ */

function exportResults(model: StellarEosStateCgs): ExportPayloadV1 {
  const c = model.normalizedComposition;
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Preset", value: PRESET_BY_ID[state.selectedPresetId].label },
      { name: "Temperature T (K)", value: formatScientific(model.input.temperatureK, 4) },
      { name: "Density rho (g cm^-3)", value: formatScientific(model.input.densityGPerCm3, 4) },
      { name: "Composition mass fractions (X,Y,Z)", value: `(${formatFraction(c.hydrogenMassFractionX, 3)}, ${formatFraction(c.heliumMassFractionY, 3)}, ${formatFraction(c.metalMassFractionZ, 3)})` }
    ],
    readouts: [
      { name: "mu (mean mass per particle in m_u)", value: formatFraction(model.meanMolecularWeightMu, 5) },
      { name: "mu_e (mean mass per electron in m_u)", value: formatFraction(model.meanMolecularWeightMuE, 5) },
      { name: "P_gas (dyne cm^-2)", value: formatScientific(model.gasPressureDynePerCm2, 5) },
      { name: "P_rad (dyne cm^-2)", value: formatScientific(model.radiationPressureDynePerCm2, 5) },
      { name: "P_deg,e (dyne cm^-2)", value: formatScientific(model.electronDegeneracyPressureDynePerCm2, 5) },
      { name: "P_tot (dyne cm^-2)", value: formatScientific(model.totalPressureDynePerCm2, 5) },
      { name: "P_rad/P_gas", value: formatScientific(model.pressureRatios.radiationToGas, 5) },
      { name: "P_deg,e/P_tot", value: formatScientific(model.pressureRatios.degeneracyToTotal, 5) },
      { name: "beta=P_gas/P_tot", value: formatScientific(model.pressureRatios.betaGasToTotal, 5) },
      { name: "chi_deg=T/T_F", value: formatScientific(model.chiDegeneracy, 5) },
      { name: "x_F=p_F/(m_e c)", value: formatScientific(model.fermiRelativityX, 5) },
      { name: "Fermi relativity regime", value: model.fermiRelativityRegime.label },
      {
        name: "Sommerfeld factor 1 + (5*pi^2/12)(T/T_F)^2",
        value: Number.isFinite(model.finiteTemperatureDegeneracyCorrectionFactor)
          ? formatScientific(model.finiteTemperatureDegeneracyCorrectionFactor, 5)
          : "\u2014"
      },
      {
        name: "Finite-T validity",
        value: `${model.finiteTemperatureDegeneracyAssessment.label} (${electronDegeneracyMethodLabel(model.electronDegeneracyMethod)})`
      },
      { name: "P_e,FD (dyne cm^-2)", value: formatScientific(model.electronPressureFiniteTDynePerCm2, 5) },
      { name: "P_e,classical (dyne cm^-2)", value: formatScientific(model.electronPressureClassicalDynePerCm2, 5) },
      { name: "Extension pressure P_ext (dyne cm^-2)", value: formatScientific(model.extensionPressureDynePerCm2, 5) },
      { name: "Neutron extension pressure (dyne cm^-2)", value: formatScientific(model.neutronExtensionPressureDynePerCm2, 5) },
      { name: "Dominant pressure channel", value: dominantChannelLabel(model) }
    ],
    notes: [
      "Gas pressure uses P_gas = rho k_B T / (mu m_u).",
      "Radiation pressure uses an LTE-like closure P_rad = eta_rad a T^4 / 3 (default eta_rad=1).",
      "Finite-T electron pressure uses Fermi-Dirac EOS (nonrel first, relativistic branch for large x_F).",
      "Displayed degeneracy channel uses P_deg,e = max(P_e,FD - n_e k_B T, 0) to avoid double-counting classical electrons.",
      "Finite-temperature Sommerfeld factor uses 1 + (5*pi^2/12)(T/T_F)^2 only in the non-relativistic strongly degenerate regime.",
      "Kernel supports additional pressure terms for future pair-rich and neutron-matter extensions without API breakage."
    ]
  };
}

/* ================================================================
 * Render (main update loop)
 * ================================================================ */

function render(args: { deferGridRebuild?: boolean } = {}): void {
  // --- Sync slider positions ---
  const temperatureSliderValue = valueToLogSlider({
    value: state.temperatureK,
    sliderMin: 0, sliderMax: 1000,
    valueMin: TEMPERATURE_MIN_K, valueMax: TEMPERATURE_MAX_K
  });
  const densitySliderValue = valueToLogSlider({
    value: state.densityGPerCm3,
    sliderMin: 0, sliderMax: 1000,
    valueMin: DENSITY_MIN_G_PER_CM3, valueMax: DENSITY_MAX_G_PER_CM3
  });

  tempSlider.value = Number.isFinite(temperatureSliderValue) ? String(Math.round(temperatureSliderValue)) : "0";
  rhoSlider.value = Number.isFinite(densitySliderValue) ? String(Math.round(densitySliderValue)) : "0";

  tempValue.textContent = `${formatScientific(state.temperatureK, 4)} K`;
  rhoValue.textContent = `${formatScientific(state.densityGPerCm3, 4)} g cm^-3`;

  // --- Composition sliders ---
  const x = state.composition.hydrogenMassFractionX;
  const y = state.composition.heliumMassFractionY;
  const z = state.composition.metalMassFractionZ;
  const yMax = Math.max(0, Math.round(1000 * (1 - x)));

  xSlider.value = String(Math.round(1000 * x));
  ySlider.max = String(yMax);
  ySlider.value = String(Math.min(Math.round(1000 * y), yMax));

  xValue.textContent = formatFraction(x, 3);
  yValue.textContent = formatFraction(y, 3);
  zValue.textContent = formatFraction(z, 3);

  // --- Evaluate physics model ---
  const model = evaluateModel();
  lastModel = model;

  // --- Pressure curves (uPlot) ---
  const curveData = pressureCurveData({
    temperatureK: state.temperatureK,
    composition: state.composition,
    radiationDepartureEta: state.radiationDepartureEta,
  });
  pressurePlotHandle.plot.setData([
    curveData.densities,
    curveData.pGas,
    curveData.pRad,
    curveData.pDeg,
    curveData.pTotal,
  ]);

  // --- Regime map (Canvas 2D) ---
  renderRegimeMap(regimeMapCanvas, {
    composition: state.composition,
    radiationDepartureEta: state.radiationDepartureEta,
    currentLogT: Math.log10(state.temperatureK),
    currentLogRho: Math.log10(state.densityGPerCm3),
    presets: PRESETS.map(p => ({
      id: p.id,
      logT: Math.log10(p.temperatureK),
      logRho: Math.log10(p.densityGPerCm3),
    })),
    deferGridRebuild: args.deferGridRebuild,
  });

  // --- Regime map detail text ---
  const logT = Math.log10(model.input.temperatureK);
  const logRho = Math.log10(model.input.densityGPerCm3);
  regimeDetail.textContent = `Point details: $\\log_{10}(T/\\mathrm{K})=${formatFraction(logT, 2)}$, $\\log_{10}(\\rho/(\\mathrm{g\\ cm^{-3}}))=${formatFraction(logRho, 2)}$, $P_{\\rm rad}/P_{\\rm gas}=${formatScientific(model.pressureRatios.radiationToGas, 3)}$, $P_{\\rm deg,e}/P_{\\rm tot}=${formatScientific(model.pressureRatios.degeneracyToTotal, 3)}$.`;
  regimeSummary.textContent = `Interpretation: ${dominantChannelLabel(model)} dominates at the highlighted state; white markers show preset anchors.`;
  renderMath(regimeDetail);
  renderMath(regimeSummary);

  // --- Pressure cards ---
  const dominantP = dominantPressureValue(model);
  setPressureCard(cardGas, pGasBar, pGasValue, model.gasPressureDynePerCm2, dominantP);
  setPressureCard(cardRadiation, pRadBar, pRadValue, model.radiationPressureDynePerCm2, dominantP);
  setPressureCard(cardDegeneracy, pDegBar, pDegValue, model.electronDegeneracyPressureDynePerCm2, dominantP);

  pTotalValue.textContent = formatScientific(model.totalPressureDynePerCm2, 5);
  dominantChannel.textContent = dominantChannelLabel(model);

  // --- Readouts ---
  muValue.textContent = formatFraction(model.meanMolecularWeightMu, 5);
  muEValue.textContent = formatFraction(model.meanMolecularWeightMuE, 5);
  betaValue.textContent = percent(model.pressureRatios.betaGasToTotal, 2);
  radGasValue.textContent = formatScientific(model.pressureRatios.radiationToGas, 5);
  degTotalValue.textContent = percent(model.pressureRatios.degeneracyToTotal, 2);
  chiDegValue.textContent = formatScientific(model.chiDegeneracy, 5);
  degRegimeValue.textContent = degeneracyRegimeLabelLatex(model.degeneracyRegime);
  renderMath(degRegimeValue);

  renderRadiationClosure(model);
  renderAdvancedDiagnostics(model);
  renderPresetState();

  // --- Debug / E2E interface ---
  (window as Window & { __cp?: unknown }).__cp = {
    slug: "eos-lab",
    mode: runtime.mode,
    exportResults: () => exportResults(model)
  };
}

/* ================================================================
 * Deep-dive panel system
 * ================================================================ */

type DeepDiveChannel = "gas" | "radiation" | "degeneracy";
let activeDeepDive: DeepDiveChannel | null = null;
let activeAnimation: MechanismAnimation | null = null;
let deepDivePlotHandle: ReturnType<typeof createEosPlot> | null = null;

const deepDivePanels: Record<DeepDiveChannel, HTMLElement> = {
  gas: deepDiveGas,
  radiation: deepDiveRadiation,
  degeneracy: deepDiveDegeneracy,
};

const deepDiveCanvases: Record<DeepDiveChannel, HTMLCanvasElement> = {
  gas: gasAnimCanvas,
  radiation: radAnimCanvas,
  degeneracy: degAnimCanvas,
};

/** Deep-dive local state (independent of global sliders). */
const deepDiveState = {
  gasT: state.temperatureK,
  gasRho: state.densityGPerCm3,
  radT: state.temperatureK,
  degRho: state.densityGPerCm3,
};

function syncDeepDiveSliders(channel: DeepDiveChannel): void {
  if (channel === "gas") {
    deepDiveState.gasT = state.temperatureK;
    deepDiveState.gasRho = state.densityGPerCm3;
    gasDeepT.value = String(Math.round(valueToLogSlider({
      value: deepDiveState.gasT, sliderMin: 0, sliderMax: 1000,
      valueMin: TEMPERATURE_MIN_K, valueMax: TEMPERATURE_MAX_K,
    })));
    gasDeepRho.value = String(Math.round(valueToLogSlider({
      value: deepDiveState.gasRho, sliderMin: 0, sliderMax: 1000,
      valueMin: DENSITY_MIN_G_PER_CM3, valueMax: DENSITY_MAX_G_PER_CM3,
    })));
  } else if (channel === "radiation") {
    deepDiveState.radT = state.temperatureK;
    radDeepT.value = String(Math.round(valueToLogSlider({
      value: deepDiveState.radT, sliderMin: 0, sliderMax: 1000,
      valueMin: TEMPERATURE_MIN_K, valueMax: TEMPERATURE_MAX_K,
    })));
  } else {
    deepDiveState.degRho = state.densityGPerCm3;
    degDeepRho.value = String(Math.round(valueToLogSlider({
      value: deepDiveState.degRho, sliderMin: 0, sliderMax: 1000,
      valueMin: DENSITY_MIN_G_PER_CM3, valueMax: DENSITY_MAX_G_PER_CM3,
    })));
  }
}

function renderDeepDiveContent(channel: DeepDiveChannel): void {
  if (channel === "gas") {
    const T = deepDiveState.gasT;
    const rho = deepDiveState.gasRho;
    const gasEos = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: T,
        densityGPerCm3: rho,
        composition: state.composition,
        radiationDepartureEta: state.radiationDepartureEta,
      },
    });
    const mu = gasEos.meanMolecularWeightMu;
    const pGas = gasEos.gasPressureDynePerCm2;
    gasDeepTVal.textContent = `${formatScientific(T, 4)} K`;
    gasDeepRhoVal.textContent = `${formatScientific(rho, 4)} g cm^-3`;
    gasEquationEl.textContent = `$$${gasEquationLatex({ rho, T, mu, pGas })}$$`;
    renderMath(gasEquationEl);

    const data = gasDeepDiveData({ temperatureK: T, composition: state.composition });
    if (deepDivePlotHandle) {
      deepDivePlotHandle.plot.setData([data.densities, data.pGas]);
    }
    activeAnimation?.updateParams({ logT: Math.log10(T), logRho: Math.log10(rho) });

  } else if (channel === "radiation") {
    const T = deepDiveState.radT;
    const radEos = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: T,
        densityGPerCm3: state.densityGPerCm3,
        composition: state.composition,
        radiationDepartureEta: state.radiationDepartureEta,
      },
    });
    const pRad = radEos.radiationPressureDynePerCm2;
    radDeepTVal.textContent = `${formatScientific(T, 4)} K`;
    radEquationEl.textContent = `$$${radEquationLatex({ T, pRad })}$$`;
    renderMath(radEquationEl);

    const data = radDeepDiveData({ rhoForComparison: state.densityGPerCm3, composition: state.composition });
    if (deepDivePlotHandle) {
      deepDivePlotHandle.plot.setData([data.temperatures, data.pRad, data.pGas]);
    }
    activeAnimation?.updateParams({ logT: Math.log10(T) });

  } else {
    const rho = deepDiveState.degRho;
    const eosResult = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: state.temperatureK,
        densityGPerCm3: rho,
        composition: state.composition,
        radiationDepartureEta: state.radiationDepartureEta,
      },
    });
    const pDeg = eosResult.electronDegeneracyPressureDynePerCm2;
    const muE = eosResult.meanMolecularWeightMuE;
    degDeepRhoVal.textContent = `${formatScientific(rho, 4)} g cm^-3`;
    degEquationEl.textContent = `$$${degEquationLatex({ rho, muE, xF: eosResult.fermiRelativityX, pDeg })}$$`;
    renderMath(degEquationEl);

    const data = degDeepDiveData({ temperatureK: state.temperatureK, composition: state.composition });
    if (deepDivePlotHandle) {
      deepDivePlotHandle.plot.setData([data.densities, data.pDeg, data.pGas]);
    }
    activeAnimation?.updateParams({ logRho: Math.log10(rho) });
  }
}

function createDeepDivePlot(channel: DeepDiveChannel): void {
  if (deepDivePlotHandle) {
    destroyPlot(deepDivePlotHandle);
    deepDivePlotHandle = null;
  }

  if (channel === "gas") {
    const data = gasDeepDiveData({ temperatureK: deepDiveState.gasT, composition: state.composition });
    deepDivePlotHandle = createEosPlot(gasDeepChartEl, {
      scales: { x: { distr: 3 }, y: { distr: 3 } },
      series: [
        {},
        { label: "P_gas", stroke: gasColor, width: 2 },
      ],
      axes: [
        { label: "\u03C1 (g cm\u207B\u00B3)", values: logTickValues },
        { label: "P (dyne cm\u207B\u00B2)", values: logTickValues },
      ],
    }, [data.densities, data.pGas]);

  } else if (channel === "radiation") {
    const data = radDeepDiveData({ rhoForComparison: state.densityGPerCm3, composition: state.composition });
    deepDivePlotHandle = createEosPlot(radDeepChartEl, {
      scales: { x: { distr: 3 }, y: { distr: 3 } },
      series: [
        {},
        { label: "P_rad", stroke: radColor, width: 2 },
        { label: "P_gas (comparison)", stroke: gasColor, width: 1.5, dash: [4, 2] },
      ],
      axes: [
        { label: "T (K)", values: logTickValues },
        { label: "P (dyne cm\u207B\u00B2)", values: logTickValues },
      ],
    }, [data.temperatures, data.pRad, data.pGas]);

  } else {
    const data = degDeepDiveData({ temperatureK: state.temperatureK, composition: state.composition });
    deepDivePlotHandle = createEosPlot(degDeepChartEl, {
      scales: { x: { distr: 3 }, y: { distr: 3 } },
      series: [
        {},
        { label: "P_deg,e", stroke: degColor, width: 2 },
        { label: "P_gas (comparison)", stroke: gasColor, width: 1.5, dash: [4, 2] },
      ],
      axes: [
        { label: "\u03C1 (g cm\u207B\u00B3)", values: logTickValues },
        { label: "P (dyne cm\u207B\u00B2)", values: logTickValues },
      ],
    }, [data.densities, data.pDeg, data.pGas]);
  }
}

function openDeepDive(channel: DeepDiveChannel): void {
  closeDeepDive();
  activeDeepDive = channel;

  pressureGrid.setAttribute("hidden", "");
  deepDivePanels[channel].removeAttribute("hidden");

  syncDeepDiveSliders(channel);
  createDeepDivePlot(channel);

  const AnimClass = channel === "gas" ? GasPressureAnimation
    : channel === "radiation" ? RadiationPressureAnimation
    : DegeneracyPressureAnimation;
  activeAnimation = new AnimClass();
  activeAnimation.start(deepDiveCanvases[channel]);
  const animT = channel === "degeneracy" ? state.temperatureK : (channel === "gas" ? deepDiveState.gasT : deepDiveState.radT);
  const animRho = channel === "radiation" ? 1 : (channel === "gas" ? deepDiveState.gasRho : deepDiveState.degRho);
  activeAnimation.updateParams({ logT: Math.log10(animT), logRho: Math.log10(animRho) });

  renderDeepDiveContent(channel);
}

function closeDeepDive(): void {
  if (!activeDeepDive) return;

  activeAnimation?.stop();
  activeAnimation = null;
  if (deepDivePlotHandle) {
    destroyPlot(deepDivePlotHandle);
    deepDivePlotHandle = null;
  }

  deepDivePanels[activeDeepDive].setAttribute("hidden", "");
  pressureGrid.removeAttribute("hidden");
  activeDeepDive = null;
}

// Card click handlers
cardGas.addEventListener("click", () => openDeepDive("gas"));
cardRadiation.addEventListener("click", () => openDeepDive("radiation"));
cardDegeneracy.addEventListener("click", () => openDeepDive("degeneracy"));

// Keyboard activation for card buttons
for (const card of [cardGas, cardRadiation, cardDegeneracy]) {
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });
}

// Back buttons
for (const panel of Object.values(deepDivePanels)) {
  const backBtn = panel.querySelector(".deep-dive__back");
  backBtn?.addEventListener("click", closeDeepDive);
}

// Deep-dive slider handlers
gasDeepT.addEventListener("input", () => {
  deepDiveState.gasT = logSliderToValue({
    sliderValue: clamp(Number(gasDeepT.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: TEMPERATURE_MIN_K, valueMax: TEMPERATURE_MAX_K,
  });
  renderDeepDiveContent("gas");
});

gasDeepRho.addEventListener("input", () => {
  deepDiveState.gasRho = logSliderToValue({
    sliderValue: clamp(Number(gasDeepRho.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: DENSITY_MIN_G_PER_CM3, valueMax: DENSITY_MAX_G_PER_CM3,
  });
  renderDeepDiveContent("gas");
});

radDeepT.addEventListener("input", () => {
  deepDiveState.radT = logSliderToValue({
    sliderValue: clamp(Number(radDeepT.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: TEMPERATURE_MIN_K, valueMax: TEMPERATURE_MAX_K,
  });
  renderDeepDiveContent("radiation");
});

degDeepRho.addEventListener("input", () => {
  deepDiveState.degRho = logSliderToValue({
    sliderValue: clamp(Number(degDeepRho.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: DENSITY_MIN_G_PER_CM3, valueMax: DENSITY_MAX_G_PER_CM3,
  });
  renderDeepDiveContent("degeneracy");
});

/* ================================================================
 * Demo modes (help + station)
 * ================================================================ */

const demoModes = createDemoModes({
  help: {
    title: "Help / Shortcuts",
    subtitle: "Keyboard shortcuts work when focus is not in an input field.",
    sections: [
      {
        heading: "Shortcuts",
        type: "shortcuts",
        items: [
          { key: "?", action: "Toggle help" },
          { key: "g", action: "Toggle station mode" }
        ]
      },
      {
        heading: "How to use this lab",
        type: "bullets",
        items: [
          "Choose a preset, then move T and rho sliders to test pressure dominance changes.",
          "Adjust composition sliders X and Y (with Z computed) to connect mu and mu_e to particle and electron density changes.",
          "Use the LTE closure chip before interpreting P_rad in extreme low-density states."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: EOS Lab",
    subtitle: "Capture pressure-channel evidence with units.",
    steps: [
      "Record at least three presets (including white dwarf core).",
      "For one preset, increase T by about 10x and compare P_rad/P_gas.",
      "Explain when degeneracy validity (T/T_F) supports using the zero-T baseline."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "temperatureK", label: "T (K)" },
      { key: "densityGPerCm3", label: "rho (g cm^-3)" },
      { key: "pGas", label: "P_gas (dyne cm^-2)" },
      { key: "pRad", label: "P_rad (dyne cm^-2)" },
      { key: "pDeg", label: "P_deg,e (dyne cm^-2)" },
      { key: "dominant", label: "Dominant" },
      { key: "chiDeg", label: "T/T_F" }
    ],
    getSnapshotRow() {
      const model = evaluateModel();
      return {
        case: PRESET_BY_ID[state.selectedPresetId].label,
        temperatureK: formatScientific(model.input.temperatureK, 4),
        densityGPerCm3: formatScientific(model.input.densityGPerCm3, 4),
        pGas: formatScientific(model.gasPressureDynePerCm2, 4),
        pRad: formatScientific(model.radiationPressureDynePerCm2, 4),
        pDeg: formatScientific(model.electronDegeneracyPressureDynePerCm2, 4),
        dominant: dominantChannelLabel(model),
        chiDeg: formatScientific(model.chiDegeneracy, 4)
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add EOS anchors",
        getRows() {
          return (["solar-core", "massive-core", "white-dwarf-core"] as Preset["id"][]).map(presetId => {
            const preset = PRESET_BY_ID[presetId];
            const model = StellarEosModel.evaluateStateCgs({
              input: {
                temperatureK: preset.temperatureK,
                densityGPerCm3: preset.densityGPerCm3,
                composition: preset.composition,
                radiationDepartureEta: 1
              }
            });
            return {
              case: preset.label,
              temperatureK: formatScientific(model.input.temperatureK, 4),
              densityGPerCm3: formatScientific(model.input.densityGPerCm3, 4),
              pGas: formatScientific(model.gasPressureDynePerCm2, 4),
              pRad: formatScientific(model.radiationPressureDynePerCm2, 4),
              pDeg: formatScientific(model.electronDegeneracyPressureDynePerCm2, 4),
              dominant: dominantChannelLabel(model),
              chiDeg: formatScientific(model.chiDegeneracy, 4)
            };
          });
        }
      }
    ],
    synthesisPrompt: `
      <p><strong>Explain:</strong> EOS support combines channels, but dominance changes with state.</p>
      <p><strong>Use your table:</strong> Compare one gas-dominated and one degeneracy-dominated case, then justify the LTE caution chip for radiation pressure.</p>
    `
  }
});

demoModes.bindButtons({ helpButton, stationButton: stationModeButton });

/* ================================================================
 * Event handlers
 * ================================================================ */

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const presetId = button.dataset.presetId as Preset["id"] | undefined;
    if (!presetId || !(presetId in PRESET_BY_ID)) return;
    applyPreset(presetId);
    render();
  });
}

tempSlider.addEventListener("input", () => {
  const nextT = logSliderToValue({
    sliderValue: clamp(Number(tempSlider.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: TEMPERATURE_MIN_K, valueMax: TEMPERATURE_MAX_K
  });
  if (Number.isFinite(nextT)) state.temperatureK = nextT;
  render();
});

rhoSlider.addEventListener("input", () => {
  const nextRho = logSliderToValue({
    sliderValue: clamp(Number(rhoSlider.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: DENSITY_MIN_G_PER_CM3, valueMax: DENSITY_MAX_G_PER_CM3
  });
  if (Number.isFinite(nextRho)) state.densityGPerCm3 = nextRho;
  render();
});

xSlider.addEventListener("input", () => {
  setCompositionFromXY({
    hydrogenMassFractionX: clamp(Number(xSlider.value) / 1000, 0, 1),
    heliumMassFractionY: state.composition.heliumMassFractionY
  });
  render({ deferGridRebuild: true });
});

ySlider.addEventListener("input", () => {
  setCompositionFromXY({
    hydrogenMassFractionX: state.composition.hydrogenMassFractionX,
    heliumMassFractionY: clamp(Number(ySlider.value) / 1000, 0, 1)
  });
  render({ deferGridRebuild: true });
});

function finalizeCompositionInteraction(): void {
  invalidateRegimeGrid();
  render();
}

xSlider.addEventListener("change", finalizeCompositionInteraction);
ySlider.addEventListener("change", finalizeCompositionInteraction);
xSlider.addEventListener("pointerup", finalizeCompositionInteraction);
ySlider.addEventListener("pointerup", finalizeCompositionInteraction);

copyResults.addEventListener("click", () => {
  const model = evaluateModel();
  setLiveRegionText(status, "Copying\u2026");
  void runtime
    .copyResults(exportResults(model))
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((err) => {
      setLiveRegionText(status, err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.");
    });
});

/* ================================================================
 * Initialization
 * ================================================================ */

applyPreset("solar-core");
render();
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) initPopovers(demoRoot);

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

window.addEventListener("beforeunload", () => {
  destroyPlot(pressurePlotHandle);
}, { once: true });
