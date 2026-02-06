import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  mountPlot,
  initStarfield,
  renderMath,
  setLiveRegionText
} from "@cosmic/runtime";
import { linspace } from "@cosmic/math";
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
  regimeMapCoordinates,
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
const REGIME_MAP_GRID_RENDER_X = 42;
const REGIME_MAP_GRID_RENDER_Y = 34;
const PRESSURE_CURVE_SAMPLES = 96;

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
const regimeMapEl = document.querySelector<SVGSVGElement>("#regimeMap");
const regimeGridEl = document.querySelector<SVGGElement>("#regimeGrid");
const regimeCellsEl = document.querySelector<SVGGElement>("#regimeCells");
const regimePresetMarkersEl = document.querySelector<SVGGElement>("#regimePresetMarkers");
const regimeCurrentPointEl = document.querySelector<SVGCircleElement>("#regimeCurrentPoint");
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
  !regimeGridEl ||
  !regimeCellsEl ||
  !regimePresetMarkersEl ||
  !regimeCurrentPointEl ||
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
const regimeGrid = regimeGridEl;
const regimeCells = regimeCellsEl;
const regimePresetMarkers = regimePresetMarkersEl;
const regimeCurrentPoint = regimeCurrentPointEl;
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
  const logDensityGrid = linspace(logDensityMin, logDensityMax, PRESSURE_CURVE_SAMPLES);

  for (const logDensity of logDensityGrid) {
    const densityGPerCm3 = Math.pow(10, logDensity);
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
      colorVar: "var(--cp-success)",
      lineWidth: 3
    },
    {
      id: "p-rad",
      label: "P_rad",
      points: radiationPoints,
      colorVar: "var(--cp-accent)",
      lineWidth: 3
    },
    {
      id: "p-deg-e",
      label: "P_deg,e",
      points: degeneracyPoints,
      colorVar: "var(--cp-glow-teal)",
      lineWidth: 3
    },
    {
      id: "p-total",
      label: "P_tot",
      points: totalPoints,
      colorVar: "var(--cp-text)",
      lineWidth: 3.4
    },
    {
      id: "current-state",
      label: "Current state",
      mode: "points",
      pointRadius: 5,
      colorVar: "var(--cp-warn)",
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
  plotState: EosPressurePlotState;
  yDomain: [number, number] | undefined;
}): PlotLayoutOverrides {
  const current = args.plotState.currentModel;
  const dominantLabel = dominantChannelLabel(current);
  const currentDensity = args.plotState.densityGPerCm3;
  const currentTotalPressure = current.totalPressureDynePerCm2;
  const annotation = [
    `T = ${formatScientific(args.plotState.temperatureK, 3)} K`,
    `rho = ${formatScientific(currentDensity, 3)} g cm^-3`,
    `P_tot = ${formatScientific(currentTotalPressure, 3)} dyne cm^-2`,
    `Dominant: ${dominantLabel}`
  ].join("<br>");

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
    legend: {
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: 1.18,
      yanchor: "top",
      traceorder: "normal"
    },
    xaxis: {
      exponentformat: "power",
      showexponent: "all",
      tickformat: ".1e"
    },
    yaxis: {
      ...yAxisOverride
    },
    shapes: [
      {
        type: "line",
        xref: "x",
        yref: "paper",
        x0: currentDensity,
        x1: currentDensity,
        y0: 0,
        y1: 1,
        line: {
          color: "#7BC7FF",
          width: 1,
          dash: "dot"
        }
      },
      {
        type: "line",
        xref: "paper",
        yref: "y",
        x0: 0,
        x1: 1,
        y0: currentTotalPressure,
        y1: currentTotalPressure,
        line: {
          color: "#FFC857",
          width: 1,
          dash: "dot"
        }
      }
    ],
    annotations: [
      {
        xref: "paper",
        yref: "paper",
        x: 0.01,
        y: 0.98,
        xanchor: "left",
        yanchor: "top",
        align: "left",
        text: annotation,
        showarrow: false,
        borderpad: 5,
        bgcolor: "rgba(8, 16, 24, 0.72)",
        bordercolor: "rgba(120, 154, 196, 0.42)"
      }
    ]
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
    layoutOverrides: pressureCurveLayoutOverrides({ plotState, yDomain })
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

function mapChannel(channel: StellarEosStateCgs["dominantPressureChannel"]): string {
  return channel;
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

let regimeMapCacheKey: string | null = null;
let pendingRegimeMapKey: string | null = null;
let regimeMapRebuildTimer: number | null = null;
let regimeMapBuildCount = 0;
let regimePresetMarkersBuilt = false;
let regimeGridBuilt = false;

function cancelRegimeMapRebuildTimer(): void {
  if (regimeMapRebuildTimer === null) return;
  window.clearTimeout(regimeMapRebuildTimer);
  regimeMapRebuildTimer = null;
}

function flushRegimeMapRebuild(): void {
  cancelRegimeMapRebuildTimer();
  if (!pendingRegimeMapKey || pendingRegimeMapKey === regimeMapCacheKey) {
    pendingRegimeMapKey = null;
    return;
  }
  buildRegimeMapField();
  regimeMapCacheKey = pendingRegimeMapKey;
  pendingRegimeMapKey = null;
}

function scheduleRegimeMapRebuild(nextKey: string): void {
  pendingRegimeMapKey = nextKey;
  cancelRegimeMapRebuildTimer();
  regimeMapRebuildTimer = window.setTimeout(() => {
    regimeMapRebuildTimer = null;
    flushRegimeMapRebuild();
  }, REGIME_MAP_REBUILD_DEBOUNCE_MS);
}

function buildRegimeMapField(): void {
  regimeMapBuildCount += 1;
  const svgNs = "http://www.w3.org/2000/svg";
  const cellWidth = 100 / REGIME_MAP_GRID_RENDER_X;
  const cellHeight = 100 / REGIME_MAP_GRID_RENDER_Y;

  regimeCells.replaceChildren();
  for (let iy = 0; iy < REGIME_MAP_GRID_RENDER_Y; iy += 1) {
    for (let ix = 0; ix < REGIME_MAP_GRID_RENDER_X; ix += 1) {
      const xFrac = (ix + 0.5) / REGIME_MAP_GRID_RENDER_X;
      const yFrac = (iy + 0.5) / REGIME_MAP_GRID_RENDER_Y;
      const temperatureK = Math.pow(
        10,
        Math.log10(TEMPERATURE_MIN_K) + xFrac * (Math.log10(TEMPERATURE_MAX_K) - Math.log10(TEMPERATURE_MIN_K))
      );
      const densityGPerCm3 = Math.pow(
        10,
        Math.log10(DENSITY_MAX_G_PER_CM3) - yFrac * (Math.log10(DENSITY_MAX_G_PER_CM3) - Math.log10(DENSITY_MIN_G_PER_CM3))
      );

      const sample = StellarEosModel.evaluateStateCgs({
        input: {
          temperatureK,
          densityGPerCm3,
          composition: state.composition,
          radiationDepartureEta: state.radiationDepartureEta
        }
      });

      const rect = document.createElementNS(svgNs, "rect");
      rect.setAttribute("x", String(ix * cellWidth));
      rect.setAttribute("y", String(iy * cellHeight));
      rect.setAttribute("width", String(cellWidth));
      rect.setAttribute("height", String(cellHeight));
      rect.dataset.channel = mapChannel(sample.dominantPressureChannel);
      regimeCells.append(rect);
    }
  }
}

function buildRegimeGridLines(): void {
  if (regimeGridBuilt) return;
  const svgNs = "http://www.w3.org/2000/svg";
  regimeGrid.replaceChildren();
  const ticks = [0, 25, 50, 75, 100];
  for (const pct of ticks) {
    const vertical = document.createElementNS(svgNs, "line");
    vertical.setAttribute("x1", String(pct));
    vertical.setAttribute("y1", "0");
    vertical.setAttribute("x2", String(pct));
    vertical.setAttribute("y2", "100");
    regimeGrid.append(vertical);

    const horizontal = document.createElementNS(svgNs, "line");
    horizontal.setAttribute("x1", "0");
    horizontal.setAttribute("y1", String(pct));
    horizontal.setAttribute("x2", "100");
    horizontal.setAttribute("y2", String(pct));
    regimeGrid.append(horizontal);
  }
  regimeGridBuilt = true;
}

function buildRegimePresetMarkers(): void {
  if (regimePresetMarkersBuilt) return;
  const svgNs = "http://www.w3.org/2000/svg";
  regimePresetMarkers.replaceChildren();
  for (const preset of PRESETS) {
    const coords = regimeMapCoordinates({
      temperatureK: preset.temperatureK,
      densityGPerCm3: preset.densityGPerCm3,
      temperatureMinK: TEMPERATURE_MIN_K,
      temperatureMaxK: TEMPERATURE_MAX_K,
      densityMinGPerCm3: DENSITY_MIN_G_PER_CM3,
      densityMaxGPerCm3: DENSITY_MAX_G_PER_CM3
    });

    const marker = document.createElementNS(svgNs, "circle");
    marker.setAttribute("cx", coords.xPct.toFixed(2));
    marker.setAttribute("cy", coords.yPct.toFixed(2));
    marker.setAttribute("r", "1.35");
    marker.setAttribute("data-preset-id", preset.id);
    const title = document.createElementNS(svgNs, "title");
    title.textContent = preset.label;
    marker.append(title);
    regimePresetMarkers.append(marker);
  }
  regimePresetMarkersBuilt = true;
}

function renderRegimeMap(
  model: StellarEosStateCgs,
  args: { deferRegimeMapFieldRebuild?: boolean } = {}
): void {
  const nextKey = compositionRegimeKey(state.composition, state.radiationDepartureEta);
  if (nextKey !== regimeMapCacheKey) {
    if (args.deferRegimeMapFieldRebuild) {
      scheduleRegimeMapRebuild(nextKey);
    } else {
      pendingRegimeMapKey = nextKey;
      flushRegimeMapRebuild();
    }
  }
  buildRegimeGridLines();
  buildRegimePresetMarkers();

  const currentCoords = regimeMapCoordinates({
    temperatureK: model.input.temperatureK,
    densityGPerCm3: model.input.densityGPerCm3,
    temperatureMinK: TEMPERATURE_MIN_K,
    temperatureMaxK: TEMPERATURE_MAX_K,
    densityMinGPerCm3: DENSITY_MIN_G_PER_CM3,
    densityMaxGPerCm3: DENSITY_MAX_G_PER_CM3
  });
  regimeCurrentPoint.setAttribute("cx", currentCoords.xPct.toFixed(2));
  regimeCurrentPoint.setAttribute("cy", currentCoords.yPct.toFixed(2));
  regimeCurrentPoint.setAttribute("aria-label", "Current EOS state");

  const log10Temperature = Math.log10(model.input.temperatureK);
  const log10Density = Math.log10(model.input.densityGPerCm3);
  regimeDetail.textContent = `Point details: log10(T/K)=${formatFraction(log10Temperature, 2)}, log10(rho/(g cm^-3))=${formatFraction(log10Density, 2)}, P_rad/P_gas=${formatScientific(model.pressureRatios.radiationToGas, 3)}, P_deg,e/P_tot=${formatScientific(model.pressureRatios.degeneracyToTotal, 3)}.`;
  regimeSummary.textContent = `Interpretation: ${dominantChannelLabel(model)} dominates at the current point (marker); preset dots provide quick reference anchors.`;
  regimeMap.setAttribute(
    "aria-label",
    "EOS dominance map over log density and log temperature with current-state marker"
  );
}

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
  renderRegimeMap(model, { deferRegimeMapFieldRebuild: args.deferRegimeMapFieldRebuild });
  renderPresetState();

  (window as Window & { __cp?: unknown }).__cp = {
    slug: "eos-lab",
    mode: runtime.mode,
    regimeMapBuildCount,
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

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

window.addEventListener(
  "beforeunload",
  () => {
    pressureCurvePlotController.destroy();
  },
  { once: true }
);
