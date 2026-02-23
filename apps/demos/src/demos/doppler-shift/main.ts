import {
  ChallengeEngine,
  copyTextToClipboard,
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  initTabs,
  setLiveRegionText,
} from "@cosmic/runtime";
import type { Challenge, ExportPayloadV1 } from "@cosmic/runtime";
import { DopplerShiftModel, SpectralLineModel } from "@cosmic/physics";
import {
  DEFAULT_SPECTRUM_DOMAIN,
  REDSHIFT_SLIDER_MAX,
  REDSHIFT_SLIDER_MIN,
  REGIME_DIVERGENCE_THRESHOLD_PERCENT,
  VELOCITY_SLIDER_MAX_KM_S,
  VELOCITY_SLIDER_MIN_KM_S,
  VISIBLE_SPECTRUM_DOMAIN,
  axisTicks,
  buildChallengeEvidenceText,
  buildDopplerExportPayload,
  buildRepresentativeLineRuleText,
  centerDomainOnLines,
  clamp,
  computeRegimeThresholdMarkers,
  createSeededRandom,
  directionSummary,
  formatNumber,
  formatSigned,
  isMysteryCopyLocked,
  pickChallengeTarget,
  redshiftSliderStep,
  selectDisplayLines,
  selectRepresentativeLine,
  syncPhysicalFromRedshift,
  syncPhysicalFromVelocity,
  velocitySliderIsClamped,
  wavelengthToFraction,
  wavelengthToRgbString,
  type ChallengeTarget,
  type FormulaMode,
  type LineDensityMode,
  type SpectrumLine,
  type SpectrumMode,
} from "./logic";

const $ = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
};

const velocitySlider = $<HTMLInputElement>("#velocitySlider");
const redshiftSlider = $<HTMLInputElement>("#redshiftSlider");
const redshiftRegimeTrack = $<HTMLDivElement>("#redshiftRegimeTrack");
const regimeMarkerBlue = $<HTMLSpanElement>("#regimeMarkerBlue");
const regimeMarkerRed = $<HTMLSpanElement>("#regimeMarkerRed");
const regimeMarkerCaption = $<HTMLParagraphElement>("#regimeMarkerCaption");
const velocityValue = $<HTMLSpanElement>("#velocityValue");
const redshiftValue = $<HTMLSpanElement>("#redshiftValue");
const redshiftStepValue = $<HTMLSpanElement>("#redshiftStep");
const velocityClampIndicator = $<HTMLParagraphElement>("#velocityClampIndicator");
const directionIndicator = $<HTMLDivElement>("#directionIndicator");

const modeEmission = $<HTMLButtonElement>("#modeEmission");
const modeAbsorption = $<HTMLButtonElement>("#modeAbsorption");
const formulaNonRel = $<HTMLButtonElement>("#formulaNonRel");
const formulaRel = $<HTMLButtonElement>("#formulaRel");
const formulaLimitIndicator = $<HTMLParagraphElement>("#formulaLimitIndicator");

const elementChips = Array.from(document.querySelectorAll<HTMLButtonElement>("button.element-chip"));
const presetChips = Array.from(document.querySelectorAll<HTMLButtonElement>("button.preset-chip"));
const lineDensityWrap = $<HTMLLabelElement>("#lineDensityWrap");
const showAllLines = $<HTMLInputElement>("#showAllLines");

const mysterySpectrumBtn = $<HTMLButtonElement>("#mysterySpectrumBtn");
const mysteryPanel = $<HTMLDivElement>("#mysteryPanel");
const mysteryPrompt = $<HTMLParagraphElement>("#mysteryPrompt");
const mysteryGuessElement = $<HTMLSelectElement>("#mysteryGuessElement");
const guessModeEmission = $<HTMLButtonElement>("#guessModeEmission");
const guessModeAbsorption = $<HTMLButtonElement>("#guessModeAbsorption");
const checkMysteryAnswerBtn = $<HTMLButtonElement>("#checkMysteryAnswer");
const mysteryHintBtn = $<HTMLButtonElement>("#mysteryHint");
const exitMysteryBtn = $<HTMLButtonElement>("#exitMystery");
const copyChallengeEvidenceBtn = $<HTMLButtonElement>("#copyChallengeEvidence");
const copyLockHint = $<HTMLParagraphElement>("#copyLockHint");

const zoomVisibleBtn = $<HTMLButtonElement>("#zoomVisible");
const centerLinesBtn = $<HTMLButtonElement>("#centerLines");
const zoomResetBtn = $<HTMLButtonElement>("#zoomReset");
const domainLabel = $<HTMLSpanElement>("#domainLabel");

const waveDiagram = $<SVGSVGElement>("#waveDiagram");
const spectrumCanvas = $<HTMLCanvasElement>("#spectrumCanvas");
const statusEl = $<HTMLParagraphElement>("#status");

const lineLabelValue = $<HTMLSpanElement>("#lineLabelValue");
const repLineRuleChip = $<HTMLButtonElement>("#repLineRuleChip");
const repLineRuleNote = $<HTMLParagraphElement>("#repLineRuleNote");
const vrValue = $<HTMLSpanElement>("#vrValue");
const zValue = $<HTMLSpanElement>("#zValue");
const lambdaObsValue = $<HTMLSpanElement>("#lambdaObsValue");
const deltaLambdaValue = $<HTMLSpanElement>("#deltaLambdaValue");
const nuObsValue = $<HTMLSpanElement>("#nuObsValue");
const deltaNuValue = $<HTMLSpanElement>("#deltaNuValue");
const bandValue = $<HTMLSpanElement>("#bandValue");
const regimeValue = $<HTMLSpanElement>("#regimeValue");
const divergenceValue = $<HTMLSpanElement>("#divergenceValue");

const comparisonReadouts = $<HTMLDivElement>("#comparisonReadouts");
const lambdaNonRelValue = $<HTMLSpanElement>("#lambdaNonRelValue");
const lambdaRelValue = $<HTMLSpanElement>("#lambdaRelValue");
const zCompareValue = $<HTMLSpanElement>("#zCompareValue");

const stationModeBtn = $<HTMLButtonElement>("#stationMode");
const helpBtn = $<HTMLButtonElement>("#help");
const copyResultsBtn = $<HTMLButtonElement>("#copyResults");

const ctxOrNull = spectrumCanvas.getContext("2d");
if (!ctxOrNull) {
  throw new Error("Canvas 2D context unavailable for spectrum comparator.");
}
const ctx = ctxOrNull;

const demoUrl = new URL(window.location.href);
const challengeSeed = demoUrl.searchParams.get("challengeSeed");
const challengeRandom = challengeSeed ? createSeededRandom(challengeSeed) : null;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:doppler-shift:mode",
  url: demoUrl,
});

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface DopplerPreset {
  id: string;
  label: string;
  note: string;
  velocityKmS?: number;
  z?: number;
}

