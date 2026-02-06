import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initStarfield,
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

const tempSliderEl = document.querySelector<HTMLInputElement>("#tempSlider");
const tempValueEl = document.querySelector<HTMLSpanElement>("#tempValue");
const rhoSliderEl = document.querySelector<HTMLInputElement>("#rhoSlider");
const rhoValueEl = document.querySelector<HTMLSpanElement>("#rhoValue");

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

const muValueEl = document.querySelector<HTMLElement>("#muValue");
const muEValueEl = document.querySelector<HTMLElement>("#muEValue");
const betaValueEl = document.querySelector<HTMLElement>("#betaValue");
const radGasValueEl = document.querySelector<HTMLElement>("#radGasValue");
const degTotalValueEl = document.querySelector<HTMLElement>("#degTotalValue");
const chiDegValueEl = document.querySelector<HTMLElement>("#chiDegValue");
const degRegimeValueEl = document.querySelector<HTMLElement>("#degRegimeValue");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

if (
  !tempSliderEl ||
  !tempValueEl ||
  !rhoSliderEl ||
  !rhoValueEl ||
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
  !muValueEl ||
  !muEValueEl ||
  !betaValueEl ||
  !radGasValueEl ||
  !degTotalValueEl ||
  !chiDegValueEl ||
  !degRegimeValueEl ||
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

const muValue = muValueEl;
const muEValue = muEValueEl;
const betaValue = betaValueEl;
const radGasValue = radGasValueEl;
const degTotalValue = degTotalValueEl;
const chiDegValue = chiDegValueEl;
const degRegimeValue = degRegimeValueEl;

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

function applyPreset(presetId: Preset["id"]): void {
  const preset = PRESET_BY_ID[presetId];
  state.selectedPresetId = preset.id;
  state.temperatureK = preset.temperatureK;
  state.densityGPerCm3 = preset.densityGPerCm3;
  state.composition = preset.composition;
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
    case "mixed":
      return "Mixed (no single dominant channel)";
    default:
      return "Unavailable";
  }
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
        name: "Dominant pressure channel",
        value: dominantChannelLabel(model)
      }
    ],
    notes: [
      "Gas pressure uses P_gas = rho k_B T / (mu m_u).",
      "Radiation pressure uses an LTE-like closure P_rad = eta_rad a T^4 / 3 (default eta_rad=1).",
      "Electron degeneracy uses a zero-temperature Chandrasekhar baseline with diagnostics in x_F and T/T_F.",
      "Kernel supports additional pressure terms for future finite-T Fermi and neutron extensions without API breakage."
    ]
  };
}

function render(): void {
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

  const model = evaluateModel();
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
  degRegimeValue.textContent = model.degeneracyRegime.label;

  renderRadiationClosure(model);
  renderPresetState();

  (window as Window & { __cp?: unknown }).__cp = {
    slug: "eos-lab",
    mode: runtime.mode,
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
          "Use the readouts to connect mu and mu_e to particle and electron density changes.",
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
