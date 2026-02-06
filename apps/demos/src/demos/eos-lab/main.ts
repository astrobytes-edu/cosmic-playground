import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  mountPlot,
  initStarfield,
  renderMath,
  setLiveRegionText
} from "@cosmic/runtime";
import { logspace } from "@cosmic/math";
import type {
  ExportPayloadV1,
  PlotLayoutOverrides,
  PlotSpec,
  PlotTrace
} from "@cosmic/runtime";
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
  logSliderToValue,
  percent,
  pressureBarPercent,
  pressureTone,
  valueToLogSlider
} from "./logic";

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
    composition: {
      hydrogenMassFractionX: 0.34,
      heliumMassFractionY: 0.64,
      metalMassFractionZ: 0.02
    }
  },
  {
    id: "solar-envelope",
    label: "Solar envelope",
    note: "Cool, low-density layers with weak radiation and negligible degeneracy.",
    expectedDominance: "Gas",
    temperatureK: 5800,
    densityGPerCm3: 1e-7,
    composition: {
      hydrogenMassFractionX: 0.74,
      heliumMassFractionY: 0.24,
      metalMassFractionZ: 0.02
    }
  },
  {
    id: "massive-core",
    label: "Massive-star core",
    note: "Higher core temperatures increase radiation support strongly via T^4 scaling.",
    expectedDominance: "Radiation can become competitive",
    temperatureK: 4e7,
    densityGPerCm3: 10,
    composition: {
      hydrogenMassFractionX: 0.35,
      heliumMassFractionY: 0.63,
      metalMassFractionZ: 0.02
    }
  },
  {
    id: "red-giant-envelope",
    label: "Red giant envelope",
    note: "Very low density keeps both radiation and degeneracy weak in envelope layers.",
    expectedDominance: "Gas",
    temperatureK: 4000,
    densityGPerCm3: 1e-9,
    composition: {
      hydrogenMassFractionX: 0.7,
      heliumMassFractionY: 0.28,
      metalMassFractionZ: 0.02
    }
  },
  {
    id: "white-dwarf-core",
    label: "White dwarf core",
    note: "Extreme density drives electron degeneracy pressure dominance.",
    expectedDominance: "Electron degeneracy",
    temperatureK: 1e7,
    densityGPerCm3: 1e6,
    composition: {
      hydrogenMassFractionX: 0,
      heliumMassFractionY: 0.98,
      metalMassFractionZ: 0.02
    }
  },
  {
    id: "brown-dwarf-interior",
    label: "Brown dwarf interior",
    note: "Intermediate regime where degeneracy becomes important without full white-dwarf conditions.",
    expectedDominance: "Gas/degeneracy transition",
    temperatureK: 1e6,
    densityGPerCm3: 100,
    composition: {
      hydrogenMassFractionX: 0.7,
      heliumMassFractionY: 0.28,
      metalMassFractionZ: 0.02
    }
  }
] as const;

const PRESET_BY_ID: Record<Preset["id"], Preset> = PRESETS.reduce(
  (acc, preset) => {
    acc[preset.id] = preset;
    return acc;
  },
  {} as Record<Preset["id"], Preset>
);

const TEMPERATURE_MIN_K = 1e3;
const TEMPERATURE_MAX_K = 1e9;
const DENSITY_MIN_G_PER_CM3 = 1e-10;
const DENSITY_MAX_G_PER_CM3 = 1e10;
const REGIME_MAP_REBUILD_DEBOUNCE_MS = 80;
const REGIME_MAP_MIN_X = 120;
const REGIME_MAP_MAX_X = 280;
const REGIME_MAP_MIN_Y = 90;
const REGIME_MAP_MAX_Y = 210;
const REGIME_MAP_CELL_SIZE_DESKTOP_PX = 3.2;
const REGIME_MAP_CELL_SIZE_COARSE_PX = 4.8;
const PRESSURE_CURVE_SAMPLES = 180;

const tempSliderEl = document.querySelector<HTMLInputElement>("#tempSlider");
const tempValueEl = document.querySelector<HTMLSpanElement>("#tempValue");
const rhoSliderEl = document.querySelector<HTMLInputElement>("#rhoSlider");
const rhoValueEl = document.querySelector<HTMLSpanElement>("#rhoValue");
const xSliderEl = document.querySelector<HTMLInputElement>("#xSlider");
const xValueEl = document.querySelector<HTMLSpanElement>("#xValue");
const ySliderEl = document.querySelector<HTMLInputElement>("#ySlider");
const yValueEl = document.querySelector<HTMLSpanElement>("#yValue");
const zValueEl = document.querySelector<HTMLSpanElement>("#zValue");

const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('button.preset[data-preset-id]')
);
const presetNoteEl = document.querySelector<HTMLParagraphElement>("#presetNote");

const radiationClosureChipEl = document.querySelector<HTMLElement>("#radiationClosureChip");
const radiationClosureLabelEl = document.querySelector<HTMLElement>("#radiationClosureLabel");
const radiationClosureNoteEl = document.querySelector<HTMLElement>("#radiationClosureNote");

const cardGasEl = document.querySelector<HTMLElement>("#cardGas");
const cardRadiationEl = document.querySelector<HTMLElement>("#cardRadiation");
const cardDegeneracyEl = document.querySelector<HTMLElement>("#cardDegeneracy");

