import { ChallengeEngine, createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, initTabs, setLiveRegionText } from "@cosmic/runtime";
import type { Challenge, ExportPayloadV1 } from "@cosmic/runtime";
import { SpectralLineModel } from "@cosmic/physics";
import {
  clamp,
  formatNumber,
  formatFrequencyReadout,
  formatWavelengthReadout,
  wavelengthToRgbString,
  isVisible,
  compressedOrbitRadius,
  energyLevelY,
  type TransitionMode,
  type ViewTab,
  type SeriesFilter,
  type MysteryTarget,
  type InferenceMode,
  type ReflectionEvidenceKey,
  nextSequenceIndex,
  filterHydrogenTransitionsBySeries,
  spectrumDomainForSeries,
  shouldRenderEmission,
  selectRepresentativeElementLine,
  computeSeriesPileupDensity,
  computeLargeNSpacingApproximation,
  transitionAnnouncement,
  buildSpectralExportPayload,
  wavelengthToFraction,
  transitionLabel,
  createSeededRandom,
  pickMysteryTarget,
  isMysteryCopyLocked,
  isMysteryReflectionReady,
  isHydrogenInferenceContext,
} from "./logic";

// ── DOM elements ──────────────────────────────────────────

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel);

const nUpperSlider = $<HTMLInputElement>("#nUpperSlider")!;
const nLowerSlider = $<HTMLInputElement>("#nLowerSlider")!;
const nUpperValue = $<HTMLSpanElement>("#nUpperValue")!;
const nLowerValue = $<HTMLSpanElement>("#nLowerValue")!;
const inferenceForward = $<HTMLButtonElement>("#inferenceForward");
const inferenceInverse = $<HTMLButtonElement>("#inferenceInverse");
const forwardControls = $<HTMLDivElement>("#forwardControls");
const inverseControls = $<HTMLDivElement>("#inverseControls");
const inverseObservedWavelength = $<HTMLInputElement>("#inverseObservedWavelength");
const solveInverseBtn = $<HTMLButtonElement>("#solveInverse");
const inverseResult = $<HTMLParagraphElement>("#inverseResult");

const modeEmission = $<HTMLButtonElement>("#modeEmission")!;
const modeAbsorption = $<HTMLButtonElement>("#modeAbsorption")!;
const elemModeEmission = $<HTMLButtonElement>("#elemModeEmission")!;
const elemModeAbsorption = $<HTMLButtonElement>("#elemModeAbsorption")!;

const playTransitionBtn = $<HTMLButtonElement>("#playTransition")!;
const playBtn = $<HTMLButtonElement>("#btn-play")!;
const pauseBtn = $<HTMLButtonElement>("#btn-pause")!;
const stepBackBtn = $<HTMLButtonElement>("#btn-step-back")!;
const stepForwardBtn = $<HTMLButtonElement>("#btn-step-forward")!;
const resetBtn = $<HTMLButtonElement>("#btn-reset")!;
const speedSelect = $<HTMLSelectElement>("#speed-select")!;
const playbarState = $<HTMLSpanElement>("#playbarState")!;

const readoutTransitionLabel = $<HTMLDivElement>("#readoutTransitionLabel")!;
const readoutTransition = $<HTMLSpanElement>("#readoutTransition")!;
const readoutWavelength = $<HTMLSpanElement>("#readoutWavelength")!;
const readoutWavelengthUnit = readoutWavelength?.parentElement?.querySelector<HTMLSpanElement>(".cp-readout__unit");
const readoutEnergy = $<HTMLSpanElement>("#readoutEnergy")!;
const readoutFrequency = $<HTMLSpanElement>("#readoutFrequency")!;
const readoutFrequencyUnit = readoutFrequency?.parentElement?.querySelector<HTMLSpanElement>(".cp-readout__unit");
const readoutSeries = $<HTMLSpanElement>("#readoutSeries")!;
const readoutBand = $<HTMLSpanElement>("#readoutBand")!;

const bohrSvg = document.querySelector<SVGSVGElement>("#bohrAtom")!;
const energySvg = document.querySelector<SVGSVGElement>("#energyLevels")!;
const spectrumCanvas = $<HTMLCanvasElement>("#spectrumCanvas")!;
const seriesMicroscopeCanvas = $<HTMLCanvasElement>("#seriesMicroscopeCanvas");
const microscopeProbeSlider = $<HTMLInputElement>("#microscopeProbeSlider");
const microscopeProbeValue = $<HTMLSpanElement>("#microscopeProbeValue");
const microscopeInfinity = $<HTMLInputElement>("#microscopeInfinity");
const scalingInsight = $<HTMLParagraphElement>("#scalingInsight");
const temperatureSlider = $<HTMLInputElement>("#temperatureSlider");
const temperatureValue = $<HTMLSpanElement>("#temperatureValue");
const tempN1 = $<HTMLSpanElement>("#tempN1");
const tempN2 = $<HTMLSpanElement>("#tempN2");
const tempN3 = $<HTMLSpanElement>("#tempN3");
const tempNeutralProxy = $<HTMLSpanElement>("#tempNeutralProxy");
const tempBalmerProxy = $<HTMLSpanElement>("#tempBalmerProxy");

const stationModeBtn = $<HTMLButtonElement>("#stationMode")!;
const helpBtn = $<HTMLButtonElement>("#help")!;
const copyResultsBtn = $<HTMLButtonElement>("#copyResults")!;
const statusEl = $<HTMLParagraphElement>("#status")!;
const showHComparison = $<HTMLInputElement>("#showHComparison")!;
const hComparisonHint = $<HTMLParagraphElement>("#hComparisonHint");
const tabExploreEl = $<HTMLButtonElement>("#tab-explore");
const exploreLayout = document.querySelector<HTMLElement>(".explore-layout");

const mysterySpectrumBtn = $<HTMLButtonElement>("#mysterySpectrumBtn");
const mysteryPanel = $<HTMLDivElement>("#mysteryPanel");
const mysteryPrompt = $<HTMLParagraphElement>("#mysteryPrompt");
const mysteryGuessElement = $<HTMLSelectElement>("#mysteryGuessElement");
const guessModeEmission = $<HTMLButtonElement>("#guessModeEmission");
const guessModeAbsorption = $<HTMLButtonElement>("#guessModeAbsorption");
const checkMysteryAnswerBtn = $<HTMLButtonElement>("#checkMysteryAnswer");
const mysteryHintBtn = $<HTMLButtonElement>("#mysteryHint");
const exitMysteryBtn = $<HTMLButtonElement>("#exitMystery");
const elementsStandardControls = $<HTMLDivElement>("#elementsStandardControls");
const copyLockHint = $<HTMLParagraphElement>("#copyLockHint");
const hydrogenVizTop = $<HTMLDivElement>("#hydrogenVizTop");
const microscopePanel = $<HTMLDivElement>("#microscopePanel");
const elementsGuidance = $<HTMLDivElement>("#elementsGuidance");
const temperaturePanel = $<HTMLDivElement>("#temperaturePanel");
const orbitTooltip = $<HTMLDivElement>("#orbitTooltip");
const mysteryReflectionHint = $<HTMLParagraphElement>("#mysteryReflectionHint");

const presetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button.preset[data-n-upper]"));
const seriesChips = Array.from(document.querySelectorAll<HTMLButtonElement>("button.series-chip"));
const elementChips = Array.from(document.querySelectorAll<HTMLButtonElement>("button.element-chip"));
const inverseScopeChips = Array.from(document.querySelectorAll<HTMLButtonElement>("button.inverse-scope-chip"));
const reflectionChips = Array.from(document.querySelectorAll<HTMLButtonElement>("button.reflection-chip"));

if (!nUpperSlider || !nLowerSlider || !bohrSvg || !energySvg || !spectrumCanvas) {
  throw new Error("Missing required DOM elements for spectral-lines demo.");
}

const ctxOrNull = spectrumCanvas.getContext("2d");
if (!ctxOrNull) throw new Error("Canvas 2D context unavailable.");
const ctx = ctxOrNull;
const microscopeCtx = seriesMicroscopeCanvas?.getContext("2d") ?? null;

// ── Runtime ─────────────────────────────────────────────────

const demoUrl = new URL(window.location.href);

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:spectral-lines:mode",
  url: demoUrl
});

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── State ───────────────────────────────────────────────────

const state = {
  nUpper: 3,
  nLower: 2,
  mode: "emission" as TransitionMode,
  inferenceMode: "forward" as InferenceMode,
  viewTab: "hydrogen" as ViewTab,
  seriesFilter: "all" as SeriesFilter,
  selectedElement: "Na",
  showHComparison: false,
  inverse: {
    observedWavelengthNm: 656,
    seriesScope: "all" as SeriesFilter,
    lastInference: null as ReturnType<typeof SpectralLineModel.inferHydrogenTransitionFromObservedWavelength> | null,
  },
  microscope: {
    probeNUpper: 20,
    includeInfinity: false,
  },
  temperatureK: 9000,
  animating: false,
  sequencePlaying: false,
  sequenceDirection: 1 as -1 | 1,
  mystery: {
    active: false,
    targetElement: "H",
    targetMode: "emission" as TransitionMode,
    guessMode: "emission" as TransitionMode,
    reflectionEvidence: null as ReflectionEvidenceKey | null,
    revealed: false,
    lastTarget: null as MysteryTarget | null,
  },
};

const N_MAX = 8;
const INVERSE_N_UPPER_MAX = 40;
const MICROSCOPE_BIN_COUNT = 32;
const BOHR_VIEW_SIZE = 400;
const ENERGY_SVG_W = 220;
const ENERGY_SVG_H = 400;
const MYSTERY_ELEMENTS = ["H", "He", "Na", "Ca", "Fe"] as const;
const MYSTERY_TARGETS: MysteryTarget[] = MYSTERY_ELEMENTS.flatMap((element) => [
  { element, mode: "emission" as const },
  { element, mode: "absorption" as const },
]);
const mysterySeed = demoUrl.searchParams.get("mysterySeed");
const seededMysteryRandom = mysterySeed ? createSeededRandom(mysterySeed) : null;
let sequenceFrame = 0;
let sequenceLastTimestamp = 0;

const SEQUENCE_STEP_INTERVAL_MS = 520;

