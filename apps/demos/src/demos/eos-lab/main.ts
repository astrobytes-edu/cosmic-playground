import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  initTabs,
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
  gasEquationLatex,
  gasEquationSymbolic,
  logSliderToValue,
  percent,
  pressureBarPercent,
  pressureCurveData,
  pressureTone,
  radEquationLatex,
  radEquationSymbolic,
  degEquationLatex,
  degEquationSymbolic,
  superscript,
  valueToLogSlider,
  adiabaticIndex,
  solarProfileData,
  checkScalingAnswer,
  SCALING_CHALLENGES
} from "./logic";
import { createEosPlot, destroyPlot } from "./uplotHelpers";
import type { uPlot } from "./uplotHelpers";
import { renderRegimeMap, invalidateRegimeGrid } from "./regimeMap";
import {
  GasPressureAnimation,
  RadiationPressureAnimation,
  DegeneracyPressureAnimation
} from "./mechanismViz";

/* ================================================================
 * Formatting helpers
 * ================================================================ */

/** Cached renderMath — only re-renders KaTeX when text content changes. */
const lastMathText = new WeakMap<HTMLElement, string>();
function renderMathIfChanged(el: HTMLElement): void {
  const text = el.textContent ?? "";
  if (lastMathText.get(el) === text) return;
  lastMathText.set(el, text);
  renderMath(el);
}

/** Format log-scale tick values as 10^n using Unicode superscripts. */
const logTickValues = (_self: unknown, splits: number[]) =>
  splits.map(v => {
    if (v <= 0) return "";
    const exp = Math.round(Math.log10(v));
    if (Math.abs(v - Math.pow(10, exp)) / v > 0.01) return "";
    return `10${superscript(exp)}`;
  });

/**
 * uPlot log-scale range clamp for pressure axes.
 * uPlot's logAxisSplits overflows (RangeError) when the data range spans
 * more than ~40 decades.  Clamp Y-min to 1e-10 (far below any physically
 * meaningful pressure) to keep the splits count manageable.
 */
const logPressureRange = (_u: unknown, mn: number, mx: number): [number, number] =>
  [Math.max(mn, 1e-10), mx];

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
    note: "Extreme density drives electron degeneracy pressure dominance. Uses Y=0.98 (He-like composition); real WDs are C/O, but both give \\(\\mu_e \\approx 2\\).",
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
const showSolarProfileCb = q<HTMLInputElement>("#showSolarProfile");

const muValue = q("#muValue");
const muEValue = q("#muEValue");
const betaValue = q("#betaValue");
const radGasValue = q("#radGasValue");
const degTotalValue = q("#degTotalValue");
const chiDegValue = q("#chiDegValue");
const degRegimeValue = q("#degRegimeValue");
const gammaEffValue = q("#gammaEffValue");
const gammaEffNote = q("#gammaEffNote");
const xFValue = q("#xFValue");
const fermiRegimeValue = q("#fermiRegimeValue");
const finiteTCorrectionValue = q("#finiteTCorrectionValue");
const finiteTValidityValue = q("#finiteTValidityValue");
const neutronExtensionValue = q("#neutronExtensionValue");

const stageSummary = q(".stage-summary");
const stationModeButton = q<HTMLButtonElement>("#stationMode");
const helpButton = q<HTMLButtonElement>("#help");
const copyResults = q<HTMLButtonElement>("#copyResults");
const status = q<HTMLParagraphElement>("#status");

const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("button.preset[data-preset-id]")
);

/* ================================================================
 * Compare view (Tab 2) DOM queries
 * ================================================================ */

const compareT = q<HTMLInputElement>("#compareT");
const compareTVal = q("#compareTVal");
const compareRho = q<HTMLInputElement>("#compareRho");
const compareRhoVal = q("#compareRhoVal");
const compareX = q<HTMLInputElement>("#compareX");
const compareXVal = q("#compareXVal");
const compareY = q<HTMLInputElement>("#compareY");
const compareYVal = q("#compareYVal");
const compareMuVal = q("#compareMuVal");