const PRESETS: DopplerPreset[] = [
  { id: "1", label: "At rest", velocityKmS: 0, note: "Baseline" },
  { id: "2", label: "Vega", velocityKmS: -20.6, note: "Slight blueshift" },
  { id: "3", label: "Barnard's Star", velocityKmS: -110, note: "Fast nearby approach" },
  { id: "4", label: "Andromeda (M31)", velocityKmS: -301, note: "Approaching galaxy" },
  { id: "5", label: "Typical galaxy cluster", velocityKmS: 1000, note: "Moderate recession" },
  { id: "6", label: "Coma Cluster", velocityKmS: 6925, note: "Mildly relativistic threshold" },
  { id: "7", label: "Quasar 3C 273", z: 0.158, note: "Relativistic conversion important" },
  { id: "8", label: "High-z galaxy", z: 2, note: "Non-rel approximation fails" },
] as const;

const CHALLENGE_PRESET_IDS = ["2", "4", "5", "7"] as const;
const CHALLENGE_ELEMENTS = ["H", "He", "Na", "Ca", "Fe"] as const;

type ChallengeEvidenceSnapshot = {
  guessedElement: string;
  guessedMode: SpectrumMode;
  targetElement: string;
  targetMode: SpectrumMode;
  correct: boolean;
  formulaMode: FormulaMode;
  radialVelocityKmS: number;
  redshift: number;
  representativeLineLabel: string;
  lambdaObsNm: number;
  deltaLambdaNm: number;
  regimeLabel: string;
  divergencePercent: number;
};

const state = {
  velocityKmS: 0,
  z: 0,
  formulaMode: "non-relativistic" as FormulaMode,
  spectrumMode: "emission" as SpectrumMode,
  selectedElement: "H",
  lineDensityMode: "strongest-8" as LineDensityMode,
  domain: { ...DEFAULT_SPECTRUM_DOMAIN },
  activePresetId: "1",
  repLineRuleExpanded: false,
  mystery: {
    active: false,
    revealed: false,
    guessElement: "H",
    guessMode: "emission" as SpectrumMode,
    target: null as ChallengeTarget | null,
    lastTarget: null as ChallengeTarget | null,
    lastCheckEvidence: null as ChallengeEvidenceSnapshot | null,
  },
};

const regimeThresholds = computeRegimeThresholdMarkers({
  thresholdPercent: REGIME_DIVERGENCE_THRESHOLD_PERCENT,
});

let wavePhasePx = 0;
let waveFrame = 0;

const challengeTargets: ChallengeTarget[] = CHALLENGE_ELEMENTS.flatMap((element) => {
  return CHALLENGE_PRESET_IDS.flatMap((presetId) => {
    const preset = PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return [];
    const base = preset.velocityKmS !== undefined
      ? syncPhysicalFromVelocity(preset.velocityKmS)
      : syncPhysicalFromRedshift(preset.z ?? 0);
    return [
      { element, mode: "emission" as SpectrumMode, velocityKmS: base.velocityKmS, z: base.z },
      { element, mode: "absorption" as SpectrumMode, velocityKmS: base.velocityKmS, z: base.z },
    ];
  });
});

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function clearSvg(svg: SVGSVGElement) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

function lineCatalog(): SpectrumLine[] {
  const detail = state.selectedElement === "Fe" ? "dense" : "standard";
  const catalog = SpectralLineModel.elementLines({ element: state.selectedElement, detail });
  return catalog.lines.map((line) => ({
    wavelengthNm: line.wavelengthNm,
    relativeIntensity: line.relativeIntensity,
    label: line.label ?? `${catalog.symbol} ${line.wavelengthNm.toFixed(1)}`,
  }));
}

function displayLines(): SpectrumLine[] {
  return selectDisplayLines({ lines: lineCatalog(), densityMode: state.lineDensityMode });
}

function representativeLine(): SpectrumLine | undefined {
  return selectRepresentativeLine(lineCatalog(), { preferVisible: true });
}

function hasVisibleRepresentativeCandidate(lines: SpectrumLine[]): boolean {
  return lines.some((line) => line.wavelengthNm >= 380 && line.wavelengthNm <= 750);
}

function normalizedSliderPercent(value: number): number {
  return ((value - REDSHIFT_SLIDER_MIN) / (REDSHIFT_SLIDER_MAX - REDSHIFT_SLIDER_MIN)) * 100;
}

function formulaAppliedMode(requestedMode: FormulaMode, velocityKmS: number): FormulaMode {
  if (requestedMode === "non-relativistic" && DopplerShiftModel.regime(velocityKmS).label === "relativistic") {
    return "relativistic";
  }
  return requestedMode;
}

function computeReadoutContext() {
  const catalog = lineCatalog();
  const representative = selectRepresentativeLine(catalog, { preferVisible: true });
  const hasVisibleRepresentative = hasVisibleRepresentativeCandidate(catalog);
  const fallbackLabel = `${state.selectedElement} strongest line`;
  const requestedFormulaMode = state.formulaMode;
  const appliedFormulaMode = formulaAppliedMode(requestedFormulaMode, state.velocityKmS);
  const lambdaRestNm = representative?.wavelengthNm ?? NaN;
  const lambdaObsNm = DopplerShiftModel.shiftedWavelengthNm({
    lambdaRestNm,
    velocityKmS: state.velocityKmS,
    relativistic: appliedFormulaMode === "relativistic",
  });
  const deltaLambdaNm = lambdaObsNm - lambdaRestNm;
  const nuRestTHz = DopplerShiftModel.wavelengthNmToFrequencyTHz(lambdaRestNm);
  const nuObsTHz = DopplerShiftModel.wavelengthNmToFrequencyTHz(lambdaObsNm);
  const deltaNuTHz = nuObsTHz - nuRestTHz;
  const regime = DopplerShiftModel.regime(state.velocityKmS);
  const zNonRel = DopplerShiftModel.redshiftFromVelocity({
    velocityKmS: state.velocityKmS,
    relativistic: false,
  });
  const zRel = DopplerShiftModel.redshiftFromVelocity({
    velocityKmS: state.velocityKmS,
    relativistic: true,
  });

  const lambdaObsNonRel = DopplerShiftModel.shiftedWavelengthNm({
    lambdaRestNm,
    velocityKmS: state.velocityKmS,
    relativistic: false,
  });
  const lambdaObsRel = DopplerShiftModel.shiftedWavelengthNm({
    lambdaRestNm,
    velocityKmS: state.velocityKmS,
    relativistic: true,
  });

  return {
    representativeLineLabel: representative?.label ?? fallbackLabel,
    hasVisibleRepresentative,
    formulaRequestedMode: requestedFormulaMode,
    formulaAppliedMode: appliedFormulaMode,
    formulaFallbackApplied: requestedFormulaMode !== appliedFormulaMode,
    lambdaRestNm,
    lambdaObsNm,
    deltaLambdaNm,
    nuRestTHz,
    nuObsTHz,
    deltaNuTHz,
    band: SpectralLineModel.wavelengthBand({ wavelengthNm: lambdaObsNm }),
    regime,
    zNonRel,
    zRel,
    lambdaObsNonRel,
    lambdaObsRel,
  };
}

function challengeStateLabel(): "inactive" | "active-hidden" | "revealed" {
  if (state.mystery.active && !state.mystery.revealed) return "active-hidden";
  if (state.mystery.revealed) return "revealed";
  return "inactive";
}