interface CurrentReadoutContext {
  transitionLabel: string;
  transitionText: string;
  wavelengthNm: number;
  energyEv: number;
  frequencyHz: number;
  series: string;
  band: string;
  representativeLineLabel?: string;
  inverseResidualNm?: number;
}

function activeHydrogenSeriesForMicroscope(): number {
  if (state.seriesFilter !== "all") return state.seriesFilter;
  if (state.inferenceMode === "inverse" && state.inverse.lastInference) {
    return state.inverse.lastInference.nLower;
  }
  return state.nLower;
}

function solveInverseTransition() {
  const scope = state.inverse.seriesScope;
  const inference = SpectralLineModel.inferHydrogenTransitionFromObservedWavelength({
    wavelengthNm: state.inverse.observedWavelengthNm,
    seriesFilter: scope,
    nUpperMax: INVERSE_N_UPPER_MAX,
  });
  state.inverse.lastInference = inference;
  if (!inference) {
    if (inverseResult) {
      inverseResult.textContent = "No valid hydrogen transition found for the entered wavelength.";
    }
    setLiveRegionText(statusEl, "No valid hydrogen transition found.");
    render();
    return;
  }

  state.nUpper = inference.nUpper;
  state.nLower = inference.nLower;
  state.seriesFilter = inference.nLower <= 4 ? (inference.nLower as SeriesFilter) : "all";

  if (inverseResult) {
    inverseResult.textContent = `Inferred ${transitionLabel(inference.nUpper, inference.nLower)} (${inference.seriesName}), DeltaE=${inference.energyEv.toFixed(3)} eV, residual=${inference.residualNm.toFixed(2)} nm (${inference.quality}).`;
  }
  render();
  setLiveRegionText(
    statusEl,
    `Inverse inference: ${transitionLabel(inference.nUpper, inference.nLower)} in ${inference.seriesName}, residual ${inference.residualNm.toFixed(2)} nm.`,
  );
}

function activeElementLineContext() {
  const catalog = SpectralLineModel.elementLines({ element: state.selectedElement });
  const representative = selectRepresentativeElementLine(catalog.lines);
  const wavelengthNm = representative?.wavelengthNm ?? NaN;
  const energyEv = Number.isFinite(wavelengthNm) && wavelengthNm > 0
    ? SpectralLineModel.BOHR.HC_EV_NM / wavelengthNm
    : NaN;
  const frequencyHz = Number.isFinite(wavelengthNm) && wavelengthNm > 0
    ? SpectralLineModel.BOHR.C_CM_PER_S / (wavelengthNm * 1e-7)
    : NaN;
  const representativeLineLabel = representative?.label ?? `${catalog.symbol} strongest line`;
  return {
    wavelengthNm,
    energyEv,
    frequencyHz,
    representativeLineLabel,
    band: SpectralLineModel.wavelengthBand({ wavelengthNm }),
  };
}

function currentReadoutContext(): CurrentReadoutContext {
  if (state.viewTab === "elements") {
    const elementContext = activeElementLineContext();
    const hideRepresentativeLabel = state.mystery.active && !state.mystery.revealed;
    return {
      transitionLabel: "Representative line",
      transitionText: hideRepresentativeLabel ? "Hidden during mystery challenge" : elementContext.representativeLineLabel,
      wavelengthNm: elementContext.wavelengthNm,
      energyEv: elementContext.energyEv,
      frequencyHz: elementContext.frequencyHz,
      series: state.mystery.active ? "Mystery spectrum" : "Element catalog",
      band: elementContext.band,
      representativeLineLabel: elementContext.representativeLineLabel,
    };
  }

  const inverseInference = state.inferenceMode === "inverse" ? state.inverse.lastInference : null;
  const wavelengthNm = inverseInference?.wavelengthNm ?? SpectralLineModel.transitionWavelengthNm({ nUpper: state.nUpper, nLower: state.nLower });
  const energyEv = inverseInference?.energyEv ?? SpectralLineModel.transitionEnergyEv({ nUpper: state.nUpper, nLower: state.nLower });
  const frequencyHz = inverseInference?.frequencyHz ?? SpectralLineModel.transitionFrequencyHz({ nUpper: state.nUpper, nLower: state.nLower });
  return {
    transitionLabel: "Transition",
    transitionText: transitionLabel(
      inverseInference?.nUpper ?? state.nUpper,
      inverseInference?.nLower ?? state.nLower,
    ),
    wavelengthNm,
    energyEv,
    frequencyHz,
    series: inverseInference?.seriesName ?? SpectralLineModel.seriesName({ nLower: state.nLower }),
    band: SpectralLineModel.wavelengthBand({ wavelengthNm }),
    inverseResidualNm: inverseInference?.residualNm,
  };
}

function isCopyLocked(): boolean {
  return isMysteryCopyLocked({
    viewTab: state.viewTab,
    mysteryActive: state.mystery.active,
    mysteryRevealed: state.mystery.revealed,
  });
}

function syncCopyLockState() {
  const locked = isCopyLocked();
  copyResultsBtn.disabled = locked;
  copyResultsBtn.setAttribute("aria-disabled", String(locked));
  if (copyLockHint) copyLockHint.hidden = !locked;
}

function announceCurrentTransition(prefix?: string) {
  const context = currentReadoutContext();
  if (state.viewTab === "elements" && state.mystery.active && !state.mystery.revealed) {
    const wavelength = formatWavelengthReadout(context.wavelengthNm);
    const mysteryMessage = `Mystery spectrum updated, representative wavelength ${wavelength.value} ${wavelength.unit}.`;
    setLiveRegionText(statusEl, prefix ? `${prefix} ${mysteryMessage}` : mysteryMessage);
    return;
  }
  const message = transitionAnnouncement({
    mode: state.mode,
    viewTab: state.viewTab,
    selectedElement: state.selectedElement,
    nUpper: state.nUpper,
    nLower: state.nLower,
    wavelengthNm: context.wavelengthNm,
    seriesName: state.viewTab === "hydrogen" ? context.series : "Element catalog",
    representativeLineLabel: context.representativeLineLabel,
  });
  setLiveRegionText(statusEl, prefix ? `${prefix} ${message}` : message);
}

function setMode(nextMode: TransitionMode) {
  state.mode = nextMode;
  render();
  announceCurrentTransition();
}

function setInferenceMode(nextMode: InferenceMode) {
  state.inferenceMode = nextMode;
  if (nextMode === "forward") {
    state.inverse.lastInference = null;
    if (inverseResult) {
      inverseResult.textContent = "Forward mode: choose quantum levels to predict wavelength.";
    }
  }
  render();
  setLiveRegionText(statusEl, nextMode === "inverse" ? "Inverse mode enabled: observed wavelength to inferred transition." : "Forward mode enabled: quantum levels to predicted wavelength.");
}

function setSidebarView(tab: ViewTab) {
  const sidebarTabH = document.getElementById("sidebar-tab-H") as HTMLButtonElement | null;
  const sidebarTabElem = document.getElementById("sidebar-tab-elem") as HTMLButtonElement | null;
  const sidebarHydrogen = document.getElementById("sidebar-hydrogen") as HTMLElement | null;
  const sidebarElements = document.getElementById("sidebar-elements") as HTMLElement | null;

  state.viewTab = tab;
  const isHydrogen = tab === "hydrogen";
  sidebarTabH?.setAttribute("aria-selected", String(isHydrogen));
  sidebarTabElem?.setAttribute("aria-selected", String(!isHydrogen));
  if (sidebarHydrogen) sidebarHydrogen.hidden = !isHydrogen;
  if (sidebarElements) sidebarElements.hidden = isHydrogen;
}

function drawRandomMysteryTarget(): MysteryTarget {
  return pickMysteryTarget({
    targets: MYSTERY_TARGETS,
    random: seededMysteryRandom ?? Math.random,
    previous: state.mystery.lastTarget,
  });
}

type MysteryCheckState = {
  guessedElement: string;
  guessedMode: TransitionMode;
  targetElement: string;
  targetMode: TransitionMode;
};

const challenges: Challenge[] = [
  {
    type: "custom",
    prompt: "Scenario 1: Identify the hidden element and mode from the spectrum pattern.",
    hints: [
      "Compare the strongest line position first, then check nearby line spacing.",
      "Sodium often centers near 589 nm; calcium has a strong pair near 393-397 nm.",
    ],
    check: (rawState: unknown) => {
      const values = rawState as MysteryCheckState;
      const guessedElement = values.guessedElement;
      const guessedMode = values.guessedMode;
      const correct = guessedElement === values.targetElement && guessedMode === values.targetMode;
      const targetModeLabel = values.targetMode === "emission" ? "Emission" : "Absorption";
      const guessedModeLabel = guessedMode === "emission" ? "Emission" : "Absorption";
      if (correct) {
        return {
          correct: true,
          close: true,
          message: `Correct. Mystery spectrum is ${values.targetElement} in ${targetModeLabel} mode.`,
        };
      }
      return {
        correct: false,
        close: false,
        message: `Not yet. You guessed ${guessedElement} (${guessedModeLabel}); target is ${values.targetElement} (${targetModeLabel}).`,
      };
    },
  },
  {
    type: "custom",
    prompt: "Scenario 2: Infer emission versus absorption first, then match the element fingerprint.",
    hints: [
      "Emission is bright-line dominated; absorption is dark-line dominated.",
      "After mode, compare line spacing patterns to identify the element.",
    ],
    check: (rawState: unknown) => {
      const values = rawState as MysteryCheckState;
      const correct = values.guessedElement === values.targetElement && values.guessedMode === values.targetMode;
      return {
        correct,
        close: correct,
        message: correct
          ? "Correct. Mode and element both match the hidden spectrum."
          : "Re-check mode first, then compare the strongest two line clusters.",
      };
    },
  },
  {
    type: "custom",
    prompt: "Scenario 3: Transition inference. Use representative line and spacing to justify your choice.",
    hints: [
      "Representative lines anchor the wavelength estimate; nearby spacing confirms identity.",
      "Use one quantitative readout value to support your final claim.",
    ],
    check: (rawState: unknown) => {
      const values = rawState as MysteryCheckState;
      const correct = values.guessedElement === values.targetElement && values.guessedMode === values.targetMode;
      return {
        correct,
        close: correct,
        message: correct
          ? "Correct. Evidence supports your transition inference."
          : "Not yet. Use representative wavelength plus neighboring spacing before checking again.",
      };
    },
  },
];