const compareGasCanvas = q<HTMLCanvasElement>("#compareGasCanvas");
const compareRadCanvas = q<HTMLCanvasElement>("#compareRadCanvas");
const compareDegCanvas = q<HTMLCanvasElement>("#compareDegCanvas");

const compareGasEq = q("#compareGasEq");
const compareRadEq = q("#compareRadEq");
const compareDegEq = q("#compareDegEq");

const compareGasFlash = q("#compareGasFlash");
const compareRadFlash = q("#compareRadFlash");
const compareDegFlash = q("#compareDegFlash");

const comparePresetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("button.compare-preset[data-preset-id]")
);

const tab2Panel = q("#panel-understand");

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

// Vibrant, distinguishable channel colors — observatory console palette
const gasColor = "#34d399";     // emerald — thermal gas
const radColor = "#f472b6";     // pink — radiation heat
const degColor = "#a78bfa";     // violet — quantum degeneracy
const totalColor = "#fbbf24";   // amber — total
const markerColor = "#fbbf24";  // amber — state marker

// Expose channel colors as CSS custom properties for style.css (keeps hex out of CSS)
{
  const stage = document.querySelector<HTMLElement>(".cp-demo__stage");
  if (stage) {
    stage.style.setProperty("--eos-gas", gasColor);
    stage.style.setProperty("--eos-rad", radColor);
    stage.style.setProperty("--eos-deg", degColor);
    stage.style.setProperty("--eos-total", totalColor);
    stage.style.setProperty("--eos-mixed", totalColor);
  }
}

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
  scales: {
    x: { distr: 3 },
    y: { distr: 3, range: logPressureRange },
  },
  series: [
    {},
    { label: "P_gas", stroke: gasColor, width: 2.5, value: (_u: unknown, v: number | null) => v == null ? "\u2014" : formatScientific(v, 3) },
    { label: "P_rad", stroke: radColor, width: 2.5, value: (_u: unknown, v: number | null) => v == null ? "\u2014" : formatScientific(v, 3) },
    { label: "P_deg,e", stroke: degColor, width: 2.5, value: (_u: unknown, v: number | null) => v == null ? "\u2014" : formatScientific(v, 3) },
    { label: "P_total", stroke: totalColor, width: 3, dash: [6, 3], value: (_u: unknown, v: number | null) => v == null ? "\u2014" : formatScientific(v, 3) },
  ],
  axes: [
    { label: "\u03C1 (g cm\u207B\u00B3)", values: logTickValues },
    { label: "P (dyne cm\u207B\u00B2)", values: logTickValues },
  ],
  legend: { show: true, live: true },
  cursor: {
    drag: { x: false, y: false },
    points: { show: true, size: 8, fill: "#fbbf24" },
  },
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