const pGasValueEl = document.querySelector<HTMLElement>("#pGasValue");
const pGasBarEl = document.querySelector<HTMLElement>("#pGasBar");
const pRadValueEl = document.querySelector<HTMLElement>("#pRadValue");
const pRadBarEl = document.querySelector<HTMLElement>("#pRadBar");
const pDegValueEl = document.querySelector<HTMLElement>("#pDegValue");
const pDegBarEl = document.querySelector<HTMLElement>("#pDegBar");
const pTotalValueEl = document.querySelector<HTMLElement>("#pTotalValue");
const dominantChannelEl = document.querySelector<HTMLElement>("#dominantChannel");
const pressureCurvePlotEl = document.querySelector<HTMLElement>("#pressureCurvePlot");
const regimeMapEl = document.querySelector<HTMLElement>("#regimeMap");
const regimeDetailEl = document.querySelector<HTMLElement>("#regimeDetail");
const regimeSummaryEl = document.querySelector<HTMLElement>("#regimeSummary");

const muValueEl = document.querySelector<HTMLElement>("#muValue");
const muEValueEl = document.querySelector<HTMLElement>("#muEValue");
const betaValueEl = document.querySelector<HTMLElement>("#betaValue");
const radGasValueEl = document.querySelector<HTMLElement>("#radGasValue");
const degTotalValueEl = document.querySelector<HTMLElement>("#degTotalValue");
const chiDegValueEl = document.querySelector<HTMLElement>("#chiDegValue");
const degRegimeValueEl = document.querySelector<HTMLElement>("#degRegimeValue");
const xFValueEl = document.querySelector<HTMLElement>("#xFValue");
const fermiRegimeValueEl = document.querySelector<HTMLElement>("#fermiRegimeValue");
const finiteTCorrectionValueEl = document.querySelector<HTMLElement>("#finiteTCorrectionValue");
const finiteTValidityValueEl = document.querySelector<HTMLElement>("#finiteTValidityValue");
const neutronExtensionValueEl = document.querySelector<HTMLElement>("#neutronExtensionValue");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

if (
  !tempSliderEl ||
  !tempValueEl ||
  !rhoSliderEl ||
  !rhoValueEl ||
  !xSliderEl ||
  !xValueEl ||
  !ySliderEl ||
  !yValueEl ||
  !zValueEl ||
  !presetNoteEl ||
  !radiationClosureChipEl ||
  !radiationClosureLabelEl ||
  !radiationClosureNoteEl ||
  !cardGasEl ||
  !cardRadiationEl ||
  !cardDegeneracyEl ||
  !pGasValueEl ||
  !pGasBarEl ||
  !pRadValueEl ||
  !pRadBarEl ||
  !pDegValueEl ||
  !pDegBarEl ||
  !pTotalValueEl ||
  !dominantChannelEl ||
  !pressureCurvePlotEl ||
  !regimeMapEl ||
  !regimeDetailEl ||
  !regimeSummaryEl ||
  !muValueEl ||
  !muEValueEl ||
  !betaValueEl ||
  !radGasValueEl ||
  !degTotalValueEl ||
  !chiDegValueEl ||
  !degRegimeValueEl ||
  !xFValueEl ||
  !fermiRegimeValueEl ||
  !finiteTCorrectionValueEl ||
  !finiteTValidityValueEl ||
  !neutronExtensionValueEl ||
  !stationModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl
) {
  throw new Error("Missing required DOM elements for eos-lab demo.");
}

const tempSlider = tempSliderEl;
const tempValue = tempValueEl;
const rhoSlider = rhoSliderEl;
const rhoValue = rhoValueEl;
const xSlider = xSliderEl;
const xValue = xValueEl;
const ySlider = ySliderEl;
const yValue = yValueEl;
const zValue = zValueEl;
const presetNote = presetNoteEl;

const radiationClosureChip = radiationClosureChipEl;
const radiationClosureLabel = radiationClosureLabelEl;
const radiationClosureNote = radiationClosureNoteEl;

const cardGas = cardGasEl;
const cardRadiation = cardRadiationEl;
const cardDegeneracy = cardDegeneracyEl;

const pGasValue = pGasValueEl;
const pGasBar = pGasBarEl;
const pRadValue = pRadValueEl;
const pRadBar = pRadBarEl;
const pDegValue = pDegValueEl;
const pDegBar = pDegBarEl;
const pTotalValue = pTotalValueEl;
const dominantChannel = dominantChannelEl;
const pressureCurvePlot = pressureCurvePlotEl;
const regimeMap = regimeMapEl;
const regimeDetail = regimeDetailEl;
const regimeSummary = regimeSummaryEl;

const muValue = muValueEl;
const muEValue = muEValueEl;
const betaValue = betaValueEl;
const radGasValue = radGasValueEl;
const degTotalValue = degTotalValueEl;
const chiDegValue = chiDegValueEl;
const degRegimeValue = degRegimeValueEl;
const xFValue = xFValueEl;
const fermiRegimeValue = fermiRegimeValueEl;
const finiteTCorrectionValue = finiteTCorrectionValueEl;
const finiteTValidityValue = finiteTValidityValueEl;
const neutronExtensionValue = neutronExtensionValueEl;

const stationModeButton = stationModeEl;
const helpButton = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;

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

type EosPressurePlotState = {
  temperatureK: number;
  densityGPerCm3: number;
  composition: StellarCompositionFractions;
  radiationDepartureEta: number;
  currentModel: StellarEosStateCgs;
};

function pressurePlotStateFromModel(model: StellarEosStateCgs): EosPressurePlotState {
  return {
    temperatureK: model.input.temperatureK,
    densityGPerCm3: model.input.densityGPerCm3,
    composition: {
      hydrogenMassFractionX: model.normalizedComposition.hydrogenMassFractionX,
      heliumMassFractionY: model.normalizedComposition.heliumMassFractionY,
      metalMassFractionZ: model.normalizedComposition.metalMassFractionZ
    },
    radiationDepartureEta: model.input.radiationDepartureEta,
    currentModel: model
  };
}