const mysteryChallengeEngine = new ChallengeEngine(challenges, {
  showUI: false,
  onProgress: () => {
    const prompt = mysteryChallengeEngine.getCurrentChallenge()?.prompt;
    if (prompt && mysteryPrompt) mysteryPrompt.textContent = prompt;
    setLiveRegionText(statusEl, "Mystery spectrum ready. Guess the element and mode, choose one evidence pattern, then check.");
  },
  onStop: () => {
    syncCopyLockState();
  },
});

function startMysterySpectrum() {
  const next = drawRandomMysteryTarget();
  state.mystery.active = true;
  state.mystery.revealed = false;
  state.mystery.targetElement = next.element;
  state.mystery.targetMode = next.mode;
  state.mystery.lastTarget = next;
  state.mystery.guessMode = "emission";
  state.mystery.reflectionEvidence = null;
  state.selectedElement = next.element;
  state.mode = next.mode;
  state.showHComparison = false;
  if (showHComparison) showHComparison.checked = false;
  if (mysteryGuessElement) mysteryGuessElement.value = "H";
  setSidebarView("elements");
  mysteryChallengeEngine.start();
  render();
}

function stopMysterySpectrum() {
  if (!state.mystery.active && !state.mystery.revealed) return;
  state.mystery.active = false;
  state.mystery.revealed = false;
  state.mystery.reflectionEvidence = null;
  if (mysteryChallengeEngine.isActive()) {
    mysteryChallengeEngine.stop();
  } else {
    syncCopyLockState();
  }
  render();
  setLiveRegionText(statusEl, "Mystery spectrum ended.");
}

function checkMysteryAnswer() {
  if (!state.mystery.active || !mysteryGuessElement) return;
  if (!isMysteryReflectionReady({
    mysteryActive: state.mystery.active,
    selectedEvidence: state.mystery.reflectionEvidence,
  })) {
    setLiveRegionText(statusEl, "Select what pattern convinced you before checking the mystery answer.");
    return;
  }
  const result = mysteryChallengeEngine.check({
    guessedElement: mysteryGuessElement.value,
    guessedMode: state.mystery.guessMode,
    targetElement: state.mystery.targetElement,
    targetMode: state.mystery.targetMode,
  } satisfies MysteryCheckState);
  state.mystery.revealed = true;
  state.mystery.active = false;
  if (mysteryChallengeEngine.isActive()) mysteryChallengeEngine.stop();
  render();
  setLiveRegionText(statusEl, result.message ?? "Mystery answer checked.");
}

function selectOrbitLevel(orbitN: number) {
  if (!Number.isFinite(orbitN) || orbitN < 1 || orbitN > N_MAX) return;
  state.inferenceMode = "forward";
  state.inverse.lastInference = null;
  if (state.mode === "emission") {
    if (orbitN > state.nLower) {
      state.nUpper = orbitN;
    } else {
      state.nLower = orbitN;
      if (state.nUpper <= state.nLower) {
        state.nUpper = Math.min(N_MAX, state.nLower + 1);
      }
    }
  } else {
    if (orbitN < state.nUpper) {
      state.nLower = orbitN;
    } else {
      state.nUpper = orbitN;
      if (state.nUpper <= state.nLower) {
        state.nLower = Math.max(1, state.nUpper - 1);
      }
    }
  }
  render();
  announceCurrentTransition("Orbit selected.");
}

// ── SVG helpers ─────────────────────────────────────────────

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function clearSvg(svg: SVGSVGElement) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

// ── Canvas resize ───────────────────────────────────────────

function resizeCanvas() {
  const rect = spectrumCanvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const dpr = window.devicePixelRatio ?? 1;
  const pw = Math.max(1, Math.round(w * dpr));
  const ph = Math.max(1, Math.round(h * dpr));
  if (spectrumCanvas.width !== pw || spectrumCanvas.height !== ph) {
    spectrumCanvas.width = pw;
    spectrumCanvas.height = ph;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: w, height: h };
}