function dominantChannelColor(model: StellarEosStateCgs): string {
  switch (model.dominantPressureChannel) {
    case "gas": return gasColor;
    case "radiation": return radColor;
    case "degeneracy": return degColor;
    default: return totalColor;
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
  renderMathIfChanged(fermiRegimeValue);
  finiteTCorrectionValue.textContent = Number.isFinite(model.finiteTemperatureDegeneracyCorrectionFactor)
    ? formatScientific(model.finiteTemperatureDegeneracyCorrectionFactor, 5)
    : "\u2014";
  finiteTValidityValue.textContent = `${model.finiteTemperatureDegeneracyAssessment.label} (${electronDegeneracyMethodLabel(model.electronDegeneracyMethod)})`;
  renderMathIfChanged(finiteTValidityValue);
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
  rhoValue.textContent = `${formatScientific(state.densityGPerCm3, 4)} g cm\u207B\u00B3`;

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
    solarProfile: showSolarProfileCb.checked ? solarProfileData() : undefined,
  });

  // --- Regime map detail text ---
  const logT = Math.log10(model.input.temperatureK);
  const logRho = Math.log10(model.input.densityGPerCm3);
  regimeDetail.textContent = `Point details: $\\log_{10}(T/\\mathrm{K})=${formatFraction(logT, 2)}$, $\\log_{10}(\\rho/(\\mathrm{g\\ cm^{-3}}))=${formatFraction(logRho, 2)}$, $P_{\\rm rad}/P_{\\rm gas}=${formatScientific(model.pressureRatios.radiationToGas, 3)}$, $P_{\\rm deg,e}/P_{\\rm tot}=${formatScientific(model.pressureRatios.degeneracyToTotal, 3)}$.`;
  regimeSummary.textContent = `Interpretation: ${dominantChannelLabel(model)} dominates at the highlighted state; white markers show preset anchors.`;
  renderMathIfChanged(regimeDetail);
  renderMathIfChanged(regimeSummary);

  // --- Pressure cards ---
  const dominantP = dominantPressureValue(model);
  setPressureCard(cardGas, pGasBar, pGasValue, model.gasPressureDynePerCm2, dominantP);
  setPressureCard(cardRadiation, pRadBar, pRadValue, model.radiationPressureDynePerCm2, dominantP);
  setPressureCard(cardDegeneracy, pDegBar, pDegValue, model.electronDegeneracyPressureDynePerCm2, dominantP);

  pTotalValue.textContent = formatScientific(model.totalPressureDynePerCm2, 5);
  dominantChannel.textContent = dominantChannelLabel(model);

  // Set dominant channel color for CSS theming (summary bar + label)
  const domColor = dominantChannelColor(model);
  stageSummary.style.setProperty("--eos-dominant", domColor);

  // --- Readouts ---
  muValue.textContent = formatFraction(model.meanMolecularWeightMu, 5);
  muEValue.textContent = formatFraction(model.meanMolecularWeightMuE, 5);
  betaValue.textContent = percent(model.pressureRatios.betaGasToTotal, 2);
  radGasValue.textContent = formatScientific(model.pressureRatios.radiationToGas, 5);
  degTotalValue.textContent = percent(model.pressureRatios.degeneracyToTotal, 2);
  chiDegValue.textContent = formatScientific(model.chiDegeneracy, 5);
  degRegimeValue.textContent = degeneracyRegimeLabelLatex(model.degeneracyRegime);
  renderMathIfChanged(degRegimeValue);

  const gammaEff = adiabaticIndex({
    pGas: model.gasPressureDynePerCm2,
    pRad: model.radiationPressureDynePerCm2,
    pDeg: model.electronDegeneracyPressureDynePerCm2,
    pTotal: model.totalPressureDynePerCm2,
    xF: model.fermiRelativityX,
  });
  gammaEffValue.textContent = Number.isFinite(gammaEff) ? gammaEff.toFixed(3) : "\u2014";

  // Visual stability indicator at 4/3 threshold
  const GAMMA_CRIT = 4 / 3;
  const gammaReadout = gammaEffValue.closest(".cp-readout");
  if (Number.isFinite(gammaEff)) {
    if (gammaEff < GAMMA_CRIT - 0.01) {
      gammaReadout?.setAttribute("data-stability", "unstable");
      gammaEffNote.textContent = "\u26A0 Below 4/3 \u2014 dynamically unstable";
    } else if (gammaEff < GAMMA_CRIT + 0.05) {
      gammaReadout?.setAttribute("data-stability", "marginal");
      gammaEffNote.textContent = "\u2248 4/3 \u2014 marginal stability";
    } else {
      gammaReadout?.setAttribute("data-stability", "stable");
      gammaEffNote.textContent = "> 4/3 \u2014 stable";
    }
  } else {
    gammaReadout?.removeAttribute("data-stability");
    gammaEffNote.textContent = "";
  }

  renderRadiationClosure(model);
  renderAdvancedDiagnostics(model);
  renderPresetState();

  // --- Debug / E2E interface ---
  (window as Window & { __cp?: unknown }).__cp = {
    slug: "eos-lab",
    mode: runtime.mode,
    exportResults: () => exportResults(model)
  };

  // Compare view (Tab 2) — sync sliders and render if visible
  syncCompareSliders();
  if (!tab2Panel.hidden) {
    renderCompareView(model);
  }
}