function pressureCurveTraces(plotState: EosPressurePlotState): PlotTrace[] {
  const gasPoints: Array<{ x: number; y: number }> = [];
  const radiationPoints: Array<{ x: number; y: number }> = [];
  const degeneracyPoints: Array<{ x: number; y: number }> = [];
  const totalPoints: Array<{ x: number; y: number }> = [];

  const logDensityMin = Math.log10(DENSITY_MIN_G_PER_CM3);
  const logDensityMax = Math.log10(DENSITY_MAX_G_PER_CM3);
  const densityGrid = logspace(logDensityMin, logDensityMax, PRESSURE_CURVE_SAMPLES);

  for (const densityGPerCm3 of densityGrid) {
    const sample = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: plotState.temperatureK,
        densityGPerCm3,
        composition: plotState.composition,
        radiationDepartureEta: plotState.radiationDepartureEta
      }
    });

    gasPoints.push({ x: densityGPerCm3, y: sample.gasPressureDynePerCm2 });
    radiationPoints.push({ x: densityGPerCm3, y: sample.radiationPressureDynePerCm2 });
    degeneracyPoints.push({ x: densityGPerCm3, y: sample.electronDegeneracyPressureDynePerCm2 });
    totalPoints.push({ x: densityGPerCm3, y: sample.totalPressureDynePerCm2 });
  }

  return [
    {
      id: "p-gas",
      label: "P_gas",
      points: gasPoints,
      colorVar: "#2c7fb8",
      lineWidth: 3.2
    },
    {
      id: "p-rad",
      label: "P_rad",
      points: radiationPoints,
      colorVar: "#f28e2b",
      lineWidth: 3.2
    },
    {
      id: "p-deg-e",
      label: "P_deg,e",
      points: degeneracyPoints,
      colorVar: "#59a14f",
      lineWidth: 3.2
    },
    {
      id: "p-total",
      label: "P_tot",
      points: totalPoints,
      colorVar: "#e15759",
      lineWidth: 3.6
    },
    {
      id: "current-state",
      label: "Current state",
      mode: "points",
      pointRadius: 5.8,
      colorVar: "#f4d35e",
      showLegend: false,
      points: [
        {
          x: plotState.densityGPerCm3,
          y: plotState.currentModel.totalPressureDynePerCm2
        }
      ]
    }
  ];
}

function pressureCurveYDomain(traces: PlotTrace[]): [number, number] | undefined {
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const trace of traces) {
    if (trace.kind === "heatmap") continue;
    for (const point of trace.points) {
      if (!Number.isFinite(point.y) || !(point.y > 0)) continue;
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
  }

  if (!(Number.isFinite(minY) && Number.isFinite(maxY) && maxY > 0)) {
    return undefined;
  }
  if (!(maxY > minY)) {
    return [minY * 0.8, maxY * 1.2];
  }

  const minLog = Math.log10(minY);
  const maxLog = Math.log10(maxY);
  const paddingDex = Math.max(0.18, 0.06 * (maxLog - minLog));
  return [Math.pow(10, minLog - paddingDex), Math.pow(10, maxLog + paddingDex)];
}

function pressureCurveLayoutOverrides(args: {
  yDomain: [number, number] | undefined;
}): PlotLayoutOverrides {
  const yAxisOverride: Record<string, unknown> = {
    exponentformat: "power",
    showexponent: "all",
    tickformat: ".1e"
  };
  if (args.yDomain) {
    yAxisOverride.range = [Math.log10(args.yDomain[0]), Math.log10(args.yDomain[1])];
  }

  return {
    hovermode: "x unified",
    margin: { l: 84, r: 20, t: 28, b: 92 },
    showlegend: true,
    legend: {
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: -0.28,
      yanchor: "bottom",
      traceorder: "normal",
      itemwidth: 58,
      font: { size: 12, color: "#e8efff" }
    },
    hoverlabel: {
      bgcolor: "rgba(8, 16, 24, 0.94)",
      bordercolor: "rgba(132, 156, 188, 0.6)",
      font: { size: 12, color: "#e8efff" }
    },
    xaxis: {
      title: { text: "Density rho (g cm<sup>-3</sup>)", standoff: 8 },
      tickvals: [-9, -6, -3, 0, 3, 6, 9].map((value) => Math.pow(10, value)),
      ticktext: [
        "10<sup>-9</sup>",
        "10<sup>-6</sup>",
        "10<sup>-3</sup>",
        "10<sup>0</sup>",
        "10<sup>3</sup>",
        "10<sup>6</sup>",
        "10<sup>9</sup>"
      ],
      exponentformat: "power",
      showexponent: "all",
      tickformat: ".1e",
      automargin: true
    },
    yaxis: {
      title: { text: "Pressure P (dyne cm<sup>-2</sup>)", standoff: 8 },
      tickvals: [-4, 0, 4, 8, 12, 16, 20, 24].map((value) => Math.pow(10, value)),
      ticktext: [
        "10<sup>-4</sup>",
        "10<sup>0</sup>",
        "10<sup>4</sup>",
        "10<sup>8</sup>",
        "10<sup>12</sup>",
        "10<sup>16</sup>",
        "10<sup>20</sup>",
        "10<sup>24</sup>"
      ],
      automargin: true,
      ...yAxisOverride
    }
  };
}