function isCopyLocked(): boolean {
  return isMysteryCopyLocked({
    mysteryActive: state.mystery.active,
    mysteryRevealed: state.mystery.revealed,
  });
}

function challengeEvidenceReady(): boolean {
  return state.mystery.revealed && state.mystery.lastCheckEvidence !== null;
}

function syncCopyLockState() {
  const locked = isCopyLocked();
  copyResultsBtn.disabled = locked;
  copyResultsBtn.setAttribute("aria-disabled", String(locked));
  copyLockHint.hidden = !locked;

  const evidenceReady = challengeEvidenceReady();
  copyChallengeEvidenceBtn.hidden = !state.mystery.revealed;
  copyChallengeEvidenceBtn.disabled = !evidenceReady;
  copyChallengeEvidenceBtn.setAttribute("aria-disabled", String(!evidenceReady));
}

function updateRegimeMarkers() {
  const blueZ = clamp(regimeThresholds.blueZ, REDSHIFT_SLIDER_MIN, REDSHIFT_SLIDER_MAX);
  const redZ = clamp(regimeThresholds.redZ, REDSHIFT_SLIDER_MIN, REDSHIFT_SLIDER_MAX);
  const bluePercent = clamp(normalizedSliderPercent(blueZ), 0, 100);
  const redPercent = clamp(normalizedSliderPercent(redZ), 0, 100);

  regimeMarkerBlue.style.left = `${bluePercent}%`;
  regimeMarkerRed.style.left = `${redPercent}%`;
  redshiftRegimeTrack.style.setProperty("--cp-regime-blue-pos", `${bluePercent}%`);
  redshiftRegimeTrack.style.setProperty("--cp-regime-red-pos", `${redPercent}%`);
  regimeMarkerCaption.textContent = `Approximation boundary (${REGIME_DIVERGENCE_THRESHOLD_PERCENT}% NR error): blue z~${formatSigned(blueZ, 3)}, red z~${formatSigned(redZ, 3)}. Outside these markers, relativistic is required.`;
}

function currentShiftDirection(): "toward blue" | "toward red" | "no shift" {
  if (state.velocityKmS < 0) return "toward blue";
  if (state.velocityKmS > 0) return "toward red";
  return "no shift";
}

function announceShift(prefix?: string) {
  const readouts = computeReadoutContext();
  const crestText = state.velocityKmS < 0
    ? "Crests are closer together."
    : state.velocityKmS > 0
      ? "Crests are farther apart."
      : "Crests match rest spacing.";
  const body = `Observed wavelength ${formatNumber(readouts.lambdaObsNm, 3)} nm, shift ${formatSigned(readouts.deltaLambdaNm, 3)} nm ${currentShiftDirection()}. ${crestText}`;
  setLiveRegionText(statusEl, prefix ? `${prefix} ${body}` : body);
}

function setSpectrumMode(nextMode: SpectrumMode, announce = true) {
  state.spectrumMode = nextMode;
  render();
  if (announce) {
    setLiveRegionText(statusEl, `${nextMode === "emission" ? "Emission" : "Absorption"} mode selected.`);
  }
}

function setFormulaMode(nextMode: FormulaMode, announce = true) {
  state.formulaMode = nextMode;
  render();
  if (announce) {
    const readouts = computeReadoutContext();
    if (nextMode === "non-relativistic" && readouts.formulaFallbackApplied) {
      setLiveRegionText(statusEl, "Non-relativistic approximation exceeds 5% in this regime. Relativistic predictions are shown.");
      return;
    }
    setLiveRegionText(statusEl, `${nextMode === "relativistic" ? "Relativistic" : "Non-relativistic"} formula selected.`);
  }
}

function setPhysicalVelocity(velocityKmS: number, announce = true) {
  const synced = syncPhysicalFromVelocity(velocityKmS);
  state.velocityKmS = synced.velocityKmS;
  state.z = synced.z;
  render();
  if (announce) announceShift();
}

function setPhysicalRedshift(z: number, announce = true) {
  const synced = syncPhysicalFromRedshift(z);
  state.velocityKmS = synced.velocityKmS;
  state.z = synced.z;
  render();
  if (announce) announceShift();
}

function applyPresetById(presetId: string, announce = true) {
  const preset = PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) return;
  state.activePresetId = preset.id;
  state.domain = { ...DEFAULT_SPECTRUM_DOMAIN };

  if (preset.velocityKmS !== undefined) {
    const synced = syncPhysicalFromVelocity(preset.velocityKmS);
    state.velocityKmS = synced.velocityKmS;
    state.z = synced.z;
  } else {
    const synced = syncPhysicalFromRedshift(preset.z ?? 0);
    state.velocityKmS = synced.velocityKmS;
    state.z = synced.z;
  }

  render();
  if (announce) {
    setLiveRegionText(statusEl, `Preset ${preset.id}: ${preset.label}. ${preset.note}.`);
  }
}