/* ================================================================
 * Comparison view (Tab 2) — side-by-side channel animations
 * ================================================================ */

const compareAnimations = {
  gas: new GasPressureAnimation(),
  radiation: new RadiationPressureAnimation(),
  degeneracy: new DegeneracyPressureAnimation(),
};

let compareAnimsStarted = false;
let prevCompareModel: StellarEosStateCgs | null = null;
let showSubstitutedEqs = false;

function startCompareAnimations(): void {
  if (compareAnimsStarted) return;
  compareAnimations.gas.start(compareGasCanvas);
  compareAnimations.radiation.start(compareRadCanvas);
  compareAnimations.degeneracy.start(compareDegCanvas);
  compareAnimsStarted = true;
}

function stopCompareAnimations(): void {
  if (!compareAnimsStarted) return;
  compareAnimations.gas.stop();
  compareAnimations.radiation.stop();
  compareAnimations.degeneracy.stop();
  compareAnimsStarted = false;
}

function syncCompareSliders(): void {
  compareT.value = tempSlider.value;
  compareRho.value = rhoSlider.value;
  compareX.value = xSlider.value;
  compareY.value = ySlider.value;
}

const flashTimeouts = new WeakMap<HTMLElement, number>();

function showDeltaFlash(el: HTMLElement, oldP: number, newP: number): void {
  const ratio = newP / oldP;
  if (!Number.isFinite(ratio) || Math.abs(ratio - 1) < 0.001) {
    el.dataset.direction = "none";
    el.textContent = "\u2014";
  } else if (ratio > 1) {
    el.dataset.direction = "up";
    el.textContent = "\u2191 \u00D7" + ratio.toFixed(ratio > 10 ? 0 : 1);
  } else {
    el.dataset.direction = "down";
    el.textContent = "\u2193 \u00D7" + (1 / ratio).toFixed(ratio < 0.1 ? 0 : 1);
  }
  el.classList.add("is-visible");
  const prev = flashTimeouts.get(el);
  if (prev) clearTimeout(prev);
  flashTimeouts.set(el, window.setTimeout(() => {
    el.classList.remove("is-visible");
    flashTimeouts.delete(el);
  }, 2000));
}