function pressureCurvePatch(plotState: EosPressurePlotState): {
  traces: PlotTrace[];
  yDomain?: [number, number];
  layoutOverrides: PlotLayoutOverrides;
} {
  const traces = pressureCurveTraces(plotState);
  const yDomain = pressureCurveYDomain(traces);
  return {
    traces,
    ...(yDomain ? { yDomain } : {}),
    layoutOverrides: pressureCurveLayoutOverrides({ yDomain })
  };
}

const eosPressurePlotSpec: PlotSpec<EosPressurePlotState> = {
  id: "eos-pressure-curves",
  axes: {
    x: {
      label: "Density rho",
      unit: "g cm^-3",
      scale: "log",
      min: DENSITY_MIN_G_PER_CM3,
      max: DENSITY_MAX_G_PER_CM3,
      tickCount: 7,
      tickCountMobile: 5
    },
    y: {
      label: "Pressure P",
      unit: "dyne cm^-2",
      scale: "log",
      tickCount: 7,
      tickCountMobile: 5
    }
  },
  interaction: {
    hover: true,
    zoom: false,
    pan: false,
    crosshair: true
  },
  init(plotState) {
    return pressureCurvePatch(plotState);
  },
  update(plotState) {
    return pressureCurvePatch(plotState);
  }
};

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

const pressureCurvePlotController = mountPlot(
  pressureCurvePlot,
  eosPressurePlotSpec,
  pressurePlotStateFromModel(evaluateModel())
);

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
  state.composition = compositionFromXY({
    hydrogenMassFractionX: args.hydrogenMassFractionX,
    heliumMassFractionY: args.heliumMassFractionY
  });
}

function renderPresetState(): void {
  for (const button of presetButtons) {
    const isActive = button.dataset.presetId === state.selectedPresetId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  const preset = PRESET_BY_ID[state.selectedPresetId];
  const composition = state.composition;
  presetNote.textContent = `${preset.note} Expected: ${preset.expectedDominance}. X=${formatFraction(composition.hydrogenMassFractionX, 2)}, Y=${formatFraction(composition.heliumMassFractionY, 2)}, Z=${formatFraction(composition.metalMassFractionZ, 2)}.`;
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
  const kind =
    closure.tag === "lte-like"
      ? "tip"
      : closure.tag === "proxy"
        ? "warn"
        : closure.tag === "caution"
          ? "warn"
          : "warn";
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
    case "gas":
      return "Gas pressure";
    case "radiation":
      return "Radiation pressure";
    case "degeneracy":
      return "Electron degeneracy pressure";
    case "extension":
      return "Extension pressure term(s)";
    case "mixed":
      return "Mixed (no single dominant channel)";
    default:
      return "Unavailable";
  }
}

function electronDegeneracyMethodLabel(
  method: StellarEosStateCgs["electronDegeneracyMethod"]
): string {
  switch (method) {
    case "nonrel-fd":
      return "Finite-T nonrelativistic Fermi-Dirac";
    case "relativistic-fd":
      return "Finite-T relativistic Fermi-Dirac";
    case "zero-t-limit":
      return "Zero-temperature limit";
    case "classical-limit":
      return "Classical electron limit";
    case "override":
      return "Custom override";
    default:
      return "Unavailable";
  }
}

function degeneracyRegimeLabelLatex(regime: StellarEosStateCgs["degeneracyRegime"]): string {
  switch (regime.tag) {
    case "strong":
      return `Strongly degenerate ($T/T_F \\ll 1$)`;
    case "transition":
      return `Transition regime ($T/T_F \\sim 1$)`;
    case "weak":
      return `Weakly/non-degenerate ($T/T_F \\gg 1$)`;
    default:
      return "Degeneracy diagnostic unavailable";
  }
}

function fermiRelativityRegimeLabelLatex(regime: StellarEosStateCgs["fermiRelativityRegime"]): string {
  switch (regime.tag) {
    case "non-relativistic":
      return `Non-relativistic electron momenta ($x_F \\ll 1$)`;
    case "trans-relativistic":
      return `Trans-relativistic electron momenta ($x_F \\sim 1$)`;
    case "relativistic":
      return `Relativistic electron momenta ($x_F > 1$)`;
    default:
      return "Fermi relativity diagnostic unavailable";
  }
}

function compositionRegimeKey(composition: StellarCompositionFractions, radiationDepartureEta: number): string {
  return [
    composition.hydrogenMassFractionX.toFixed(6),
    composition.heliumMassFractionY.toFixed(6),
    composition.metalMassFractionZ.toFixed(6),
    radiationDepartureEta.toFixed(6)
  ].join("|");
}

type RegimeChannelCode = 0 | 1 | 2 | 3;

type RegimeMapGridResolution = {
  xCells: number;
  yCells: number;
  signature: string;
};

type RegimeMapGridData = {
  xLog: number[];
  yLog: number[];
  z: RegimeChannelCode[][];
  labels: string[][];
};

function channelCode(channel: StellarEosStateCgs["dominantPressureChannel"]): RegimeChannelCode {
  switch (channel) {
    case "gas":
      return 0;
    case "radiation":
      return 1;
    case "degeneracy":
      return 2;
    case "mixed":
    case "extension":
    default:
      return 3;
  }
}

function channelLabelFromCode(code: RegimeChannelCode): string {
  switch (code) {
    case 0:
      return "P_gas dominant";
    case 1:
      return "P_rad dominant";
    case 2:
      return "P_deg,e dominant";
    case 3:
    default:
      return "Mixed dominance";
  }
}