function resizeMicroscopeCanvas() {
  if (!seriesMicroscopeCanvas || !microscopeCtx) return null;
  const rect = seriesMicroscopeCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = window.devicePixelRatio ?? 1;
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  if (seriesMicroscopeCanvas.width !== pixelWidth || seriesMicroscopeCanvas.height !== pixelHeight) {
    seriesMicroscopeCanvas.width = pixelWidth;
    seriesMicroscopeCanvas.height = pixelHeight;
  }
  microscopeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

// ── CSS color probe ─────────────────────────────────────────

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawSeriesMicroscope() {
  if (!microscopeCtx || !seriesMicroscopeCanvas) return;
  const size = resizeMicroscopeCanvas();
  if (!size) return;
  const { width, height } = size;
  microscopeCtx.clearRect(0, 0, width, height);
  microscopeCtx.fillStyle = cssVar("--cp-bg0") || "rgb(7, 10, 18)";
  microscopeCtx.fillRect(0, 0, width, height);

  const margin = { left: 48, right: 16, top: 14, bottom: 24 };
  const plotW = Math.max(1, width - margin.left - margin.right);
  const plotH = Math.max(1, height - margin.top - margin.bottom);

  const nLower = activeHydrogenSeriesForMicroscope();
  const limitNm = SpectralLineModel.seriesLimitNm({ nLower });
  const zoomSpanNm = Math.max(12, limitNm * 0.18);
  const domainMin = limitNm;
  const domainMax = limitNm + zoomSpanNm;

  const transitions = SpectralLineModel.seriesTransitions({ nLower, nMax: 80 });
  const pileup = computeSeriesPileupDensity({
    wavelengthsNm: transitions.map((transition) => transition.wavelengthNm),
    minNm: domainMin,
    maxNm: domainMax,
    bins: MICROSCOPE_BIN_COUNT,
  });

  for (const bin of pileup) {
    const x0 = margin.left + ((bin.binStartNm - domainMin) / (domainMax - domainMin)) * plotW;
    const x1 = margin.left + ((bin.binEndNm - domainMin) / (domainMax - domainMin)) * plotW;
    microscopeCtx.fillStyle = `rgba(102, 196, 255, ${0.08 + 0.52 * bin.density})`;
    microscopeCtx.fillRect(x0, margin.top, Math.max(1, x1 - x0), plotH);
  }

  for (const transition of transitions) {
    if (transition.wavelengthNm < domainMin || transition.wavelengthNm > domainMax) continue;
    const x = margin.left + ((transition.wavelengthNm - domainMin) / (domainMax - domainMin)) * plotW;
    microscopeCtx.strokeStyle = wavelengthToRgbString(transition.wavelengthNm);
    microscopeCtx.lineWidth = 1.5;
    microscopeCtx.globalAlpha = 0.85;
    microscopeCtx.beginPath();
    microscopeCtx.moveTo(x, margin.top);
    microscopeCtx.lineTo(x, margin.top + plotH);
    microscopeCtx.stroke();
    microscopeCtx.globalAlpha = 1;
  }

  const probeTransition = SpectralLineModel.transitionWavelengthNm({
    nUpper: Math.max(nLower + 1, state.microscope.probeNUpper),
    nLower,
  });
  if (Number.isFinite(probeTransition) && probeTransition >= domainMin && probeTransition <= domainMax) {
    const probeX = margin.left + ((probeTransition - domainMin) / (domainMax - domainMin)) * plotW;
    microscopeCtx.strokeStyle = "rgba(255, 207, 102, 0.95)";
    microscopeCtx.lineWidth = 2.3;
    microscopeCtx.beginPath();
    microscopeCtx.moveTo(probeX, margin.top - 3);
    microscopeCtx.lineTo(probeX, margin.top + plotH + 3);
    microscopeCtx.stroke();
  }

  if (state.microscope.includeInfinity) {
    const limitX = margin.left;
    microscopeCtx.strokeStyle = "rgba(255, 130, 130, 0.95)";
    microscopeCtx.lineWidth = 2;
    microscopeCtx.setLineDash([5, 4]);
    microscopeCtx.beginPath();
    microscopeCtx.moveTo(limitX, margin.top - 3);
    microscopeCtx.lineTo(limitX, margin.top + plotH + 3);
    microscopeCtx.stroke();
    microscopeCtx.setLineDash([]);
    microscopeCtx.fillStyle = "rgba(255, 130, 130, 0.95)";
    microscopeCtx.font = "11px system-ui, sans-serif";
    microscopeCtx.fillText("n->inf", limitX + 4, margin.top + 12);
  }

  microscopeCtx.strokeStyle = cssVar("--cp-border") || "rgba(255,255,255,0.2)";
  microscopeCtx.strokeRect(margin.left, margin.top, plotW, plotH);
  microscopeCtx.fillStyle = cssVar("--cp-muted") || "rgba(200, 210, 220, 0.8)";
  microscopeCtx.font = "10px system-ui, sans-serif";
  microscopeCtx.textAlign = "left";
  microscopeCtx.fillText(`${SpectralLineModel.seriesName({ nLower })} limit ${limitNm.toFixed(1)} nm`, margin.left, height - 8);
  microscopeCtx.textAlign = "right";
  microscopeCtx.fillText(`${domainMax.toFixed(1)} nm`, width - margin.right, height - 8);
}

function updateScalingInsight() {
  if (!scalingInsight) return;
  const nUpper = Math.max(2, state.microscope.probeNUpper);
  const approx = computeLargeNSpacingApproximation({ nUpper, rydbergEv: SpectralLineModel.BOHR.RYDBERG_EV });
  scalingInsight.textContent = `DeltaE ~ 27.2 eV / n^3 (large n). At n=${nUpper}, adjacent spacing ~ ${approx.toFixed(4)} eV.`;
}

function updateTemperaturePanel() {
  const proxy = SpectralLineModel.hydrogenPopulationProxy({ temperatureK: state.temperatureK });
  if (temperatureValue) temperatureValue.textContent = `${Math.round(state.temperatureK)}`;
  if (tempN1) tempN1.textContent = proxy.n1Fraction.toExponential(3);
  if (tempN2) tempN2.textContent = proxy.n2Fraction.toExponential(3);
  if (tempN3) tempN3.textContent = proxy.n3Fraction.toExponential(3);
  if (tempNeutralProxy) tempNeutralProxy.textContent = proxy.neutralHydrogenFractionProxy.toFixed(3);
  if (tempBalmerProxy) tempBalmerProxy.textContent = proxy.balmerStrengthProxy.toFixed(3);
}

function hideOrbitTooltip() {
  if (!orbitTooltip) return;
  orbitTooltip.hidden = true;
}

function showOrbitTooltip(args: { text: string; xPx: number; yPx: number }) {
  if (!orbitTooltip) return;
  const host = bohrSvg.closest(".bohr-container") as HTMLElement | null;
  if (!host) return;
  orbitTooltip.textContent = args.text;
  orbitTooltip.hidden = false;

  const rect = host.getBoundingClientRect();
  const tooltipRect = orbitTooltip.getBoundingClientRect();
  const clampedLeft = clamp(args.xPx, 10, Math.max(10, rect.width - tooltipRect.width - 10));
  const clampedTop = clamp(args.yPx, 10, Math.max(10, rect.height - tooltipRect.height - 10));
  orbitTooltip.style.left = `${clampedLeft}px`;
  orbitTooltip.style.top = `${clampedTop}px`;
}

// ── Draw Bohr atom ──────────────────────────────────────────

function drawBohrAtom() {
  clearSvg(bohrSvg);
  const cx = BOHR_VIEW_SIZE / 2;
  const cy = BOHR_VIEW_SIZE / 2;

  // Defs for glow filters
  const defs = svgEl("defs");

  // Nucleus glow
  const nucleusFilter = svgEl("filter", { id: "nucleusGlow", x: "-50%", y: "-50%", width: "200%", height: "200%" });
  const feBlur = svgEl("feGaussianBlur", { stdDeviation: "3", result: "glow" });
  nucleusFilter.appendChild(feBlur);
  const feMerge = svgEl("feMerge");
  const m1 = svgEl("feMergeNode", { in: "glow" });
  const m2 = svgEl("feMergeNode", { in: "SourceGraphic" });
  feMerge.appendChild(m1);
  feMerge.appendChild(m2);
  nucleusFilter.appendChild(feMerge);
  defs.appendChild(nucleusFilter);

  // Photon glow
  const photonFilter = svgEl("filter", { id: "photonGlow", x: "-100%", y: "-100%", width: "300%", height: "300%" });
  const pBlur = svgEl("feGaussianBlur", { stdDeviation: "4", result: "glow" });
  photonFilter.appendChild(pBlur);
  const pMerge = svgEl("feMerge");
  pMerge.appendChild(svgEl("feMergeNode", { in: "glow" }));
  pMerge.appendChild(svgEl("feMergeNode", { in: "SourceGraphic" }));
  photonFilter.appendChild(pMerge);
  defs.appendChild(photonFilter);

  bohrSvg.appendChild(defs);

  // Nucleus
  const nucleus = svgEl("circle", {
    cx, cy, r: 8,
    fill: "var(--cp-celestial-star)",
    filter: "url(#nucleusGlow)"
  });
  bohrSvg.appendChild(nucleus);

  // Draw orbits 1..N_MAX
  for (let n = 1; n <= N_MAX; n++) {
    const r = compressedOrbitRadius({ n, viewSize: BOHR_VIEW_SIZE, nMax: N_MAX });
    const isActive = n === state.nUpper || n === state.nLower;
    const energyEv = SpectralLineModel.hydrogenEnergyEv({ n });
    const tooltipText = `n=${n}, E_n=${energyEv.toFixed(2)} eV`;
    const orbit = svgEl("circle", {
      cx, cy, r,
      fill: "none",
      stroke: isActive ? "var(--cp-accent-amber)" : "var(--cp-celestial-orbit)",
      "stroke-width": isActive ? 1.8 : 0.8,
      "stroke-dasharray": isActive ? "none" : "4 4",
      opacity: isActive ? 1 : 0.4,
      role: "button",
      tabindex: 0,
      "aria-label": `Select orbit n=${n}, energy ${energyEv.toFixed(2)} eV`,
      "aria-describedby": "orbitTooltip",
    });
    orbit.classList.add("orbit-selectable");
    orbit.addEventListener("click", () => selectOrbitLevel(n));
    orbit.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectOrbitLevel(n);
      }
    });
    orbit.addEventListener("mouseenter", (event) => {
      const host = bohrSvg.closest(".bohr-container") as HTMLElement | null;
      if (!host || !(event instanceof MouseEvent)) return;
      const rect = host.getBoundingClientRect();
      showOrbitTooltip({
        text: tooltipText,
        xPx: event.clientX - rect.left + 14,
        yPx: event.clientY - rect.top + 12,
      });
    });
    orbit.addEventListener("mousemove", (event) => {
      const host = bohrSvg.closest(".bohr-container") as HTMLElement | null;
      if (!host || !(event instanceof MouseEvent)) return;
      const rect = host.getBoundingClientRect();
      showOrbitTooltip({
        text: tooltipText,
        xPx: event.clientX - rect.left + 14,
        yPx: event.clientY - rect.top + 12,
      });
    });
    orbit.addEventListener("mouseleave", () => hideOrbitTooltip());
    orbit.addEventListener("focus", () => {
      const focusX = cx + r + 14;
      const focusY = cy - 18;
      showOrbitTooltip({ text: tooltipText, xPx: focusX, yPx: focusY });
    });
    orbit.addEventListener("blur", () => hideOrbitTooltip());
    bohrSvg.appendChild(orbit);

    // Level label
    const labelAngle = -Math.PI / 4;
    const lx = cx + r * Math.cos(labelAngle);
    const ly = cy + r * Math.sin(labelAngle);
    const label = svgEl("text", {
      x: lx + 6, y: ly - 4,
      fill: isActive ? "var(--cp-accent-amber)" : "var(--cp-muted)",
      "font-size": "11",
      "font-family": "system-ui, sans-serif",
      opacity: isActive ? 1 : 0.6,
    });
    label.textContent = `n=${n}`;
    bohrSvg.appendChild(label);
  }

  // Electron on the current level
  const electronN = state.mode === "emission" ? state.nUpper : state.nLower;
  const electronR = compressedOrbitRadius({ n: electronN, viewSize: BOHR_VIEW_SIZE, nMax: N_MAX });
  const electronAngle = Math.PI / 6;
  const ex = cx + electronR * Math.cos(electronAngle);
  const ey = cy + electronR * Math.sin(electronAngle);

  const electron = svgEl("circle", {
    cx: ex, cy: ey, r: 5,
    fill: "var(--cp-accent-ice)",
    filter: "url(#photonGlow)"
  });
  electron.id = "electron";
  bohrSvg.appendChild(electron);

  // Transition arrow
  const fromR = compressedOrbitRadius({ n: state.nUpper, viewSize: BOHR_VIEW_SIZE, nMax: N_MAX });
  const toR = compressedOrbitRadius({ n: state.nLower, viewSize: BOHR_VIEW_SIZE, nMax: N_MAX });
  const arrowAngle = -Math.PI / 2;
  const x1 = cx + fromR * Math.cos(arrowAngle);
  const y1 = cy + fromR * Math.sin(arrowAngle);
  const x2 = cx + toR * Math.cos(arrowAngle);
  const y2 = cy + toR * Math.sin(arrowAngle);

  const wavelengthNm = SpectralLineModel.transitionWavelengthNm({ nUpper: state.nUpper, nLower: state.nLower });
  const photonColor = wavelengthToRgbString(wavelengthNm);

  // Draw arrow line
  const arrowLine = svgEl("line", {
    x1, y1, x2, y2,
    stroke: photonColor,
    "stroke-width": 2.5,
    "marker-end": state.mode === "emission" ? "url(#arrowDown)" : "url(#arrowUp)",
    opacity: 0.9,
  });

  // Arrow markers
  const markerDown = svgEl("marker", {
    id: "arrowDown", viewBox: "0 0 10 10",
    refX: 5, refY: 5,
    markerWidth: 6, markerHeight: 6,
    orient: "auto-start-reverse"
  });
  const pathDown = svgEl("path", {
    d: "M 0 0 L 10 5 L 0 10 z",
    fill: photonColor,
  });
  markerDown.appendChild(pathDown);
  defs.appendChild(markerDown);

  const markerUp = svgEl("marker", {
    id: "arrowUp", viewBox: "0 0 10 10",
    refX: 5, refY: 5,
    markerWidth: 6, markerHeight: 6,
    orient: "auto"
  });
  const pathUp = svgEl("path", {
    d: "M 0 0 L 10 5 L 0 10 z",
    fill: photonColor,
  });
  markerUp.appendChild(pathUp);
  defs.appendChild(markerUp);

  bohrSvg.appendChild(arrowLine);

  // Photon wavy line near the transition
  const photonX = cx + (fromR + toR) / 2 * Math.cos(arrowAngle) + 20;
  const photonY = cy + (fromR + toR) / 2 * Math.sin(arrowAngle);
  const photon = svgEl("text", {
    x: photonX, y: photonY,
    fill: photonColor,
    "font-size": "16",
    "font-family": "system-ui, sans-serif",
    filter: "url(#photonGlow)"
  });
  photon.textContent = "\u03B3";
  photon.id = "photonSymbol";
  bohrSvg.appendChild(photon);

  // "Not to scale" label
  const scaleLabel = svgEl("text", {
    x: BOHR_VIEW_SIZE - 8, y: BOHR_VIEW_SIZE - 8,
    fill: "var(--cp-muted)",
    "font-size": "9",
    "text-anchor": "end",
    opacity: 0.5,
  });
  scaleLabel.textContent = "not to scale";
  bohrSvg.appendChild(scaleLabel);
}

// ── Draw energy-level diagram ───────────────────────────────