function renderCompareView(model: StellarEosStateCgs): void {
  // Slider readouts
  compareTVal.textContent = formatScientific(model.input.temperatureK, 4) + " K";
  compareRhoVal.textContent = formatScientific(model.input.densityGPerCm3, 4) + " g cm\u207B\u00B3";
  compareXVal.textContent = formatFraction(model.input.composition.hydrogenMassFractionX, 3);
  compareYVal.textContent = formatFraction(model.input.composition.heliumMassFractionY, 3);
  compareMuVal.textContent = formatFraction(model.meanMolecularWeightMu, 3);

  // Live equations (KaTeX) — toggle between symbolic and substituted
  if (showSubstitutedEqs) {
    compareGasEq.textContent = "$$" + gasEquationLatex({
      rho: model.input.densityGPerCm3,
      T: model.input.temperatureK,
      mu: model.meanMolecularWeightMu,
      pGas: model.gasPressureDynePerCm2,
    }) + "$$";
    compareRadEq.textContent = "$$" + radEquationLatex({
      T: model.input.temperatureK,
      pRad: model.radiationPressureDynePerCm2,
    }) + "$$";
    compareDegEq.textContent = "$$" + degEquationLatex({
      rho: model.input.densityGPerCm3,
      muE: model.meanMolecularWeightMuE,
      xF: model.fermiRelativityX,
      pDeg: model.electronDegeneracyPressureDynePerCm2,
    }) + "$$";
  } else {
    compareGasEq.textContent = "$$" + gasEquationSymbolic() + "$$";
    compareRadEq.textContent = "$$" + radEquationSymbolic() + "$$";
    compareDegEq.textContent = "$$" + degEquationSymbolic() + "$$";
  }
  renderMath(compareGasEq);
  renderMath(compareRadEq);
  renderMath(compareDegEq);

  // Update animations
  const logT = Math.log10(model.input.temperatureK);
  const logRho = Math.log10(model.input.densityGPerCm3);
  compareAnimations.gas.updateParams({ logT, logRho });
  compareAnimations.radiation.updateParams({ logT });
  compareAnimations.degeneracy.updateParams({ logRho });

  // Delta-P flash
  if (prevCompareModel) {
    showDeltaFlash(compareGasFlash,
      prevCompareModel.gasPressureDynePerCm2,
      model.gasPressureDynePerCm2);
    showDeltaFlash(compareRadFlash,
      prevCompareModel.radiationPressureDynePerCm2,
      model.radiationPressureDynePerCm2);
    showDeltaFlash(compareDegFlash,
      prevCompareModel.electronDegeneracyPressureDynePerCm2,
      model.electronDegeneracyPressureDynePerCm2);
  }
  prevCompareModel = model;

  // Preset highlight on compare buttons
  for (const btn of comparePresetButtons) {
    const isActive = btn.dataset.presetId === state.selectedPresetId;
    btn.classList.toggle("is-active", isActive);
  }
}