const EOS_REGIME_COLOR_SCALE: Array<[number, string]> = [
  [0, "rgba(61, 186, 138, 0.82)"],
  [0.249, "rgba(61, 186, 138, 0.82)"],
  [0.25, "rgba(91, 153, 222, 0.82)"],
  [0.499, "rgba(91, 153, 222, 0.82)"],
  [0.5, "rgba(84, 205, 220, 0.82)"],
  [0.749, "rgba(84, 205, 220, 0.82)"],
  [0.75, "rgba(239, 187, 86, 0.84)"],
  [1, "rgba(239, 187, 86, 0.84)"]
];

let regimeMapCacheKey: string | null = null;
let pendingRegimeMapKey: string | null = null;
let pendingRegimeMapResolution: RegimeMapGridResolution | null = null;
let regimeMapRebuildTimer: number | null = null;
let regimeMapBuildCount = 0;
let regimeMapLastResolution = "0x0";
let regimeMapGridData: RegimeMapGridData | null = null;
let regimeMapCurrentLogPoint = { log10Temperature: Number.NaN, log10Density: Number.NaN };

function regimeMapGridResolution(): RegimeMapGridResolution {
  const rect = regimeMap.getBoundingClientRect();
  const widthPx = rect.width > 0 ? rect.width : 540;
  const heightPx = rect.height > 0 ? rect.height : 360;

  const cellSizePx =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
      ? REGIME_MAP_CELL_SIZE_COARSE_PX
      : REGIME_MAP_CELL_SIZE_DESKTOP_PX;

  const xCells = Math.round(
    clamp(widthPx / cellSizePx, REGIME_MAP_MIN_X, REGIME_MAP_MAX_X)
  );
  const yCells = Math.round(
    clamp(heightPx / cellSizePx, REGIME_MAP_MIN_Y, REGIME_MAP_MAX_Y)
  );

  return {
    xCells,
    yCells,
    signature: `${xCells}x${yCells}`
  };
}

function cancelRegimeMapRebuildTimer(): void {
  if (regimeMapRebuildTimer === null) return;
  window.clearTimeout(regimeMapRebuildTimer);
  regimeMapRebuildTimer = null;
}

function flushRegimeMapRebuild(): void {
  cancelRegimeMapRebuildTimer();
  if (!pendingRegimeMapKey || pendingRegimeMapKey === regimeMapCacheKey) {
    pendingRegimeMapKey = null;
    pendingRegimeMapResolution = null;
    return;
  }
  buildRegimeMapField(pendingRegimeMapResolution ?? regimeMapGridResolution());
  regimeMapCacheKey = pendingRegimeMapKey;
  pendingRegimeMapKey = null;
  pendingRegimeMapResolution = null;
}

function scheduleRegimeMapRebuild(
  nextKey: string,
  resolution: RegimeMapGridResolution
): void {
  pendingRegimeMapKey = nextKey;
  pendingRegimeMapResolution = resolution;
  cancelRegimeMapRebuildTimer();
  regimeMapRebuildTimer = window.setTimeout(() => {
    regimeMapRebuildTimer = null;
    flushRegimeMapRebuild();
  }, REGIME_MAP_REBUILD_DEBOUNCE_MS);
}

function buildRegimeMapField(resolution: RegimeMapGridResolution): void {
  regimeMapBuildCount += 1;
  regimeMapLastResolution = resolution.signature;
  const xLog = logspace(
    Math.log10(TEMPERATURE_MIN_K),
    Math.log10(TEMPERATURE_MAX_K),
    resolution.xCells
  ).map((value) => Math.log10(value));
  const yLog = logspace(
    Math.log10(DENSITY_MIN_G_PER_CM3),
    Math.log10(DENSITY_MAX_G_PER_CM3),
    resolution.yCells
  ).map((value) => Math.log10(value));

  const z: RegimeChannelCode[][] = [];
  const labels: string[][] = [];

  for (const logDensity of yLog) {
    const zRow: RegimeChannelCode[] = [];
    const labelRow: string[] = [];
    for (const logTemperature of xLog) {
      const sample = StellarEosModel.evaluateStateCgs({
        input: {
          temperatureK: Math.pow(10, logTemperature),
          densityGPerCm3: Math.pow(10, logDensity),
          composition: state.composition,
          radiationDepartureEta: state.radiationDepartureEta
        }
      });
      const code = channelCode(sample.dominantPressureChannel);
      zRow.push(code);
      labelRow.push(channelLabelFromCode(code));
    }
    z.push(zRow);
    labels.push(labelRow);
  }
  regimeMapGridData = { xLog, yLog, z, labels };
}

type RegimeMapPlotState = {
  model: StellarEosStateCgs;
  deferRegimeMapFieldRebuild?: boolean;
};

function regimeMapPlotStateFromModel(
  model: StellarEosStateCgs,
  args: { deferRegimeMapFieldRebuild?: boolean } = {}
): RegimeMapPlotState {
  return {
    model,
    deferRegimeMapFieldRebuild: args.deferRegimeMapFieldRebuild
  };
}