function drawEnergyLevels() {
  clearSvg(energySvg);

  const leftX = 60;
  const rightX = ENERGY_SVG_W - 20;
  const lineLen = rightX - leftX;

  // Ionization level (E = 0)
  const yIon = energyLevelY({ energyEv: 0, svgHeight: ENERGY_SVG_H });
  const ionLine = svgEl("line", {
    x1: leftX, y1: yIon, x2: rightX, y2: yIon,
    stroke: "var(--cp-muted)",
    "stroke-width": 1,
    "stroke-dasharray": "6 3",
    opacity: 0.5,
  });
  energySvg.appendChild(ionLine);
  const ionLabel = svgEl("text", {
    x: leftX - 6, y: yIon + 4,
    fill: "var(--cp-muted)",
    "font-size": "10",
    "text-anchor": "end",
  });
  ionLabel.textContent = "0 eV";
  energySvg.appendChild(ionLabel);
  const ionRight = svgEl("text", {
    x: rightX + 4, y: yIon + 4,
    fill: "var(--cp-muted)",
    "font-size": "10",
    "text-anchor": "start",
    opacity: 0.6,
  });
  ionRight.textContent = "\u221E";
  energySvg.appendChild(ionRight);

  // Draw energy levels
  for (let n = 1; n <= N_MAX; n++) {
    const eEv = SpectralLineModel.hydrogenEnergyEv({ n });
    const y = energyLevelY({ energyEv: eEv, svgHeight: ENERGY_SVG_H });
    const isActive = n === state.nUpper || n === state.nLower;

    const line = svgEl("line", {
      x1: leftX, y1: y, x2: rightX, y2: y,
      stroke: isActive ? "var(--cp-accent-amber)" : "var(--cp-celestial-orbit)",
      "stroke-width": isActive ? 2.5 : 1.2,
      opacity: isActive ? 1 : 0.6,
    });
    energySvg.appendChild(line);

    // Energy label (left)
    const eLabel = svgEl("text", {
      x: leftX - 6, y: y + 4,
      fill: isActive ? "var(--cp-accent-amber)" : "var(--cp-muted)",
      "font-size": "10",
      "text-anchor": "end",
    });
    eLabel.textContent = `${eEv.toFixed(2)}`;
    energySvg.appendChild(eLabel);

    // n label (right)
    const nLabel = svgEl("text", {
      x: rightX + 4, y: y + 4,
      fill: isActive ? "var(--cp-accent-amber)" : "var(--cp-muted)",
      "font-size": "10",
      "text-anchor": "start",
    });
    nLabel.textContent = `n=${n}`;
    energySvg.appendChild(nLabel);
  }

  // Transition arrow between levels
  const eUpper = SpectralLineModel.hydrogenEnergyEv({ n: state.nUpper });
  const eLower = SpectralLineModel.hydrogenEnergyEv({ n: state.nLower });
  const yUpper = energyLevelY({ energyEv: eUpper, svgHeight: ENERGY_SVG_H });
  const yLower = energyLevelY({ energyEv: eLower, svgHeight: ENERGY_SVG_H });
  const midX = leftX + lineLen * 0.6;

  const wavelengthNm = SpectralLineModel.transitionWavelengthNm({ nUpper: state.nUpper, nLower: state.nLower });
  const photonColor = wavelengthToRgbString(wavelengthNm);

  // Defs for arrow marker
  const defs = svgEl("defs");
  const marker = svgEl("marker", {
    id: "eArrow", viewBox: "0 0 10 10",
    refX: 5, refY: 5,
    markerWidth: 5, markerHeight: 5,
    orient: "auto"
  });
  const arrowPath = svgEl("path", {
    d: "M 0 0 L 10 5 L 0 10 z",
    fill: photonColor,
  });
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  energySvg.appendChild(defs);

  // Arrow from upper to lower (emission) or lower to upper (absorption)
  const arrowY1 = state.mode === "emission" ? yUpper + 4 : yLower - 4;
  const arrowY2 = state.mode === "emission" ? yLower - 4 : yUpper + 4;

  const transitionArrow = svgEl("line", {
    x1: midX, y1: arrowY1,
    x2: midX, y2: arrowY2,
    stroke: photonColor,
    "stroke-width": 2.5,
    "marker-end": "url(#eArrow)",
  });
  energySvg.appendChild(transitionArrow);

  // Photon label
  const photonLabel = svgEl("text", {
    x: midX + 14,
    y: (yUpper + yLower) / 2 + 4,
    fill: photonColor,
    "font-size": "12",
    "font-family": "system-ui, sans-serif",
  });
  photonLabel.textContent = "\u03B3";
  energySvg.appendChild(photonLabel);

  // Title
  const title = svgEl("text", {
    x: ENERGY_SVG_W / 2, y: 16,
    fill: "var(--cp-text2)",
    "font-size": "12",
    "font-weight": "bold",
    "text-anchor": "middle",
  });
  title.textContent = "Energy (eV)";
  energySvg.appendChild(title);
}

// ── Draw spectrum strip ─────────────────────────────────────