// Compare slider events — sync Tab 2 -> Tab 1 state
compareT.addEventListener("input", () => {
  tempSlider.value = compareT.value;
  state.temperatureK = logSliderToValue({
    sliderValue: clamp(Number(compareT.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: TEMPERATURE_MIN_K, valueMax: TEMPERATURE_MAX_K,
  });
  render();
});

compareRho.addEventListener("input", () => {
  rhoSlider.value = compareRho.value;
  state.densityGPerCm3 = logSliderToValue({
    sliderValue: clamp(Number(compareRho.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: DENSITY_MIN_G_PER_CM3, valueMax: DENSITY_MAX_G_PER_CM3,
  });
  render();
});

compareX.addEventListener("input", () => {
  xSlider.value = compareX.value;
  xSlider.dispatchEvent(new Event("input"));
});

compareY.addEventListener("input", () => {
  ySlider.value = compareY.value;
  ySlider.dispatchEvent(new Event("input"));
});

// Compare preset clicks
for (const btn of comparePresetButtons) {
  btn.addEventListener("click", () => {
    const presetId = btn.dataset.presetId as Preset["id"];
    applyPreset(presetId);
    render();
  });
}

// Start/stop compare animations on Tab 2 visibility
const tab2Observer = new MutationObserver(() => {
  if (!tab2Panel.hidden) {
    syncCompareSliders();
    startCompareAnimations();
    // Force initial render of compare view
    if (lastModel) renderCompareView(lastModel);
  } else {
    stopCompareAnimations();
  }
});
tab2Observer.observe(tab2Panel, { attributes: true, attributeFilter: ["hidden"] });

// Equation toggle — click or keyboard to switch symbolic/substituted
for (const eq of [compareGasEq, compareRadEq, compareDegEq]) {
  eq.setAttribute("role", "button");
  eq.setAttribute("tabindex", "0");
  eq.title = "Click to toggle symbolic / numerical";
  const toggleEqs = () => {
    showSubstitutedEqs = !showSubstitutedEqs;
    if (lastModel) renderCompareView(lastModel);
  };
  eq.addEventListener("click", toggleEqs);
  eq.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleEqs();
    }
  });
}

/* ================================================================
 * Scaling Law Detective — lightweight multiple-choice quiz
 * ================================================================ */

const scalingContainer = document.getElementById("scalingChallenge");
if (scalingContainer) {
  let currentIdx = 0;
  const answered = new Set<number>();

  function renderChallenge(): void {
    if (!scalingContainer) return;
    const ch = SCALING_CHALLENGES[currentIdx];

    const progress = `<p class="cp-challenge-progress">${currentIdx + 1} / ${SCALING_CHALLENGES.length}</p>`;
    const question = `<p class="scaling-detective__question">${ch.question}</p>`;

    const optionsHtml = ch.options
      .map(
        (opt, i) =>
          `<button class="cp-action scaling-detective__option" data-idx="${i}" data-factor="${opt.factor}" type="button">$${opt.label}$</button>`
      )
      .join("");

    const feedbackId = `scalingFeedback-${ch.id}`;
    scalingContainer.innerHTML =
      progress + question +
      `<div class="scaling-detective__options">${optionsHtml}</div>` +
      `<div id="${feedbackId}" class="scaling-detective__feedback" aria-live="polite"></div>`;

    renderMath(scalingContainer);

    // Wire option clicks
    for (const btn of scalingContainer.querySelectorAll<HTMLButtonElement>(".scaling-detective__option")) {
      btn.addEventListener("click", () => {
        const factor = Number(btn.dataset.factor);
        const correct = checkScalingAnswer(factor, ch.correctFactor);
        const feedbackEl = document.getElementById(feedbackId);
        if (!feedbackEl) return;

        if (correct) {
          btn.classList.add("is-correct");
          feedbackEl.innerHTML = `<span class="scaling-detective__correct">${ch.insight}</span>`;
          renderMath(feedbackEl);
          answered.add(currentIdx);

          // Auto-advance after 2.5s if more challenges remain
          if (currentIdx < SCALING_CHALLENGES.length - 1) {
            setTimeout(() => {
              currentIdx++;
              renderChallenge();
            }, 2500);
          } else if (answered.size === SCALING_CHALLENGES.length) {
            feedbackEl.innerHTML += `<p class="scaling-detective__complete">All scaling laws discovered!</p>`;
          }
        } else {
          btn.classList.add("is-wrong");
          btn.disabled = true;
          feedbackEl.textContent = "Try again \u2014 watch the numbers carefully.";
        }
      });
    }
  }

  // Start challenge when accordion opens
  const scalingAccordion = scalingContainer.closest("details");
  if (scalingAccordion) {
    scalingAccordion.addEventListener("toggle", () => {
      if (scalingAccordion.open && scalingContainer.children.length === 0) {
        renderChallenge();
      }
    });
  }
}

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

let compositionFinalizePending = false;
function finalizeCompositionInteraction(): void {
  // Deduplicate: both 'change' and 'pointerup' fire on slider release.
  // Use a microtask guard so the grid rebuild only happens once.
  if (compositionFinalizePending) return;
  compositionFinalizePending = true;
  queueMicrotask(() => {
    compositionFinalizePending = false;
    invalidateRegimeGrid();
    render();
  });
}

xSlider.addEventListener("change", finalizeCompositionInteraction);
ySlider.addEventListener("change", finalizeCompositionInteraction);
xSlider.addEventListener("pointerup", finalizeCompositionInteraction);
ySlider.addEventListener("pointerup", finalizeCompositionInteraction);

showSolarProfileCb.addEventListener("change", () => render());

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
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}

// Resize charts when switching to the Explore tab (uPlot needs layout reflow)
const tabExplore = document.getElementById("tab-explore");
tabExplore?.addEventListener("click", () => {
  requestAnimationFrame(() => {
    if (pressureCurvePlotEl.clientWidth > 0) {
      pressurePlotHandle.plot.setSize({
        width: pressureCurvePlotEl.clientWidth,
        height: pressureCurvePlotEl.clientHeight,
      });
    }
  });
});