function regimeMapPatch(plotState: RegimeMapPlotState): {
  traces: PlotTrace[];
  xDomain: [number, number];
  yDomain: [number, number];
  layoutOverrides: PlotLayoutOverrides;
} {
  const model = plotState.model;
  const resolution = regimeMapGridResolution();
  const nextKey = `${compositionRegimeKey(state.composition, state.radiationDepartureEta)}|${resolution.signature}`;
  if (nextKey !== regimeMapCacheKey) {
    if (plotState.deferRegimeMapFieldRebuild) {
      scheduleRegimeMapRebuild(nextKey, resolution);
    } else {
      pendingRegimeMapKey = nextKey;
      pendingRegimeMapResolution = resolution;
      flushRegimeMapRebuild();
    }
  }

  if (!regimeMapGridData) {
    buildRegimeMapField(resolution);
  }
  if (!regimeMapGridData) {
    return {
      traces: [],
      xDomain: [Math.log10(TEMPERATURE_MIN_K), Math.log10(TEMPERATURE_MAX_K)],
      yDomain: [Math.log10(DENSITY_MIN_G_PER_CM3), Math.log10(DENSITY_MAX_G_PER_CM3)],
      layoutOverrides: {}
    };
  }

  const currentLogT = Math.log10(model.input.temperatureK);
  const currentLogRho = Math.log10(model.input.densityGPerCm3);
  regimeMapCurrentLogPoint = {
    log10Temperature: currentLogT,
    log10Density: currentLogRho
  };

  const presetLogT = PRESETS.map((preset) => Math.log10(preset.temperatureK));
  const presetLogRho = PRESETS.map((preset) => Math.log10(preset.densityGPerCm3));

  const traces: PlotTrace[] = [
    {
      kind: "heatmap",
      id: "dominance-field",
      label: "Dominant channel field",
      x: regimeMapGridData.xLog,
      y: regimeMapGridData.yLog,
      z: regimeMapGridData.z,
      customData: regimeMapGridData.labels,
      hoverTemplate:
        "log10(T/K)=%{x:.2f}<br>log10(rho/(g cm^-3))=%{y:.2f}<br>%{customdata}<extra></extra>",
      zMin: 0,
      zMax: 3,
      showScale: false,
      colorScale: EOS_REGIME_COLOR_SCALE,
      smooth: "best",
      showLegend: false
    },
    {
      id: "preset-anchors",
      label: "Preset anchors",
      mode: "points",
      pointRadius: 3.8,
      colorVar: "rgba(244, 249, 255, 0.76)",
      markerLineColor: "rgba(8, 14, 22, 0.92)",
      markerLineWidth: 1.1,
      hoverTemplate: "Preset anchors<extra></extra>",
      showLegend: false,
      points: presetLogT.map((logT, index) => ({ x: logT, y: presetLogRho[index] }))
    },
    {
      id: "current-state",
      label: "Current state",
      mode: "points",
      pointRadius: 5.6,
      colorVar: "#4ce0ea",
      markerSymbol: "diamond",
      markerLineColor: "rgba(8, 12, 20, 0.96)",
      markerLineWidth: 1.6,
      hoverTemplate: "Current state<extra></extra>",
      showLegend: false,
      points: [{ x: currentLogT, y: currentLogRho }]
    }
  ];

  const log10Temperature = Math.log10(model.input.temperatureK);
  const log10Density = Math.log10(model.input.densityGPerCm3);
  regimeDetail.textContent = `Point details: $\\log_{10}(T/\\mathrm{K})=${formatFraction(log10Temperature, 2)}$, $\\log_{10}(\\rho/(\\mathrm{g\\ cm^{-3}}))=${formatFraction(log10Density, 2)}$, $P_{\\rm rad}/P_{\\rm gas}=${formatScientific(model.pressureRatios.radiationToGas, 3)}$, $P_{\\rm deg,e}/P_{\\rm tot}=${formatScientific(model.pressureRatios.degeneracyToTotal, 3)}$.`;
  regimeSummary.textContent = `Interpretation: ${dominantChannelLabel(model)} dominates at the highlighted state; white markers show preset anchors.`;
  renderMath(regimeDetail);
  renderMath(regimeSummary);
  regimeMap.setAttribute(
    "aria-label",
    "EOS dominance heatmap over log density and log temperature with current-state marker"
  );

  return {
    traces,
    xDomain: [Math.log10(TEMPERATURE_MIN_K), Math.log10(TEMPERATURE_MAX_K)],
    yDomain: [Math.log10(DENSITY_MIN_G_PER_CM3), Math.log10(DENSITY_MAX_G_PER_CM3)],
    layoutOverrides: {
      showlegend: false,
      margin: { l: 84, r: 20, t: 16, b: 62 },
      plot_bgcolor: "rgba(5, 12, 21, 0.98)",
      hoverlabel: {
        bgcolor: "rgba(8, 16, 24, 0.96)",
        bordercolor: "rgba(132, 156, 188, 0.66)",
        font: { size: 12, color: "#e8efff" }
      },
      xaxis: {
        title: { text: "log<sub>10</sub>(T/K)", standoff: 8 },
        tickvals: [3, 4, 5, 6, 7, 8, 9],
        ticktext: [
          "10<sup>3</sup>",
          "10<sup>4</sup>",
          "10<sup>5</sup>",
          "10<sup>6</sup>",
          "10<sup>7</sup>",
          "10<sup>8</sup>",
          "10<sup>9</sup>"
        ],
        automargin: true
      },
      yaxis: {
        title: { text: "log<sub>10</sub>(rho/(g cm<sup>-3</sup>))", standoff: 8 },
        tickvals: [-10, -5, 0, 5, 10],
        ticktext: [
          "10<sup>-10</sup>",
          "10<sup>-5</sup>",
          "10<sup>0</sup>",
          "10<sup>5</sup>",
          "10<sup>10</sup>"
        ],
        automargin: true
      },
      uirevision: "cp-eos-regime-map"
    }
  };
}