function drawSpectrum() {
  const { width: w, height: h } = resizeCanvas();
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = cssVar("--cp-bg0") || "#0a0a14";
  ctx.fillRect(0, 0, w, h);

  const mL = 50, mR = 16, mT = 16, mB = 28;
  const plotW = Math.max(1, w - mL - mR);
  const plotH = Math.max(1, h - mT - mB);
  const activeDomain = state.viewTab === "hydrogen"
    ? spectrumDomainForSeries(state.seriesFilter)
    : spectrumDomainForSeries("all");
  const { minNm, maxNm, ticksNm, bandLabels } = activeDomain;

  // Visible band rainbow background
  const visStart = wavelengthToFraction(380, activeDomain);
  const visEnd = wavelengthToFraction(750, activeDomain);

  // Draw rainbow gradient in visible range
  const nSteps = 200;
  for (let i = 0; i < nSteps; i++) {
    const f0 = visStart + (i / nSteps) * (visEnd - visStart);
    const f1 = visStart + ((i + 1) / nSteps) * (visEnd - visStart);
    const nm = minNm + f0 * (maxNm - minNm);
    const x0 = mL + f0 * plotW;
    const x1 = mL + f1 * plotW;
    ctx.fillStyle = wavelengthToRgbString(nm);
    ctx.globalAlpha = state.mode === "emission" ? 0.08 : 0.25;
    ctx.fillRect(x0, mT, x1 - x0 + 0.5, plotH);
  }
  ctx.globalAlpha = 1;

  type SpectrumLine = { wavelengthNm: number; intensity: number; color: string };
  type RowSpec = {
    label: string;
    top: number;
    height: number;
    lines: SpectrumLine[];
  };

  const hydrogenLines = (): SpectrumLine[] => {
    const transitions = filterHydrogenTransitionsBySeries({
      seriesFilter: state.seriesFilter,
      transitions: SpectralLineModel.allHydrogenTransitions({ nMax: N_MAX, maxSeries: 4 }),
    });
    return transitions.map((transition) => ({
      wavelengthNm: transition.wavelengthNm,
      intensity: 1 / (transition.nUpper - transition.nLower + 1),
      color: wavelengthToRgbString(transition.wavelengthNm),
    }));
  };

  const elementLines = (): SpectrumLine[] => {
    const data = SpectralLineModel.elementLines({ element: state.selectedElement });
    return data.lines.map((line) => ({
      wavelengthNm: line.wavelengthNm,
      intensity: line.relativeIntensity,
      color: wavelengthToRgbString(line.wavelengthNm),
    }));
  };

  const compareEnabled = state.viewTab === "elements" && state.showHComparison && state.selectedElement !== "H";
  const rows: RowSpec[] = [];

  if (compareEnabled) {
    const rowHeight = plotH * 0.44;
    const firstTop = mT;
    const secondTop = mT + plotH * 0.56;
    rows.push({
      label: `${state.selectedElement} fingerprint`,
      top: firstTop,
      height: rowHeight,
      lines: elementLines(),
    });
    rows.push({
      label: "H Balmer reference",
      top: secondTop,
      height: rowHeight,
      lines: SpectralLineModel.seriesTransitions({ nLower: 2, nMax: 10 }).map((transition) => ({
        wavelengthNm: transition.wavelengthNm,
        intensity: 0.65,
        color: "rgba(100, 180, 255, 0.95)",
      })),
    });
  } else {
    rows.push({
      label: state.viewTab === "hydrogen" ? "Hydrogen" : `${state.selectedElement}`,
      top: mT,
      height: plotH,
      lines: state.viewTab === "hydrogen" ? hydrogenLines() : elementLines(),
    });
  }

  const drawLineRow = (row: RowSpec) => {
    for (const line of row.lines) {
      const frac = wavelengthToFraction(line.wavelengthNm, activeDomain);
      if (frac <= 0 || frac >= 1) continue;
      const x = mL + frac * plotW;
      if (shouldRenderEmission({ mode: state.mode, viewTab: state.viewTab })) {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = Math.max(1.4, line.intensity * 3);
        ctx.globalAlpha = clamp(line.intensity * 0.9 + 0.1, 0.2, 1);
        ctx.beginPath();
        ctx.moveTo(x, row.top);
        ctx.lineTo(x, row.top + row.height);
        ctx.stroke();
        if (line.intensity > 0.5 && isVisible(line.wavelengthNm)) {
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 5.5;
          ctx.globalAlpha = 0.15;
          ctx.beginPath();
          ctx.moveTo(x, row.top);
          ctx.lineTo(x, row.top + row.height);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
        ctx.lineWidth = Math.max(1.8, line.intensity * 3.5);
        ctx.globalAlpha = clamp(line.intensity * 0.8 + 0.2, 0.3, 0.95);
        ctx.beginPath();
        ctx.moveTo(x, row.top);
        ctx.lineTo(x, row.top + row.height);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  };

  for (const row of rows) {
    drawLineRow(row);
    if (rows.length > 1) {
      ctx.fillStyle = cssVar("--cp-muted") || "rgba(190, 205, 220, 0.8)";
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(row.label, mL + 4, row.top + 12);
    }
  }

  if (rows.length > 1) {
    const dividerY = mT + plotH * 0.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(mL, dividerY);
    ctx.lineTo(mL + plotW, dividerY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Highlight active transition
  if (state.viewTab === "hydrogen") {
    const activeNm = SpectralLineModel.transitionWavelengthNm({ nUpper: state.nUpper, nLower: state.nLower });
    const activeFrac = wavelengthToFraction(activeNm, activeDomain);
    if (activeFrac > 0 && activeFrac < 1) {
      const ax = mL + activeFrac * plotW;
      const activeColor = wavelengthToRgbString(activeNm);
      // Bright marker
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(ax, rows[0].top - 4);
      ctx.lineTo(ax, rows[0].top + rows[0].height + 4);
      ctx.stroke();
      // Glow
      ctx.lineWidth = 10;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.moveTo(ax, rows[0].top);
      ctx.lineTo(ax, rows[0].top + rows[0].height);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Label above
      ctx.fillStyle = activeColor;
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${formatWavelengthReadout(activeNm).value} ${formatWavelengthReadout(activeNm).unit}`, ax, mT - 6);
    }
  }

  // Plot border
  ctx.strokeStyle = cssVar("--cp-border") || "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(mL, mT, plotW, plotH);
  ctx.globalAlpha = 1;

  // Wavelength axis labels
  ctx.fillStyle = cssVar("--cp-text2") || "#aaa";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (const nm of ticksNm) {
    const frac = wavelengthToFraction(nm, activeDomain);
    if (frac <= 0 || frac >= 1) continue;
    const x = mL + frac * plotW;
    ctx.fillText(`${nm}`, x, mT + plotH + 14);
    // Tick mark
    ctx.beginPath();
    ctx.strokeStyle = cssVar("--cp-border") || "rgba(255,255,255,0.1)";
    ctx.moveTo(x, mT + plotH);
    ctx.lineTo(x, mT + plotH + 4);
    ctx.stroke();
  }

  // X-axis title
  ctx.fillStyle = cssVar("--cp-text2") || "#aaa";
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Wavelength (nm)", mL + plotW / 2, h - 4);

  // Band labels
  ctx.font = "9px system-ui, sans-serif";
  ctx.globalAlpha = 0.5;
  for (const band of bandLabels) {
    const frac = wavelengthToFraction(band.wavelengthNm, activeDomain);
    if (frac > 0 && frac < 1) {
      ctx.fillText(band.label, mL + frac * plotW, mT + 12);
    }
  }
  ctx.globalAlpha = 1;

  if (!shouldRenderEmission({ mode: state.mode, viewTab: state.viewTab })) {
    ctx.fillStyle = cssVar("--cp-text2") || "#d6dbe6";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Same DeltaE. Different boundary conditions.", mL + plotW - 4, mT + 12);
  }
}

// ── Update readouts ─────────────────────────────────────────

function updateReadouts() {
  const context = currentReadoutContext();
  readoutTransitionLabel.textContent = state.inferenceMode === "inverse" && state.viewTab === "hydrogen"
    ? "Inferred transition"
    : context.transitionLabel;
  readoutTransition.textContent = context.transitionText;

  const wReadout = formatWavelengthReadout(context.wavelengthNm);
  readoutWavelength.textContent = wReadout.value;
  if (readoutWavelengthUnit) readoutWavelengthUnit.textContent = wReadout.unit;

  readoutEnergy.textContent = formatNumber(context.energyEv, 4);

  const fReadout = formatFrequencyReadout(context.frequencyHz);
  readoutFrequency.textContent = fReadout.value;
  if (readoutFrequencyUnit) readoutFrequencyUnit.textContent = fReadout.unit;

  readoutSeries.textContent = context.series;
  readoutBand.textContent = context.band;
}

// ── Full render ─────────────────────────────────────────────

function render() {
  // Enforce nUpper > nLower
  if (state.nUpper <= state.nLower) {
    state.nUpper = state.nLower + 1;
    if (state.nUpper > N_MAX) {
      state.nUpper = N_MAX;
      state.nLower = N_MAX - 1;
    }
  }

  // Sync slider values
  nUpperSlider.value = String(state.nUpper);
  nLowerSlider.value = String(state.nLower);
  nUpperValue.textContent = String(state.nUpper);
  nLowerValue.textContent = String(state.nLower);
  if (inferenceForward) inferenceForward.setAttribute("aria-checked", String(state.inferenceMode === "forward"));
  if (inferenceInverse) inferenceInverse.setAttribute("aria-checked", String(state.inferenceMode === "inverse"));
  if (forwardControls) forwardControls.hidden = state.inferenceMode !== "forward";
  if (inverseControls) inverseControls.hidden = state.inferenceMode !== "inverse";
  if (inverseObservedWavelength) inverseObservedWavelength.value = state.inverse.observedWavelengthNm.toFixed(1);
  for (const chip of inverseScopeChips) {
    const scope = chip.getAttribute("data-scope");
    const active = state.inverse.seriesScope === "all" ? scope === "all" : scope === String(state.inverse.seriesScope);
    chip.setAttribute("aria-pressed", String(active));
  }
  if (microscopeProbeSlider) microscopeProbeSlider.value = String(state.microscope.probeNUpper);
  if (microscopeProbeValue) microscopeProbeValue.textContent = String(state.microscope.probeNUpper);
  if (microscopeInfinity) microscopeInfinity.checked = state.microscope.includeInfinity;
  if (temperatureSlider) temperatureSlider.value = String(state.temperatureK);
  const hydrogenComparisonAllowed = state.selectedElement !== "H";
  if (!hydrogenComparisonAllowed) {
    state.showHComparison = false;
  }
  showHComparison.checked = state.showHComparison;
  showHComparison.disabled = !hydrogenComparisonAllowed;
  showHComparison.setAttribute("aria-disabled", String(!hydrogenComparisonAllowed));
  if (hComparisonHint) {
    hComparisonHint.hidden = hydrogenComparisonAllowed;
    hComparisonHint.setAttribute("aria-hidden", String(hydrogenComparisonAllowed));
  }

  // Sync mode buttons
  modeEmission.setAttribute("aria-checked", String(state.mode === "emission"));
  modeAbsorption.setAttribute("aria-checked", String(state.mode === "absorption"));
  elemModeEmission?.setAttribute("aria-checked", String(state.mode === "emission"));
  elemModeAbsorption?.setAttribute("aria-checked", String(state.mode === "absorption"));

  for (const chip of seriesChips) {
    const chipSeries = chip.getAttribute("data-series");
    const active = state.seriesFilter === "all"
      ? chipSeries === "all"
      : chipSeries === String(state.seriesFilter);
    chip.setAttribute("aria-pressed", String(active));
  }

  for (const chip of elementChips) {
    const element = chip.getAttribute("data-element");
    chip.setAttribute("aria-pressed", String(element === state.selectedElement));
  }

  const isHydrogenTab = state.viewTab === "hydrogen";
  const mysteryPanelVisible = state.viewTab === "elements" && (state.mystery.active || state.mystery.revealed);
  if (elementsStandardControls) elementsStandardControls.hidden = mysteryPanelVisible;
  if (mysteryPanel) mysteryPanel.hidden = !mysteryPanelVisible;
  if (exploreLayout) {
    exploreLayout.classList.toggle("explore-layout--mystery", state.mystery.active);
    exploreLayout.classList.toggle("explore-layout--elements", !isHydrogenTab);
  }
  if (hydrogenVizTop) hydrogenVizTop.hidden = !isHydrogenTab;
  if (microscopePanel) {
    microscopePanel.hidden = !isHydrogenTab;
    microscopePanel.setAttribute("aria-hidden", String(!isHydrogenTab));
  }
  if (temperaturePanel) {
    temperaturePanel.hidden = !isHydrogenTab;
    temperaturePanel.setAttribute("aria-hidden", String(!isHydrogenTab));
  }
  if (elementsGuidance) elementsGuidance.hidden = isHydrogenTab;
  if (mysteryPrompt && mysteryPanelVisible) {
    const activePrompt = mysteryChallengeEngine.getCurrentChallenge()?.prompt;
    mysteryPrompt.textContent = state.mystery.revealed
      ? "Answer revealed. Start another mystery to try a new hidden target."
      : activePrompt ?? "Mystery challenge: identify the hidden element and mode from the spectrum pattern.";
  }
  if (guessModeEmission) {
    guessModeEmission.setAttribute("aria-checked", String(state.mystery.guessMode === "emission"));
  }
  if (guessModeAbsorption) {
    guessModeAbsorption.setAttribute("aria-checked", String(state.mystery.guessMode === "absorption"));
  }
  for (const chip of reflectionChips) {
    const reflection = chip.getAttribute("data-reflection");
    chip.setAttribute("aria-checked", String(reflection === state.mystery.reflectionEvidence));
  }
  if (checkMysteryAnswerBtn) {
    checkMysteryAnswerBtn.disabled = !state.mystery.active || !isMysteryReflectionReady({
      mysteryActive: state.mystery.active,
      selectedEvidence: state.mystery.reflectionEvidence,
    });
  }
  if (mysteryHintBtn) mysteryHintBtn.disabled = !state.mystery.active;
  if (mysteryReflectionHint) {
    mysteryReflectionHint.textContent = state.mystery.active && !state.mystery.reflectionEvidence
      ? "Pick one evidence pattern before checking your answer."
      : "Evidence recorded. Check your answer when ready.";
  }
  syncCopyLockState();
  syncPlaybarState();

  const spectrumLabel = state.viewTab === "hydrogen"
    ? `Spectrum strip showing ${state.mode} hydrogen lines (${state.seriesFilter === "all" ? "all series" : SpectralLineModel.seriesName({ nLower: state.seriesFilter })}).`
    : (state.mystery.active && !state.mystery.revealed
      ? "Mystery spectrum challenge with hidden element and hidden mode."
      : state.showHComparison && state.selectedElement !== "H"
        ? `Spectrum strip comparing ${state.selectedElement} with hydrogen Balmer fingerprints in ${state.mode} mode.`
        : `Spectrum strip showing ${state.mode} lines for element ${state.selectedElement}.`);
  spectrumCanvas.setAttribute("aria-label", spectrumLabel);

  updateReadouts();
  if (isHydrogenTab) {
    updateTemperaturePanel();
    updateScalingInsight();
  }
  if (isHydrogenTab) {
    drawBohrAtom();
    drawEnergyLevels();
  } else {
    hideOrbitTooltip();
    clearSvg(bohrSvg);
    clearSvg(energySvg);
  }
  drawSpectrum();
  if (isHydrogenTab) {
    drawSeriesMicroscope();
  }
}

const HYDROGEN_SEQUENCE: Array<{ nUpper: number; nLower: number }> = [
  { nUpper: 3, nLower: 2 },
  { nUpper: 4, nLower: 2 },
  { nUpper: 5, nLower: 2 },
  { nUpper: 6, nLower: 2 },
  { nUpper: 2, nLower: 1 },
  { nUpper: 4, nLower: 3 },
];

function syncPlaybarState() {
  playBtn.disabled = state.sequencePlaying || prefersReducedMotion;
  pauseBtn.disabled = !state.sequencePlaying;
  playbarState.textContent = state.sequencePlaying
    ? `Sequence running (${state.sequenceDirection > 0 ? "forward" : "backward"})`
    : "Sequence paused";
}

function stepSequence(direction: -1 | 1, announce = true) {
  if (state.mystery.active && !state.mystery.revealed) {
    setLiveRegionText(statusEl, "Finish or end the mystery challenge before stepping sequence playback.");
    return;
  }
  state.inferenceMode = "forward";
  state.inverse.lastInference = null;

  if (state.viewTab === "hydrogen") {
    const currentIndex = HYDROGEN_SEQUENCE.findIndex(
      (step) => step.nUpper === state.nUpper && step.nLower === state.nLower,
    );
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = nextSequenceIndex({
      currentIndex: startIndex,
      length: HYDROGEN_SEQUENCE.length,
      direction,
    });
    const next = HYDROGEN_SEQUENCE[nextIndex];
    state.nUpper = next.nUpper;
    state.nLower = next.nLower;
    state.seriesFilter = next.nLower <= 4 ? (next.nLower as SeriesFilter) : "all";
  } else {
    const order = ["H", "He", "Na", "Ca", "Fe"] as const;
    const currentIndex = order.findIndex((element) => element === state.selectedElement);
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = nextSequenceIndex({
      currentIndex: startIndex,
      length: order.length,
      direction,
    });
    state.selectedElement = order[nextIndex];
  }

  render();
  if (announce) {
    announceCurrentTransition(direction > 0 ? "Stepped forward." : "Stepped backward.");
  }
}

function stopSequencePlayback() {
  if (sequenceFrame !== 0) {
    window.cancelAnimationFrame(sequenceFrame);
    sequenceFrame = 0;
  }
  sequenceLastTimestamp = 0;
  state.sequencePlaying = false;
  syncPlaybarState();
}

function startSequencePlayback() {
  if (prefersReducedMotion) {
    setLiveRegionText(statusEl, "Reduced motion enabled; autoplay sequence is disabled.");
    return;
  }
  if (state.sequencePlaying) return;
  if (state.mystery.active && !state.mystery.revealed) {
    setLiveRegionText(statusEl, "Finish or end the mystery challenge before starting sequence playback.");
    return;
  }

  state.sequencePlaying = true;
  sequenceLastTimestamp = 0;
  let carryMs = 0;

  const tick = (now: number) => {
    if (!state.sequencePlaying) return;
    if (sequenceLastTimestamp === 0) {
      sequenceLastTimestamp = now;
      sequenceFrame = window.requestAnimationFrame(tick);
      return;
    }
    const deltaMs = Math.min(120, now - sequenceLastTimestamp);
    sequenceLastTimestamp = now;
    const speed = Number(speedSelect.value) || 1;
    const thresholdMs = Math.max(110, SEQUENCE_STEP_INTERVAL_MS / speed);
    carryMs += deltaMs;
    if (carryMs >= thresholdMs) {
      carryMs = 0;
      stepSequence(state.sequenceDirection, false);
    }
    sequenceFrame = window.requestAnimationFrame(tick);
  };

  syncPlaybarState();
  sequenceFrame = window.requestAnimationFrame(tick);
}

// ── Transition animation ────────────────────────────────────

function animateTransition() {
  if (state.animating || prefersReducedMotion) {
    render();
    announceCurrentTransition(prefersReducedMotion ? "Reduced motion: transition updated instantly." : undefined);
    return;
  }
  state.animating = true;
  announceCurrentTransition("Animating transition.");

  const electronEl = document.getElementById("electron") as SVGCircleElement | null;
  if (!electronEl) { state.animating = false; return; }
  const electron: SVGCircleElement = electronEl;

  const cx = BOHR_VIEW_SIZE / 2;
  const cy = BOHR_VIEW_SIZE / 2;
  const fromN = state.mode === "emission" ? state.nUpper : state.nLower;
  const toN = state.mode === "emission" ? state.nLower : state.nUpper;
  const fromR = compressedOrbitRadius({ n: fromN, viewSize: BOHR_VIEW_SIZE, nMax: N_MAX });
  const toR = compressedOrbitRadius({ n: toN, viewSize: BOHR_VIEW_SIZE, nMax: N_MAX });

  const duration = 600; // ms
  const startTime = performance.now();
  const startAngle = Math.PI / 6;

  function step(now: number) {
    const elapsed = now - startTime;
    const t = clamp(elapsed / duration, 0, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    const r = fromR + (toR - fromR) * ease;
    const angle = startAngle + ease * Math.PI * 0.5; // spiral slightly

    const ex = cx + r * Math.cos(angle);
    const ey = cy + r * Math.sin(angle);
    electron.setAttribute("cx", String(ex));
    electron.setAttribute("cy", String(ey));

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      state.animating = false;
      render();
    }
  }

  requestAnimationFrame(step);
}

// ── Export ───────────────────────────────────────────────────

function exportResults(): ExportPayloadV1 {
  if (isCopyLocked()) {
    throw new Error("Copy Results is locked while the mystery spectrum is unrevealed.");
  }
  const context = currentReadoutContext();
  const includeHydrogenInferenceFields = isHydrogenInferenceContext({
    viewTab: state.viewTab,
    inferenceMode: state.inferenceMode,
    hasInference: state.inverse.lastInference !== null,
  });
  return buildSpectralExportPayload({
    mode: state.mode,
    viewTab: state.viewTab,
    selectedElement: state.selectedElement,
    nUpper: state.nUpper,
    nLower: state.nLower,
    seriesFilter: state.seriesFilter,
    wavelengthNm: context.wavelengthNm,
    energyEv: context.energyEv,
    frequencyHz: context.frequencyHz,
    seriesName: context.series,
    band: context.band,
    representativeLineLabel: context.representativeLineLabel,
    inferenceMode: includeHydrogenInferenceFields ? state.inferenceMode : undefined,
    observedWavelengthNm: includeHydrogenInferenceFields ? state.inverse.observedWavelengthNm : undefined,
    inferredTransitionLabel: includeHydrogenInferenceFields ? context.transitionText : undefined,
    inverseResidualNm: includeHydrogenInferenceFields ? context.inverseResidualNm : undefined,
    includeHydrogenInferenceFields,
    mysteryReflectionEvidence: state.mystery.reflectionEvidence,
  });
}

// ── Event bindings ──────────────────────────────────────────

nUpperSlider.addEventListener("input", () => {
  stopSequencePlayback();
  state.inferenceMode = "forward";
  state.inverse.lastInference = null;
  state.nUpper = clamp(Number(nUpperSlider.value), 2, N_MAX);
  if (state.nUpper <= state.nLower) state.nLower = state.nUpper - 1;
  if (state.seriesFilter !== "all" && state.nLower !== state.seriesFilter) {
    state.seriesFilter = "all";
  }
  render();
  announceCurrentTransition();
});

nLowerSlider.addEventListener("input", () => {
  stopSequencePlayback();
  state.inferenceMode = "forward";
  state.inverse.lastInference = null;
  state.nLower = clamp(Number(nLowerSlider.value), 1, N_MAX - 1);
  if (state.nUpper <= state.nLower) state.nUpper = state.nLower + 1;
  if (state.seriesFilter !== "all" && state.nLower !== state.seriesFilter) {
    state.seriesFilter = "all";
  }
  render();
  announceCurrentTransition();
});

inferenceForward?.addEventListener("click", () => {
  stopSequencePlayback();
  setInferenceMode("forward");
});

inferenceInverse?.addEventListener("click", () => {
  stopSequencePlayback();
  setInferenceMode("inverse");
});

inverseObservedWavelength?.addEventListener("input", () => {
  const next = Number(inverseObservedWavelength.value);
  if (!Number.isFinite(next)) return;
  state.inverse.observedWavelengthNm = clamp(next, 50, 5000);
  state.inverse.lastInference = null;
  render();
});

solveInverseBtn?.addEventListener("click", () => {
  stopSequencePlayback();
  state.inferenceMode = "inverse";
  solveInverseTransition();
});

for (const chip of inverseScopeChips) {
  chip.addEventListener("click", () => {
    const scope = chip.getAttribute("data-scope");
    if (!scope) return;
    state.inverse.seriesScope = scope === "all" ? "all" : (Number(scope) as SeriesFilter);
    state.inverse.lastInference = null;
    render();
  });
}

modeEmission.addEventListener("click", () => setMode("emission"));
modeAbsorption.addEventListener("click", () => setMode("absorption"));
elemModeEmission?.addEventListener("click", () => setMode("emission"));
elemModeAbsorption?.addEventListener("click", () => setMode("absorption"));

playTransitionBtn.addEventListener("click", () => {
  stopSequencePlayback();
  animateTransition();
  announceCurrentTransition("Transition replayed.");
});

// Preset buttons
for (const btn of presetButtons) {
  btn.addEventListener("click", () => {
    stopSequencePlayback();
    state.inferenceMode = "forward";
    state.inverse.lastInference = null;
    const nU = Number(btn.getAttribute("data-n-upper"));
    const nL = Number(btn.getAttribute("data-n-lower"));
    if (Number.isFinite(nU) && Number.isFinite(nL) && nU > nL) {
      state.nUpper = nU;
      state.nLower = nL;
      state.seriesFilter = nL <= 4 ? (nL as SeriesFilter) : "all";
      render();
      announceCurrentTransition("Preset selected.");
    }
  });
}

// Series filter chips
for (const chip of seriesChips) {
  chip.addEventListener("click", () => {
    stopSequencePlayback();
    state.inferenceMode = "forward";
    state.inverse.lastInference = null;
    const series = chip.getAttribute("data-series");
    if (!series) return;
    if (series === "all") {
      state.seriesFilter = "all";
      render();
      announceCurrentTransition("Series filter set to All.");
      return;
    }
    const nLow = Number(series);
    if (Number.isFinite(nLow) && nLow >= 1 && nLow <= 4) {
      state.seriesFilter = nLow as SeriesFilter;
      state.nLower = nLow;
      if (state.nUpper <= state.nLower) state.nUpper = state.nLower + 1;
      render();
      announceCurrentTransition(`Series filter set to ${SpectralLineModel.seriesName({ nLower: nLow })}.`);
    }
  });
}

// Element chips
for (const chip of elementChips) {
  chip.addEventListener("click", () => {
    stopSequencePlayback();
    const elem = chip.getAttribute("data-element");
    if (elem) {
      const comparisonWasEnabled = state.showHComparison;
      state.selectedElement = elem;
      if (state.showHComparison && elem === "H") {
        state.showHComparison = false;
        if (showHComparison) showHComparison.checked = false;
      }
      render();
      announceCurrentTransition(`Element ${elem} selected.`);
      if (comparisonWasEnabled && elem === "H") {
        setLiveRegionText(statusEl, "Hydrogen comparison turned off. Select a non-hydrogen element to compare against H Balmer.");
      }
    }
  });
}

guessModeEmission?.addEventListener("click", () => {
  stopSequencePlayback();
  state.mystery.guessMode = "emission";
  render();
});

guessModeAbsorption?.addEventListener("click", () => {
  stopSequencePlayback();
  state.mystery.guessMode = "absorption";
  render();
});

for (const chip of reflectionChips) {
  chip.addEventListener("click", () => {
    const evidence = chip.getAttribute("data-reflection");
    if (!evidence) return;
    state.mystery.reflectionEvidence = evidence as ReflectionEvidenceKey;
    render();
    setLiveRegionText(statusEl, `Mystery evidence noted: ${evidence}.`);
  });
}

mysterySpectrumBtn?.addEventListener("click", () => {
  stopSequencePlayback();
  startMysterySpectrum();
});

checkMysteryAnswerBtn?.addEventListener("click", () => {
  stopSequencePlayback();
  checkMysteryAnswer();
});

mysteryHintBtn?.addEventListener("click", () => {
  if (!state.mystery.active) {
    setLiveRegionText(statusEl, "Start a mystery challenge to request a hint.");
    return;
  }
  const hint = mysteryChallengeEngine.getHint();
  if (!hint) {
    setLiveRegionText(statusEl, "No more hints available for this mystery.");
    return;
  }
  setLiveRegionText(statusEl, `Hint: ${hint}`);
});

exitMysteryBtn?.addEventListener("click", () => {
  stopSequencePlayback();
  stopMysterySpectrum();
});

// H comparison checkbox
showHComparison?.addEventListener("change", () => {
  stopSequencePlayback();
  if (showHComparison.checked && state.selectedElement === "H") {
    state.showHComparison = false;
    showHComparison.checked = false;
    render();
    setLiveRegionText(statusEl, "Select a non-hydrogen element to compare against H Balmer.");
    return;
  }
  state.showHComparison = showHComparison.checked;
  render();
  setLiveRegionText(statusEl, showHComparison.checked ? "Hydrogen Balmer comparison enabled." : "Hydrogen Balmer comparison disabled.");
});

microscopeProbeSlider?.addEventListener("input", () => {
  const next = Number(microscopeProbeSlider.value);
  state.microscope.probeNUpper = clamp(Math.round(next), 6, 80);
  render();
});

microscopeInfinity?.addEventListener("change", () => {
  state.microscope.includeInfinity = microscopeInfinity.checked;
  render();
});

temperatureSlider?.addEventListener("input", () => {
  const next = Number(temperatureSlider.value);
  state.temperatureK = clamp(next, 4000, 20000);
  render();
});

// Sidebar tab switching
const sidebarTabH = document.getElementById("sidebar-tab-H") as HTMLButtonElement | null;
const sidebarTabElem = document.getElementById("sidebar-tab-elem") as HTMLButtonElement | null;

sidebarTabH?.addEventListener("click", () => {
  stopSequencePlayback();
  if (state.mystery.active || state.mystery.revealed) stopMysterySpectrum();
  setSidebarView("hydrogen");
  render();
  announceCurrentTransition("Hydrogen tab active.");
});

sidebarTabElem?.addEventListener("click", () => {
  stopSequencePlayback();
  setSidebarView("elements");
  render();
  announceCurrentTransition("Elements tab active.");
});

playBtn.addEventListener("click", () => {
  state.sequenceDirection = 1;
  startSequencePlayback();
});

pauseBtn.addEventListener("click", () => {
  stopSequencePlayback();
});

stepBackBtn.addEventListener("click", () => {
  stopSequencePlayback();
  state.sequenceDirection = -1;
  stepSequence(-1);
});

stepForwardBtn.addEventListener("click", () => {
  stopSequencePlayback();
  state.sequenceDirection = 1;
  stepSequence(1);
});

resetBtn.addEventListener("click", () => {
  stopSequencePlayback();
  state.sequenceDirection = 1;
  state.inferenceMode = "forward";
  state.inverse.lastInference = null;
  state.nUpper = 3;
  state.nLower = 2;
  state.seriesFilter = 2;
  render();
  announceCurrentTransition("Transition sequence reset.");
});

speedSelect.addEventListener("change", () => {
  syncPlaybarState();
  const speed = Number(speedSelect.value) || 1;
  setLiveRegionText(statusEl, `Sequence speed set to ${formatNumber(speed, 0)}x.`);
});

// Copy results
copyResultsBtn.addEventListener("click", () => {
  if (isCopyLocked()) {
    setLiveRegionText(statusEl, "Copy Results is locked while a mystery spectrum is unrevealed. Check or end the mystery first.");
    return;
  }
  setLiveRegionText(statusEl, "Copying\u2026");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(statusEl, "Copied results to clipboard."))
    .catch((err) => setLiveRegionText(statusEl, err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."));
});

// Resize handler
window.addEventListener("resize", () => render());
tabExploreEl?.addEventListener("click", () => {
  window.requestAnimationFrame(() => render());
});

// ── Demo modes (Station Mode + Help) ────────────────────────

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
          { key: "g", action: "Toggle station mode" },
          { key: "p", action: "Play transition animation" },
        ]
      },
      {
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Use Forward mode on the Hydrogen tab to choose upper and lower quantum numbers, then watch the Bohr atom, energy diagram, and spectrum update.",
          "Switch to Inverse mode on the Hydrogen tab to infer a transition from an observed wavelength.",
          "Switch between Emission and Absorption to see bright lines vs. dark dips.",
          "Use the Hydrogen-only Series Limit Microscope to inspect convergence near the series limit.",
          "Switch to the Elements tab for empirical fingerprint matching across atoms.",
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Spectral Lines",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Record the H-alpha transition (n=3 to 2). Note the wavelength and series.",
      "Record a Lyman-series transition. Compare the energy to H-alpha.",
      "Try a Paschen transition. What band is it in? Is it visible?",
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "transition", label: "Transition" },
      { key: "wavelength", label: "wavelength (nm)" },
      { key: "energy", label: "E (eV)" },
      { key: "series", label: "Series" },
      { key: "band", label: "Band" },
    ],
    getSnapshotRow() {
      const wNm = SpectralLineModel.transitionWavelengthNm({ nUpper: state.nUpper, nLower: state.nLower });
      const eEv = SpectralLineModel.transitionEnergyEv({ nUpper: state.nUpper, nLower: state.nLower });
      return {
        case: "Snapshot",
        transition: transitionLabel(state.nUpper, state.nLower),
        wavelength: Number.isFinite(wNm) ? wNm.toFixed(1) : "\u2014",
        energy: formatNumber(eEv, 4),
        series: SpectralLineModel.seriesName({ nLower: state.nLower }),
        band: SpectralLineModel.wavelengthBand({ wavelengthNm: wNm }),
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add Balmer series examples",
        getRows() {
          const transitions = [
            { label: "H\u03B1", nU: 3, nL: 2 },
            { label: "H\u03B2", nU: 4, nL: 2 },
            { label: "H\u03B3", nU: 5, nL: 2 },
            { label: "H\u03B4", nU: 6, nL: 2 },
          ];
          return transitions.map((t) => {
            const wNm = SpectralLineModel.transitionWavelengthNm({ nUpper: t.nU, nLower: t.nL });
            const eEv = SpectralLineModel.transitionEnergyEv({ nUpper: t.nU, nLower: t.nL });
            return {
              case: t.label,
              transition: transitionLabel(t.nU, t.nL),
              wavelength: wNm.toFixed(1),
              energy: formatNumber(eEv, 4),
              series: "Balmer",
              band: SpectralLineModel.wavelengthBand({ wavelengthNm: wNm }),
            };
          });
        }
      },
      {
        label: "Add element fingerprint snapshots (H/He/Na/Fe)",
        getRows() {
          const elementOrder = ["H", "He", "Na", "Fe"] as const;
          return elementOrder.map((element) => {
            const catalog = SpectralLineModel.elementLines({ element });
            const representative = selectRepresentativeElementLine(catalog.lines);
            const wavelengthNm = representative?.wavelengthNm ?? NaN;
            const energyEv = Number.isFinite(wavelengthNm) && wavelengthNm > 0
              ? SpectralLineModel.BOHR.HC_EV_NM / wavelengthNm
              : NaN;
            return {
              case: `${element} representative`,
              transition: representative?.label ?? `${element} strongest line`,
              wavelength: Number.isFinite(wavelengthNm) ? wavelengthNm.toFixed(1) : "\u2014",
              energy: Number.isFinite(energyEv) ? formatNumber(energyEv, 4) : "\u2014",
              series: "Empirical catalog",
              band: SpectralLineModel.wavelengthBand({ wavelengthNm }),
            };
          });
        }
      },
    ]
  }
});

demoModes.bindButtons({ helpButton: helpBtn, stationButton: stationModeBtn });

// Keyboard shortcut for play
document.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  if (e.key === "p") {
    if (state.sequencePlaying) {
      stopSequencePlayback();
    } else {
      startSequencePlayback();
    }
  }
});

// ── Init ────────────────────────────────────────────────────

if (prefersReducedMotion) {
  setLiveRegionText(statusEl, "Reduced motion enabled; transition animations are disabled.");
}

render();
initMath(document);

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}