// Comparison view (Tab 2) doesn't use uPlot charts, so no resize needed here.

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

window.addEventListener("beforeunload", () => {
  stopCompareAnimations();
  destroyPlot(pressurePlotHandle);
}, { once: true });

/* ================================================================
 * First-use guided tour — lightweight 3-step walkthrough
 * ================================================================ */

const TOUR_STEPS = [
  { target: "#tempSlider", text: "Drag temperature to see how each pressure channel responds." },
  { target: "#regimeMapCanvas", text: "This map shows which pressure dominates at every (T, \u03C1) combination." },
  { target: "#tab-understand", text: "Switch here to see physical mechanism animations for each channel." },
];

function runTour(): void {
  // Ensure Tab 1 (Explore) is active — tour targets are only visible there
  const tabExploreBtn = document.getElementById("tab-explore") as HTMLElement | null;
  if (tabExploreBtn && tabExploreBtn.getAttribute("aria-selected") !== "true") {
    tabExploreBtn.click();
  }

  const preTourFocus = document.activeElement as HTMLElement | null;
  let step = 0;

  const overlay = document.createElement("div");
  overlay.className = "tour-overlay";
  document.body.appendChild(overlay);

  const tooltip = document.createElement("div");
  tooltip.className = "tour-tooltip";
  tooltip.setAttribute("role", "dialog");
  tooltip.setAttribute("aria-label", "Guided tour");
  document.body.appendChild(tooltip);

  let prevHighlight: Element | null = null;

  function show(): void {
    if (step >= TOUR_STEPS.length) { cleanup(); return; }
    const s = TOUR_STEPS[step];
    const el = document.querySelector(s.target);
    // Skip elements that are missing or have zero-size rect (hidden by tab)
    if (!el) { step++; show(); return; }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) { step++; show(); return; }

    if (prevHighlight) prevHighlight.classList.remove("tour-highlight");
    el.classList.add("tour-highlight");
    prevHighlight = el;

    tooltip.innerHTML =
      `<p>${s.text}</p>` +
      `<div class="tour-tooltip__actions">` +
      `<button class="tour-skip">Skip</button>` +
      `<button class="tour-next">${step < TOUR_STEPS.length - 1 ? "Next" : "Done"}</button>` +
      `</div>`;

    // Position tooltip below or above the target
    const above = rect.bottom > window.innerHeight * 0.6;
    // Clamp left so tooltip doesn't overflow the right edge of the viewport
    const maxLeft = window.innerWidth - Math.min(320, window.innerWidth - 16) - 8;
    tooltip.style.left = `${Math.max(8, Math.min(rect.left, maxLeft))}px`;
    if (above) {
      tooltip.style.top = "";
      tooltip.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    } else {
      tooltip.style.bottom = "";
      tooltip.style.top = `${rect.bottom + 8}px`;
    }

    tooltip.querySelector(".tour-next")!.addEventListener("click", () => { step++; show(); });
    tooltip.querySelector(".tour-skip")!.addEventListener("click", cleanup);
    // Focus the Next button for keyboard users
    (tooltip.querySelector(".tour-next") as HTMLElement)?.focus();
  }

  function cleanup(): void {
    if (prevHighlight) prevHighlight.classList.remove("tour-highlight");
    overlay.remove();
    tooltip.remove();
    localStorage.setItem("eos-lab-toured", "1");
    // Restore focus to where it was before the tour
    if (preTourFocus && typeof preTourFocus.focus === "function") {
      preTourFocus.focus();
    }
  }

  overlay.addEventListener("click", cleanup);
  show();
}

const startTourBtn = document.getElementById("startTour");
if (startTourBtn) {
  startTourBtn.addEventListener("click", runTour);
}

// Auto-show on first visit
if (!localStorage.getItem("eos-lab-toured")) {
  requestAnimationFrame(() => setTimeout(runTour, 600));
}