const eosRegimeMapPlotSpec: PlotSpec<RegimeMapPlotState> = {
  id: "eos-regime-map",
  axes: {
    x: {
      label: "log10(T/K)",
      scale: "linear",
      min: Math.log10(TEMPERATURE_MIN_K),
      max: Math.log10(TEMPERATURE_MAX_K),
      tickCount: 7,
      tickCountMobile: 6
    },
    y: {
      label: "log10(rho/(g cm^-3))",
      scale: "linear",
      min: Math.log10(DENSITY_MIN_G_PER_CM3),
      max: Math.log10(DENSITY_MAX_G_PER_CM3),
      tickCount: 6,
      tickCountMobile: 5
    }
  },
  interaction: {
    hover: true,
    zoom: false,
    pan: false,
    crosshair: false
  },
  ariaLabel: "EOS dominance heatmap over log density and log temperature",
  init(plotState) {
    return regimeMapPatch(plotState);
  },
  update(plotState) {
    return regimeMapPatch(plotState);
  }
};

const regimeMapPlotController = mountPlot(
  regimeMap,
  eosRegimeMapPlotSpec,
  regimeMapPlotStateFromModel(evaluateModel())
);

function renderAdvancedDiagnostics(model: StellarEosStateCgs): void {
  xFValue.textContent = formatScientific(model.fermiRelativityX, 5);
  fermiRegimeValue.textContent = fermiRelativityRegimeLabelLatex(model.fermiRelativityRegime);
  renderMath(fermiRegimeValue);
  finiteTCorrectionValue.textContent = Number.isFinite(model.finiteTemperatureDegeneracyCorrectionFactor)
    ? formatScientific(model.finiteTemperatureDegeneracyCorrectionFactor, 5)
    : "—";
  finiteTValidityValue.textContent = `${model.finiteTemperatureDegeneracyAssessment.label} (${electronDegeneracyMethodLabel(model.electronDegeneracyMethod)})`;
  renderMath(finiteTValidityValue);
  neutronExtensionValue.textContent = formatScientific(
    model.neutronExtensionPressureDynePerCm2,
    5
  );
}

function exportResults(model: StellarEosStateCgs): ExportPayloadV1 {
  const composition = model.normalizedComposition;

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Preset", value: PRESET_BY_ID[state.selectedPresetId].label },
      { name: "Temperature T (K)", value: formatScientific(model.input.temperatureK, 4) },
      {
        name: "Density rho (g cm^-3)",
        value: formatScientific(model.input.densityGPerCm3, 4)
      },
      {
        name: "Composition mass fractions (X,Y,Z)",
        value: `(${formatFraction(composition.hydrogenMassFractionX, 3)}, ${formatFraction(composition.heliumMassFractionY, 3)}, ${formatFraction(composition.metalMassFractionZ, 3)})`
      }
    ],
    readouts: [
      { name: "mu (mean mass per particle in m_u)", value: formatFraction(model.meanMolecularWeightMu, 5) },
      {
        name: "mu_e (mean mass per electron in m_u)",
        value: formatFraction(model.meanMolecularWeightMuE, 5)
      },
      {
        name: "P_gas (dyne cm^-2)",
        value: formatScientific(model.gasPressureDynePerCm2, 5)
      },
      {
        name: "P_rad (dyne cm^-2)",
        value: formatScientific(model.radiationPressureDynePerCm2, 5)
      },
      {
        name: "P_deg,e (dyne cm^-2)",
        value: formatScientific(model.electronDegeneracyPressureDynePerCm2, 5)
      },
      {
        name: "P_tot (dyne cm^-2)",
        value: formatScientific(model.totalPressureDynePerCm2, 5)
      },
      {
        name: "P_rad/P_gas",
        value: formatScientific(model.pressureRatios.radiationToGas, 5)
      },
      {
        name: "P_deg,e/P_tot",
        value: formatScientific(model.pressureRatios.degeneracyToTotal, 5)
      },
      {
        name: "beta=P_gas/P_tot",
        value: formatScientific(model.pressureRatios.betaGasToTotal, 5)
      },
      {
        name: "chi_deg=T/T_F",
        value: formatScientific(model.chiDegeneracy, 5)
      },
      {
        name: "x_F=p_F/(m_e c)",
        value: formatScientific(model.fermiRelativityX, 5)
      },
      {
        name: "Fermi relativity regime",
        value: model.fermiRelativityRegime.label
      },
      {
        name: "Sommerfeld factor 1 + (5*pi^2/12)(T/T_F)^2",
        value: Number.isFinite(model.finiteTemperatureDegeneracyCorrectionFactor)
          ? formatScientific(model.finiteTemperatureDegeneracyCorrectionFactor, 5)
          : "—"
      },
      {
        name: "Finite-T validity",
        value: `${model.finiteTemperatureDegeneracyAssessment.label} (${electronDegeneracyMethodLabel(model.electronDegeneracyMethod)})`
      },
      {
        name: "P_e,FD (dyne cm^-2)",
        value: formatScientific(model.electronPressureFiniteTDynePerCm2, 5)
      },
      {
        name: "P_e,classical (dyne cm^-2)",
        value: formatScientific(model.electronPressureClassicalDynePerCm2, 5)
      },
      {
        name: "Extension pressure P_ext (dyne cm^-2)",
        value: formatScientific(model.extensionPressureDynePerCm2, 5)
      },
      {
        name: "Neutron extension pressure (dyne cm^-2)",
        value: formatScientific(model.neutronExtensionPressureDynePerCm2, 5)
      },
      {
        name: "Dominant pressure channel",
        value: dominantChannelLabel(model)
      }
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

function render(args: { deferRegimeMapFieldRebuild?: boolean } = {}): void {
  const temperatureSliderValue = valueToLogSlider({
    value: state.temperatureK,
    sliderMin: 0,
    sliderMax: 1000,
    valueMin: TEMPERATURE_MIN_K,
    valueMax: TEMPERATURE_MAX_K
  });
  const densitySliderValue = valueToLogSlider({
    value: state.densityGPerCm3,
    sliderMin: 0,
    sliderMax: 1000,
    valueMin: DENSITY_MIN_G_PER_CM3,
    valueMax: DENSITY_MAX_G_PER_CM3
  });

  tempSlider.value = Number.isFinite(temperatureSliderValue)
    ? String(Math.round(temperatureSliderValue))
    : "0";
  rhoSlider.value = Number.isFinite(densitySliderValue)
    ? String(Math.round(densitySliderValue))
    : "0";

  tempValue.textContent = `${formatScientific(state.temperatureK, 4)} K`;
  rhoValue.textContent = `${formatScientific(state.densityGPerCm3, 4)} g cm^-3`;

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

  const model = evaluateModel();
  pressureCurvePlotController.update(pressurePlotStateFromModel(model));
  const dominantPressureDynePerCm2 = dominantPressureValue(model);

  setPressureCard(
    cardGas,
    pGasBar,
    pGasValue,
    model.gasPressureDynePerCm2,
    dominantPressureDynePerCm2
  );
  setPressureCard(
    cardRadiation,
    pRadBar,
    pRadValue,
    model.radiationPressureDynePerCm2,
    dominantPressureDynePerCm2
  );
  setPressureCard(
    cardDegeneracy,
    pDegBar,
    pDegValue,
    model.electronDegeneracyPressureDynePerCm2,
    dominantPressureDynePerCm2
  );

  pTotalValue.textContent = formatScientific(model.totalPressureDynePerCm2, 5);
  dominantChannel.textContent = dominantChannelLabel(model);

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
  regimeMapPlotController.update(
    regimeMapPlotStateFromModel(model, {
      deferRegimeMapFieldRebuild: args.deferRegimeMapFieldRebuild
    })
  );
  renderPresetState();

  (window as Window & { __cp?: unknown }).__cp = {
    slug: "eos-lab",
    mode: runtime.mode,
    regimeMapBuildCount,
    regimeMapGridResolution: regimeMapLastResolution,
    regimeMapCurrentLogPoint,
    exportResults: () => exportResults(model)
  };
}

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
          const anchorIds: Preset["id"][] = [
            "solar-core",
            "massive-core",
            "white-dwarf-core"
          ];
          return anchorIds.map((presetId) => {
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

demoModes.bindButtons({
  helpButton,
  stationButton: stationModeButton
});

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const presetId = button.dataset.presetId as Preset["id"] | undefined;
    if (!presetId || !(presetId in PRESET_BY_ID)) return;
    applyPreset(presetId);
    render();
  });
}