function resizeSpectrumCanvas() {
  const rect = spectrumCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (spectrumCanvas.width !== pixelWidth || spectrumCanvas.height !== pixelHeight) {
    spectrumCanvas.width = pixelWidth;
    spectrumCanvas.height = pixelHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function drawSpectrumStrip(args: {
  y: number;
  height: number;
  emission: boolean;
  domain: { minNm: number; maxNm: number };
  plotLeft: number;
  plotWidth: number;
}) {
  const grad = ctx.createLinearGradient(args.plotLeft, 0, args.plotLeft + args.plotWidth, 0);
  const steps = 48;
  for (let i = 0; i <= steps; i += 1) {
    const fraction = i / steps;
    const wavelength = args.domain.minNm + fraction * (args.domain.maxNm - args.domain.minNm);
    grad.addColorStop(fraction, wavelengthToRgbString(wavelength));
  }

  ctx.fillStyle = grad;
  ctx.fillRect(args.plotLeft, args.y, args.plotWidth, args.height);

  if (args.emission) {
    ctx.fillStyle = "rgba(4, 8, 14, 0.74)";
    ctx.fillRect(args.plotLeft, args.y, args.plotWidth, args.height);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(args.plotLeft, args.y, args.plotWidth, args.height);
}

function drawSpectrumComparator() {
  const { width, height } = resizeSpectrumCanvas();
  ctx.clearRect(0, 0, width, height);

  const plotLeft = 50;
  const plotRight = width - 18;
  const plotWidth = Math.max(40, plotRight - plotLeft);

  const topY = Math.round(height * 0.22);
  const stripHeight = Math.round(height * 0.18);
  const bottomY = Math.round(height * 0.58);

  drawSpectrumStrip({
    y: topY,
    height: stripHeight,
    emission: state.spectrumMode === "emission",
    domain: state.domain,
    plotLeft,
    plotWidth,
  });

  drawSpectrumStrip({
    y: bottomY,
    height: stripHeight,
    emission: state.spectrumMode === "emission",
    domain: state.domain,
    plotLeft,
    plotWidth,
  });

  ctx.fillStyle = "rgba(240, 244, 255, 0.88)";
  ctx.font = "12px var(--cp-font-sans, ui-sans-serif)";
  ctx.fillText("Lab", 12, topY + stripHeight / 2 + 4);
  ctx.fillText("Observed", 6, bottomY + stripHeight / 2 + 4);

  const lines = displayLines();
  const appliedFormulaMode = formulaAppliedMode(state.formulaMode, state.velocityKmS);
  const shifted = DopplerShiftModel.shiftLines({
    lines,
    velocityKmS: state.velocityKmS,
    relativistic: appliedFormulaMode === "relativistic",
  });

  let offLeft = 0;
  let offRight = 0;

  for (const line of shifted) {
    const restFraction = wavelengthToFraction(line.wavelengthNm, state.domain);
    const obsFraction = wavelengthToFraction(line.shiftedNm, state.domain);

    const restInDomain = line.wavelengthNm >= state.domain.minNm && line.wavelengthNm <= state.domain.maxNm;
    const obsInDomain = line.shiftedNm >= state.domain.minNm && line.shiftedNm <= state.domain.maxNm;

    const restX = plotLeft + restFraction * plotWidth;
    const obsX = plotLeft + obsFraction * plotWidth;

    if (!obsInDomain) {
      if (line.shiftedNm < state.domain.minNm) offLeft += 1;
      else offRight += 1;
    }

    if (restInDomain && obsInDomain) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(230, 235, 255, 0.36)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(restX, topY + stripHeight);
      ctx.lineTo(obsX, bottomY);
      ctx.stroke();
      ctx.restore();
    }

    const strokeWidth = 1.6 + Math.max(0, line.relativeIntensity ?? 0) * 2.2;

    if (restInDomain) {
      ctx.strokeStyle = state.spectrumMode === "emission" ? wavelengthToRgbString(line.wavelengthNm) : "rgba(22, 25, 34, 0.9)";
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(restX, topY + 2);
      ctx.lineTo(restX, topY + stripHeight - 2);
      ctx.stroke();
    }

    if (obsInDomain) {
      ctx.strokeStyle = state.spectrumMode === "emission" ? wavelengthToRgbString(line.shiftedNm) : "rgba(22, 25, 34, 0.9)";
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(obsX, bottomY + 2);
      ctx.lineTo(obsX, bottomY + stripHeight - 2);
      ctx.stroke();

      const revealTarget = !(state.mystery.active && !state.mystery.revealed);
      if (revealTarget) {
        ctx.fillStyle = "rgba(234, 239, 255, 0.78)";
        ctx.font = "11px var(--cp-font-sans, ui-sans-serif)";
        ctx.fillText(line.label, obsX + 3, bottomY - 6);
      }
    }
  }

  const representative = selectRepresentativeLine(lines, { preferVisible: true });
  if (representative) {
    const shiftedRepresentative = DopplerShiftModel.shiftedWavelengthNm({
      lambdaRestNm: representative.wavelengthNm,
      velocityKmS: state.velocityKmS,
      relativistic: appliedFormulaMode === "relativistic",
    });

    if (
      representative.wavelengthNm >= state.domain.minNm &&
      representative.wavelengthNm <= state.domain.maxNm &&
      shiftedRepresentative >= state.domain.minNm &&
      shiftedRepresentative <= state.domain.maxNm
    ) {
      const xRest = plotLeft + wavelengthToFraction(representative.wavelengthNm, state.domain) * plotWidth;
      const xObs = plotLeft + wavelengthToFraction(shiftedRepresentative, state.domain) * plotWidth;
      const arrowY = Math.round((topY + stripHeight + bottomY) / 2);

      ctx.strokeStyle = "rgba(246, 250, 255, 0.78)";
      ctx.fillStyle = "rgba(246, 250, 255, 0.78)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(xRest, arrowY);
      ctx.lineTo(xObs, arrowY);
      ctx.stroke();

      const dir = xObs >= xRest ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(xObs, arrowY);
      ctx.lineTo(xObs - 6 * dir, arrowY - 3);
      ctx.lineTo(xObs - 6 * dir, arrowY + 3);
      ctx.closePath();
      ctx.fill();

      const delta = shiftedRepresentative - representative.wavelengthNm;
      ctx.font = "11px var(--cp-font-sans, ui-sans-serif)";
      ctx.fillText(`Delta lambda ${formatSigned(delta, 3)} nm`, Math.min(xRest, xObs) + 6, arrowY - 6);
    }
  }

  const ticks = axisTicks({ domain: state.domain, count: 7 });
  const axisY = height - 18;
  ctx.strokeStyle = "rgba(255,255,255,0.26)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotLeft, axisY);
  ctx.lineTo(plotLeft + plotWidth, axisY);
  ctx.stroke();

  ctx.fillStyle = "rgba(225, 231, 245, 0.82)";
  ctx.font = "11px var(--cp-font-sans, ui-sans-serif)";
  for (const tick of ticks) {
    const x = plotLeft + wavelengthToFraction(tick, state.domain) * plotWidth;
    ctx.beginPath();
    ctx.moveTo(x, axisY - 4);
    ctx.lineTo(x, axisY + 4);
    ctx.stroke();
    ctx.fillText(`${Math.round(tick)}`, x - 10, axisY + 14);
  }

  if (offLeft > 0 || offRight > 0) {
    ctx.fillStyle = "rgba(240, 199, 116, 0.9)";
    if (offLeft > 0) ctx.fillText(`${offLeft} off-scale (UV)`, plotLeft, 14);
    if (offRight > 0) ctx.fillText(`${offRight} off-scale (IR)`, plotLeft + plotWidth - 94, 14);
  }

  domainLabel.textContent = `${Math.round(state.domain.minNm)}-${Math.round(state.domain.maxNm)} nm`;

  const readouts = computeReadoutContext();
  if (state.mystery.active && !state.mystery.revealed) {
    spectrumCanvas.setAttribute("aria-label", "Mystery spectrum challenge with hidden element and hidden mode.");
  } else {
    spectrumCanvas.setAttribute(
      "aria-label",
      `Spectrum comparator for ${state.spectrumMode} lines of element ${state.selectedElement}. Representative line shifts by ${formatSigned(readouts.deltaLambdaNm, 3)} nm.`,
    );
  }
}

function drawWaveDiagram() {
  clearSvg(waveDiagram);

  const width = 800;
  const height = 250;
  const xStart = 150;
  const xEnd = 700;
  const baseY = 132;

  const readouts = computeReadoutContext();
  const lambdaRestNm = readouts.lambdaRestNm;
  const lambdaObsNm = readouts.lambdaObsNm;

  const spacingForNm = (nm: number) => {
    if (!Number.isFinite(nm)) return 42;
    return clamp(18 + ((nm - 300) / 600) * 34, 14, 92);
  };

  const restSpacing = spacingForNm(lambdaRestNm);
  const obsSpacing = spacingForNm(lambdaObsNm);

  const ghost = svgEl("path", {
    class: "wave-ghost",
    d: buildWavePath({
      xStart,
      xEnd,
      baselineY: baseY,
      amplitude: 18,
      spacingPx: restSpacing,
      phasePx: wavePhasePx,
    }),
  });
  waveDiagram.appendChild(ghost);

  const main = svgEl("path", {
    class: "wave-main",
    stroke: wavelengthToRgbString(lambdaObsNm),
    d: buildWavePath({
      xStart,
      xEnd,
      baselineY: baseY,
      amplitude: 24,
      spacingPx: obsSpacing,
      phasePx: wavePhasePx,
    }),
  });
  waveDiagram.appendChild(main);

  const sourceGlow = svgEl("circle", { class: "wave-source-glow", cx: 118, cy: baseY, r: 18 });
  const source = svgEl("circle", { class: "wave-source", cx: 118, cy: baseY, r: 8 });
  const observer = svgEl("circle", { class: "wave-observer", cx: 732, cy: baseY, r: 7 });
  waveDiagram.appendChild(sourceGlow);
  waveDiagram.appendChild(source);
  waveDiagram.appendChild(observer);

  const sourceLabel = svgEl("text", { class: "wave-helper", x: 100, y: baseY + 24 });
  sourceLabel.textContent = "Source";
  waveDiagram.appendChild(sourceLabel);

  const observerLabel = svgEl("text", { class: "wave-helper", x: 710, y: baseY + 24 });
  observerLabel.textContent = "Observer";
  waveDiagram.appendChild(observerLabel);

  const bracketStart = 620;
  const bracketEnd = bracketStart + obsSpacing;
  const bracketY = 52;

  waveDiagram.appendChild(svgEl("line", { x1: bracketStart, y1: bracketY, x2: bracketEnd, y2: bracketY, stroke: "currentColor", "stroke-width": 1.2 }));
  waveDiagram.appendChild(svgEl("line", { x1: bracketStart, y1: bracketY - 5, x2: bracketStart, y2: bracketY + 5, stroke: "currentColor", "stroke-width": 1.2 }));
  waveDiagram.appendChild(svgEl("line", { x1: bracketEnd, y1: bracketY - 5, x2: bracketEnd, y2: bracketY + 5, stroke: "currentColor", "stroke-width": 1.2 }));

  const obsLabel = svgEl("text", { class: "wave-label", x: bracketStart, y: bracketY - 8 });
  obsLabel.textContent = `lambda_obs = ${formatNumber(lambdaObsNm, 2)} nm`;
  waveDiagram.appendChild(obsLabel);

  if (Math.abs(lambdaObsNm - lambdaRestNm) > 1e-6) {
    const ghostStart = 420;
    const ghostEnd = ghostStart + restSpacing;
    const ghostY = 82;
    waveDiagram.appendChild(svgEl("line", { x1: ghostStart, y1: ghostY, x2: ghostEnd, y2: ghostY, stroke: "currentColor", "stroke-width": 1.2, opacity: 0.7 }));
    waveDiagram.appendChild(svgEl("line", { x1: ghostStart, y1: ghostY - 4, x2: ghostStart, y2: ghostY + 4, stroke: "currentColor", "stroke-width": 1.2, opacity: 0.7 }));
    waveDiagram.appendChild(svgEl("line", { x1: ghostEnd, y1: ghostY - 4, x2: ghostEnd, y2: ghostY + 4, stroke: "currentColor", "stroke-width": 1.2, opacity: 0.7 }));

    const ghostLabel = svgEl("text", { class: "wave-helper", x: ghostStart, y: ghostY - 8 });
    ghostLabel.textContent = `lambda_0 = ${formatNumber(lambdaRestNm, 2)} nm`;
    waveDiagram.appendChild(ghostLabel);
  }

  const direction = directionSummary(state.velocityKmS);
  const arrowY = 32;
  if (direction.keyword !== "rest") {
    const directionSign = direction.keyword === "redshift" ? 1 : -1;
    const arrowStart = 118;
    const arrowEnd = arrowStart + 44 * directionSign;
    waveDiagram.appendChild(svgEl("line", {
      x1: arrowStart,
      y1: arrowY,
      x2: arrowEnd,
      y2: arrowY,
      stroke: direction.keyword === "redshift" ? "var(--cp-accent-red)" : "var(--cp-accent-cyan)",
      "stroke-width": 2,
    }));
    waveDiagram.appendChild(svgEl("path", {
      d: directionSign > 0
        ? `M ${arrowEnd} ${arrowY} L ${arrowEnd - 7} ${arrowY - 4} L ${arrowEnd - 7} ${arrowY + 4} Z`
        : `M ${arrowEnd} ${arrowY} L ${arrowEnd + 7} ${arrowY - 4} L ${arrowEnd + 7} ${arrowY + 4} Z`,
      fill: direction.keyword === "redshift" ? "var(--cp-accent-red)" : "var(--cp-accent-cyan)",
    }));
  }

  const helperLabel = svgEl("text", { class: "wave-helper", x: 20, y: 20 });
  helperLabel.textContent = direction.sentence;
  waveDiagram.appendChild(helperLabel);

  const crestsText = state.velocityKmS < 0
    ? "closer together"
    : state.velocityKmS > 0
      ? "farther apart"
      : "at rest spacing";

  waveDiagram.setAttribute(
    "aria-label",
    `Wave diagram showing ${currentShiftDirection()}. Observed wavelength ${formatNumber(lambdaObsNm, 2)} nanometers. Crests are ${crestsText}.`,
  );
}

function buildWavePath(args: {
  xStart: number;
  xEnd: number;
  baselineY: number;
  amplitude: number;
  spacingPx: number;
  phasePx: number;
}): string {
  const parts: string[] = [];
  const step = 4;
  for (let x = args.xStart; x <= args.xEnd; x += step) {
    const phase = ((x + args.phasePx) / args.spacingPx) * 2 * Math.PI;
    const y = args.baselineY + args.amplitude * Math.sin(phase);
    parts.push(`${x === args.xStart ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return parts.join(" ");
}

function exportResults(): ExportPayloadV1 {
  if (isCopyLocked()) {
    throw new Error("Copy Results is locked while the mystery spectrum is unrevealed.");
  }

  const readouts = computeReadoutContext();
  return buildDopplerExportPayload({
    radialVelocityKmS: state.velocityKmS,
    redshift: state.z,
    element: state.selectedElement,
    formulaMode: readouts.formulaAppliedMode,
    spectrumMode: state.spectrumMode,
    lineDensityMode: state.lineDensityMode,
    lambdaRestNm: readouts.lambdaRestNm,
    lambdaObsNm: readouts.lambdaObsNm,
    deltaLambdaNm: readouts.deltaLambdaNm,
    nuRestTHz: readouts.nuRestTHz,
    nuObsTHz: readouts.nuObsTHz,
    deltaNuTHz: readouts.deltaNuTHz,
    regimeLabel: readouts.regime.label,
    divergencePercent: readouts.regime.divergencePercent,
    zNonRel: readouts.zNonRel,
    zRel: readouts.zRel,
    representativeLineLabel: readouts.representativeLineLabel,
    wavelengthBand: readouts.band,
    domainMinNm: state.domain.minNm,
    domainMaxNm: state.domain.maxNm,
    challengeState: challengeStateLabel(),
  });
}

function updateReadouts() {
  const readouts = computeReadoutContext();
  const hideTarget = state.mystery.active && !state.mystery.revealed;

  lineLabelValue.textContent = hideTarget ? "Hidden during mystery" : readouts.representativeLineLabel;
  repLineRuleNote.textContent = buildRepresentativeLineRuleText({
    hasVisibleRepresentative: readouts.hasVisibleRepresentative,
  });
  vrValue.textContent = formatSigned(state.velocityKmS, 2);
  zValue.textContent = formatSigned(state.z, 6);
  lambdaObsValue.textContent = formatNumber(readouts.lambdaObsNm, 3);
  deltaLambdaValue.textContent = formatSigned(readouts.deltaLambdaNm, 3);
  nuObsValue.textContent = formatNumber(readouts.nuObsTHz, 3);
  deltaNuValue.textContent = formatSigned(readouts.deltaNuTHz, 3);
  bandValue.textContent = readouts.band;
  regimeValue.textContent = readouts.regime.label;
  divergenceValue.textContent = formatNumber(readouts.regime.divergencePercent, 3);

  lambdaNonRelValue.textContent = formatNumber(readouts.lambdaObsNonRel, 3);
  lambdaRelValue.textContent = formatNumber(readouts.lambdaObsRel, 3);
  zCompareValue.textContent = `${formatNumber(readouts.zNonRel, 6)} vs ${formatNumber(readouts.zRel, 6)}`;

  comparisonReadouts.hidden = !(state.formulaMode === "relativistic" || readouts.formulaFallbackApplied);
}

function render() {
  redshiftSlider.min = String(REDSHIFT_SLIDER_MIN);
  redshiftSlider.max = String(REDSHIFT_SLIDER_MAX);
  velocitySlider.value = String(clamp(state.velocityKmS, VELOCITY_SLIDER_MIN_KM_S, VELOCITY_SLIDER_MAX_KM_S));
  redshiftSlider.value = String(state.z);
  redshiftSlider.step = String(redshiftSliderStep(state.z));
  updateRegimeMarkers();

  velocityValue.textContent = `${formatSigned(state.velocityKmS, 2)} km/s`;
  redshiftValue.textContent = formatSigned(state.z, 6);
  redshiftStepValue.textContent = redshiftSlider.step;

  velocityClampIndicator.hidden = !velocitySliderIsClamped(state.velocityKmS);

  const direction = directionSummary(state.velocityKmS);
  directionIndicator.textContent = direction.sentence;
  directionIndicator.dataset.tone = direction.keyword;

  modeEmission.setAttribute("aria-checked", String(state.spectrumMode === "emission"));
  modeAbsorption.setAttribute("aria-checked", String(state.spectrumMode === "absorption"));
  formulaNonRel.setAttribute("aria-checked", String(state.formulaMode === "non-relativistic"));
  formulaRel.setAttribute("aria-checked", String(state.formulaMode === "relativistic"));
  formulaLimitIndicator.hidden = !computeReadoutContext().formulaFallbackApplied;

  const hideTarget = state.mystery.active && !state.mystery.revealed;
  for (const chip of elementChips) {
    const element = chip.getAttribute("data-element") ?? "";
    const active = !hideTarget && element === state.selectedElement;
    chip.setAttribute("aria-pressed", String(active));
    chip.disabled = state.mystery.active;
  }

  for (const chip of presetChips) {
    const id = chip.getAttribute("data-preset") ?? "";
    chip.setAttribute("aria-pressed", String(id === state.activePresetId));
  }

  modeEmission.disabled = state.mystery.active;
  modeAbsorption.disabled = state.mystery.active;

  if (hideTarget && state.repLineRuleExpanded) {
    state.repLineRuleExpanded = false;
  }
  repLineRuleChip.disabled = hideTarget;
  repLineRuleChip.setAttribute("aria-disabled", String(hideTarget));
  repLineRuleChip.setAttribute("aria-expanded", String(state.repLineRuleExpanded && !hideTarget));
  repLineRuleNote.hidden = hideTarget || !state.repLineRuleExpanded;

  const denseAvailable = state.selectedElement === "Fe" && lineCatalog().length > 10;
  lineDensityWrap.hidden = !denseAvailable;
  showAllLines.checked = state.lineDensityMode === "all";

  mysteryPanel.hidden = !(state.mystery.active || state.mystery.revealed);
  if (!mysteryPanel.hidden) {
    mysteryPrompt.textContent = state.mystery.revealed
      ? "Answer revealed. Start another mystery to try a new hidden target."
      : "Mystery challenge: identify the hidden element and spectrum mode.";
  }

  guessModeEmission.setAttribute("aria-checked", String(state.mystery.guessMode === "emission"));
  guessModeAbsorption.setAttribute("aria-checked", String(state.mystery.guessMode === "absorption"));
  checkMysteryAnswerBtn.disabled = !state.mystery.active;
  mysteryHintBtn.disabled = !state.mystery.active;

  syncCopyLockState();

  updateReadouts();
  drawWaveDiagram();
  drawSpectrumComparator();
}

function startWaveAnimation() {
  if (prefersReducedMotion) return;
  if (waveFrame !== 0) return;

  const tick = () => {
    wavePhasePx = (wavePhasePx + 1.25) % 10_000;
    drawWaveDiagram();
    waveFrame = window.requestAnimationFrame(tick);
  };

  waveFrame = window.requestAnimationFrame(tick);
}

function stopWaveAnimation() {
  if (waveFrame !== 0) {
    window.cancelAnimationFrame(waveFrame);
    waveFrame = 0;
  }
}

type MysteryCheckState = {
  guessedElement: string;
  guessedMode: SpectrumMode;
  targetElement: string;
  targetMode: SpectrumMode;
};

const mysteryChallenge: Challenge = {
  type: "custom",
  prompt: "Identify the hidden element and whether the spectrum is emission or absorption.",
  hints: [
    "Use the strongest shifted line first, then compare nearby spacing.",
    "Sodium tends to cluster near 589 nm; calcium has a strong pair near 393-397 nm.",
  ],
  check(rawState: unknown) {
    const payload = rawState as MysteryCheckState;
    const correct = payload.guessedElement === payload.targetElement && payload.guessedMode === payload.targetMode;
    const targetModeLabel = payload.targetMode === "emission" ? "Emission" : "Absorption";
    const guessedModeLabel = payload.guessedMode === "emission" ? "Emission" : "Absorption";

    if (correct) {
      return {
        correct: true,
        close: true,
        message: `Correct. Mystery spectrum is ${payload.targetElement} in ${targetModeLabel} mode.`,
      };
    }

    return {
      correct: false,
      close: false,
      message: `Not yet. You guessed ${payload.guessedElement} (${guessedModeLabel}); target is ${payload.targetElement} (${targetModeLabel}).`,
    };
  },
};

const mysteryEngine = new ChallengeEngine([mysteryChallenge], {
  showUI: false,
  onProgress: () => {
    setLiveRegionText(statusEl, "Mystery spectrum ready. Make a guess and check your answer.");
  },
  onStop: () => {
    syncCopyLockState();
  },
});

function drawMysteryTarget(): ChallengeTarget {
  return pickChallengeTarget({
    targets: challengeTargets,
    random: challengeRandom ?? Math.random,
    previous: state.mystery.lastTarget,
  });
}

function startMystery() {
  const target = drawMysteryTarget();
  state.mystery.active = true;
  state.mystery.revealed = false;
  state.mystery.lastCheckEvidence = null;
  state.mystery.target = target;
  state.mystery.lastTarget = target;
  state.mystery.guessElement = "H";
  state.mystery.guessMode = "emission";
  state.repLineRuleExpanded = false;

  state.selectedElement = target.element;
  state.spectrumMode = target.mode;
  state.velocityKmS = target.velocityKmS;
  state.z = target.z;

  mysteryGuessElement.value = "H";

  mysteryEngine.start();
  render();
}

function stopMystery() {
  if (!state.mystery.active && !state.mystery.revealed) return;

  state.mystery.active = false;
  state.mystery.revealed = false;
  state.mystery.lastCheckEvidence = null;
  state.mystery.target = null;
  state.repLineRuleExpanded = false;

  if (mysteryEngine.isActive()) {
    mysteryEngine.stop();
  }

  render();
  setLiveRegionText(statusEl, "Mystery spectrum ended.");
}

function checkMysteryAnswer() {
  if (!state.mystery.active || !state.mystery.target) return;
  const readouts = computeReadoutContext();

  const result = mysteryEngine.check({
    guessedElement: mysteryGuessElement.value,
    guessedMode: state.mystery.guessMode,
    targetElement: state.mystery.target.element,
    targetMode: state.mystery.target.mode,
  } satisfies MysteryCheckState);

  state.mystery.active = false;
  state.mystery.revealed = true;
  state.mystery.lastCheckEvidence = {
    guessedElement: mysteryGuessElement.value,
    guessedMode: state.mystery.guessMode,
    targetElement: state.mystery.target.element,
    targetMode: state.mystery.target.mode,
    correct: Boolean(result.correct),
    formulaMode: readouts.formulaAppliedMode,
    radialVelocityKmS: state.velocityKmS,
    redshift: state.z,
    representativeLineLabel: readouts.representativeLineLabel,
    lambdaObsNm: readouts.lambdaObsNm,
    deltaLambdaNm: readouts.deltaLambdaNm,
    regimeLabel: readouts.regime.label,
    divergencePercent: readouts.regime.divergencePercent,
  };
  if (mysteryEngine.isActive()) {
    mysteryEngine.stop();
  }

  render();
  setLiveRegionText(statusEl, result.message ?? "Mystery answer checked.");
}

velocitySlider.addEventListener("input", () => {
  state.activePresetId = "";
  setPhysicalVelocity(Number(velocitySlider.value));
});

redshiftSlider.addEventListener("input", () => {
  state.activePresetId = "";
  setPhysicalRedshift(Number(redshiftSlider.value));
});

modeEmission.addEventListener("click", () => setSpectrumMode("emission"));
modeAbsorption.addEventListener("click", () => setSpectrumMode("absorption"));
formulaNonRel.addEventListener("click", () => setFormulaMode("non-relativistic"));
formulaRel.addEventListener("click", () => setFormulaMode("relativistic"));

for (const chip of elementChips) {
  chip.addEventListener("click", () => {
    const next = chip.getAttribute("data-element");
    if (!next) return;
    state.selectedElement = next;
    if (state.selectedElement !== "Fe") {
      state.lineDensityMode = "strongest-8";
    }
    render();
    announceShift(`Element ${next} selected.`);
  });
}

showAllLines.addEventListener("change", () => {
  state.lineDensityMode = showAllLines.checked ? "all" : "strongest-8";
  render();
  setLiveRegionText(statusEl, showAllLines.checked ? "Showing full line catalog." : "Showing strongest 8 lines.");
});

for (const preset of presetChips) {
  preset.addEventListener("click", () => {
    const id = preset.getAttribute("data-preset");
    if (!id) return;
    applyPresetById(id);
  });
}

zoomVisibleBtn.addEventListener("click", () => {
  state.domain = { ...VISIBLE_SPECTRUM_DOMAIN };
  render();
  setLiveRegionText(statusEl, "Zoomed to visible range (300-900 nm).");
});

centerLinesBtn.addEventListener("click", () => {
  const lines = displayLines();
  const appliedFormulaMode = formulaAppliedMode(state.formulaMode, state.velocityKmS);
  const shifted = DopplerShiftModel.shiftLines({
    lines,
    velocityKmS: state.velocityKmS,
    relativistic: appliedFormulaMode === "relativistic",
  });
  state.domain = centerDomainOnLines({
    linesNm: shifted.map((line) => line.shiftedNm),
    currentDomain: state.domain,
  });
  render();
  setLiveRegionText(statusEl, "Domain centered on shifted line cluster.");
});

zoomResetBtn.addEventListener("click", () => {
  state.domain = { ...DEFAULT_SPECTRUM_DOMAIN };
  render();
  setLiveRegionText(statusEl, "Spectrum range reset to 80-2200 nm.");
});

guessModeEmission.addEventListener("click", () => {
  state.mystery.guessMode = "emission";
  render();
});

guessModeAbsorption.addEventListener("click", () => {
  state.mystery.guessMode = "absorption";
  render();
});

repLineRuleChip.addEventListener("click", () => {
  if (state.mystery.active && !state.mystery.revealed) {
    setLiveRegionText(statusEl, "Representative-line rule is hidden until you check or end the mystery challenge.");
    return;
  }
  state.repLineRuleExpanded = !state.repLineRuleExpanded;
  render();
  setLiveRegionText(
    statusEl,
    state.repLineRuleExpanded
      ? "Representative-line rule shown."
      : "Representative-line rule hidden.",
  );
});

mysterySpectrumBtn.addEventListener("click", () => {
  startMystery();
});

checkMysteryAnswerBtn.addEventListener("click", () => {
  checkMysteryAnswer();
});

mysteryHintBtn.addEventListener("click", () => {
  if (!state.mystery.active) {
    setLiveRegionText(statusEl, "Start a mystery challenge to request a hint.");
    return;
  }

  const hint = mysteryEngine.getHint();
  if (!hint) {
    setLiveRegionText(statusEl, "No more hints available for this mystery.");
    return;
  }
  setLiveRegionText(statusEl, `Hint: ${hint}`);
});

exitMysteryBtn.addEventListener("click", () => {
  stopMystery();
});

copyChallengeEvidenceBtn.addEventListener("click", () => {
  if (!challengeEvidenceReady() || !state.mystery.lastCheckEvidence) {
    setLiveRegionText(statusEl, "Challenge evidence is available only after you check the mystery answer.");
    return;
  }

  const text = buildChallengeEvidenceText({
    ...state.mystery.lastCheckEvidence,
    checkedAtIso: new Date().toISOString(),
  });

  setLiveRegionText(statusEl, "Copying challenge evidence...");
  void copyTextToClipboard(text)
    .then(() => {
      setLiveRegionText(statusEl, "Copied challenge evidence to clipboard.");
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Copy failed.";
      setLiveRegionText(statusEl, `Copy failed: ${message}`);
    });
});

copyResultsBtn.addEventListener("click", () => {
  if (isCopyLocked()) {
    setLiveRegionText(statusEl, "Copy Results is locked while a mystery spectrum is unrevealed. Check or end the mystery first.");
    return;
  }

  setLiveRegionText(statusEl, "Copying...");
  void runtime
    .copyResults(exportResults())
    .then(() => {
      setLiveRegionText(statusEl, "Copied results to clipboard.");
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Copy failed.";
      setLiveRegionText(statusEl, `Copy failed: ${message}`);
    });
});

window.addEventListener("resize", () => {
  render();
});

const demoModes = createDemoModes({
  help: {
    title: "Help / Shortcuts",
    subtitle: "Keyboard shortcuts work when focus is not in an input, select, or textarea.",
    sections: [
      {
        heading: "Shortcuts",
        type: "shortcuts",
        items: [
          { key: "?", action: "Toggle help" },
          { key: "g", action: "Toggle station mode" },
          { key: "r", action: "Toggle relativistic formula" },
          { key: "[ / ]", action: "Velocity -/+ 100 km/s" },
          { key: "{ / }", action: "Velocity -/+ 10,000 km/s" },
          { key: "z / Z", action: "Redshift -/+ 0.1" },
          { key: "1-8", action: "Apply Doppler preset" },
        ],
      },
      {
        heading: "Workflow",
        type: "bullets",
        items: [
          "Predict line direction first, then move velocity or redshift.",
          "Use connectors to trace each rest line into observed space.",
          "Switch to relativistic mode and compare divergence at high redshift.",
        ],
      },
    ],
  },
  station: {
    title: "Station Mode: Doppler Shift",
    subtitle: "Collect snapshot rows and compare presets with unit-explicit columns.",
    steps: [
      "Record one low-speed and one high-speed case.",
      "Compare z_nonrel and z_rel and mark where divergence exceeds 5%.",
      "Explain why wavelength and frequency shifts are not symmetric in non-rel mode.",
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "element", label: "Element" },
      { key: "lambdaRestNm", label: "lambda_0 (nm)" },
      { key: "nuRestTHz", label: "nu_0 (THz)" },
      { key: "velocityKmS", label: "v_r (km/s)" },
      { key: "zNonRel", label: "z (non-rel)" },
      { key: "zRel", label: "z (relativistic)" },
      { key: "lambdaObsNonRel", label: "lambda_obs non-rel (nm)" },
      { key: "lambdaObsRel", label: "lambda_obs rel (nm)" },
      { key: "nuObsRel", label: "nu_obs rel (THz)" },
      { key: "divergencePct", label: "NR error (%)" },
    ],
    getSnapshotRow() {
      const readouts = computeReadoutContext();
      return {
        case: "Snapshot",
        element: state.selectedElement,
        lambdaRestNm: formatNumber(readouts.lambdaRestNm, 3),
        nuRestTHz: formatNumber(readouts.nuRestTHz, 3),
        velocityKmS: formatSigned(state.velocityKmS, 2),
        zNonRel: formatNumber(readouts.zNonRel, 6),
        zRel: formatNumber(readouts.zRel, 6),
        lambdaObsNonRel: formatNumber(readouts.lambdaObsNonRel, 3),
        lambdaObsRel: formatNumber(readouts.lambdaObsRel, 3),
        nuObsRel: formatNumber(DopplerShiftModel.wavelengthNmToFrequencyTHz(readouts.lambdaObsRel), 3),
        divergencePct: formatNumber(readouts.regime.divergencePercent, 3),
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add preset comparison rows (1-8)",
        getRows() {
          const representative = representativeLine();
          const lambdaRestNm = representative?.wavelengthNm ?? NaN;
          const nuRestTHz = DopplerShiftModel.wavelengthNmToFrequencyTHz(lambdaRestNm);

          return PRESETS.map((preset) => {
            const coupled = preset.velocityKmS !== undefined
              ? syncPhysicalFromVelocity(preset.velocityKmS)
              : syncPhysicalFromRedshift(preset.z ?? 0);

            const lambdaObsNonRel = DopplerShiftModel.shiftedWavelengthNm({
              lambdaRestNm,
              velocityKmS: coupled.velocityKmS,
              relativistic: false,
            });
            const lambdaObsRel = DopplerShiftModel.shiftedWavelengthNm({
              lambdaRestNm,
              velocityKmS: coupled.velocityKmS,
              relativistic: true,
            });

            const zNonRel = DopplerShiftModel.redshiftFromVelocity({
              velocityKmS: coupled.velocityKmS,
              relativistic: false,
            });
            const zRel = DopplerShiftModel.redshiftFromVelocity({
              velocityKmS: coupled.velocityKmS,
              relativistic: true,
            });
            const divergencePct = DopplerShiftModel.formulaDivergencePercent(coupled.velocityKmS);

            return {
              case: `${preset.id}: ${preset.label}`,
              element: state.selectedElement,
              lambdaRestNm: formatNumber(lambdaRestNm, 3),
              nuRestTHz: formatNumber(nuRestTHz, 3),
              velocityKmS: formatSigned(coupled.velocityKmS, 2),
              zNonRel: formatNumber(zNonRel, 6),
              zRel: formatNumber(zRel, 6),
              lambdaObsNonRel: formatNumber(lambdaObsNonRel, 3),
              lambdaObsRel: formatNumber(lambdaObsRel, 3),
              nuObsRel: formatNumber(DopplerShiftModel.wavelengthNmToFrequencyTHz(lambdaObsRel), 3),
              divergencePct: formatNumber(divergencePct, 3),
            };
          });
        },
      },
    ],
  },
});

demoModes.bindButtons({ helpButton: helpBtn, stationButton: stationModeBtn });

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (isEditableTarget(event.target)) return;

  switch (event.key) {
    case "r": {
      event.preventDefault();
      const next = state.formulaMode === "non-relativistic" ? "relativistic" : "non-relativistic";
      setFormulaMode(next);
      break;
    }
    case "[": {
      event.preventDefault();
      state.activePresetId = "";
      setPhysicalVelocity(state.velocityKmS - 100);
      break;
    }
    case "]": {
      event.preventDefault();
      state.activePresetId = "";
      setPhysicalVelocity(state.velocityKmS + 100);
      break;
    }
    case "{": {
      event.preventDefault();
      state.activePresetId = "";
      setPhysicalVelocity(state.velocityKmS - 10_000);
      break;
    }
    case "}": {
      event.preventDefault();
      state.activePresetId = "";
      setPhysicalVelocity(state.velocityKmS + 10_000);
      break;
    }
    case "z": {
      event.preventDefault();
      state.activePresetId = "";
      setPhysicalRedshift(state.z - 0.1);
      break;
    }
    case "Z": {
      event.preventDefault();
      state.activePresetId = "";
      setPhysicalRedshift(state.z + 0.1);
      break;
    }
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8": {
      event.preventDefault();
      applyPresetById(event.key);
      break;
    }
    default:
      break;
  }
});

if (prefersReducedMotion) {
  stopWaveAnimation();
  setLiveRegionText(statusEl, "Reduced motion enabled; wave animation is static.");
} else {
  startWaveAnimation();
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