tempSlider.addEventListener("input", () => {
  const sliderValue = clamp(Number(tempSlider.value), 0, 1000);
  const nextTemperatureK = logSliderToValue({
    sliderValue,
    sliderMin: 0,
    sliderMax: 1000,
    valueMin: TEMPERATURE_MIN_K,
    valueMax: TEMPERATURE_MAX_K
  });
  if (Number.isFinite(nextTemperatureK)) {
    state.temperatureK = nextTemperatureK;
  }
  render();
});

rhoSlider.addEventListener("input", () => {
  const sliderValue = clamp(Number(rhoSlider.value), 0, 1000);
  const nextDensity = logSliderToValue({
    sliderValue,
    sliderMin: 0,
    sliderMax: 1000,
    valueMin: DENSITY_MIN_G_PER_CM3,
    valueMax: DENSITY_MAX_G_PER_CM3
  });
  if (Number.isFinite(nextDensity)) {
    state.densityGPerCm3 = nextDensity;
  }
  render();
});

xSlider.addEventListener("input", () => {
  const nextX = clamp(Number(xSlider.value) / 1000, 0, 1);
  setCompositionFromXY({
    hydrogenMassFractionX: nextX,
    heliumMassFractionY: state.composition.heliumMassFractionY
  });
  render({ deferRegimeMapFieldRebuild: true });
});

ySlider.addEventListener("input", () => {
  const nextY = clamp(Number(ySlider.value) / 1000, 0, 1);
  setCompositionFromXY({
    hydrogenMassFractionX: state.composition.hydrogenMassFractionX,
    heliumMassFractionY: nextY
  });
  render({ deferRegimeMapFieldRebuild: true });
});

function finalizeCompositionInteraction(): void {
  flushRegimeMapRebuild();
  render();
}

xSlider.addEventListener("change", finalizeCompositionInteraction);
ySlider.addEventListener("change", finalizeCompositionInteraction);
xSlider.addEventListener("pointerup", finalizeCompositionInteraction);
ySlider.addEventListener("pointerup", finalizeCompositionInteraction);

copyResults.addEventListener("click", () => {
  const model = evaluateModel();
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults(model))
    .then(() => {
      setLiveRegionText(status, "Copied results to clipboard.");
    })
    .catch((err) => {
      setLiveRegionText(
        status,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
      );
    });
});

applyPreset("solar-core");
render();
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
}

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

let resizeFrame: number | null = null;
window.addEventListener("resize", () => {
  if (resizeFrame !== null) return;
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    regimeMapPlotController.update(
      regimeMapPlotStateFromModel(evaluateModel(), { deferRegimeMapFieldRebuild: true })
    );
  });
});

window.addEventListener(
  "beforeunload",
  () => {
    cancelRegimeMapRebuildTimer();
    pressureCurvePlotController.destroy();
    regimeMapPlotController.destroy();
  },
  { once: true }
);
