import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  setLiveRegionText,
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { BinaryOrbitModel, DopplerShiftModel, SpectralLineModel } from "@cosmic/physics";
import {
  INCLINATION_MAX_DEG,
  INCLINATION_MIN_DEG,
  MASS_RATIO_MAX,
  MASS_RATIO_MIN,
  SEPARATION_MAX_AU,
  SEPARATION_MIN_AU,
  bodyPositions,
  bodyRadius,
  clamp,
  computeModel,
  energyScaleCueForControl,
  evaluateIntegrityChecks,
  evaluateInvariants,
  evaluatePredictionChoices,
  formatNumber,
  gradeRvInference,
  gradeInvariantSelection,
  isRvChallengeLocked,
  logSliderToValue,
  orbitAutoScaleLogFactor,
  pixelsPerUnit,
  rvCacheKey,
  scalingCueForControl,
  type BinaryModel,
  type EnergyScaleCue,
  type IntegrityCheck,
  type InvariantKey,
  type PredictionChoices,
  type ScalingCue,
  type StageView,
  type TrendDirection,
  valueToLogSlider,
} from "./logic";

const $ = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

const massRatioInput = $<HTMLInputElement>("#massRatio");
const massRatioValue = $<HTMLSpanElement>("#massRatioValue");
const separationInput = $<HTMLInputElement>("#separation");
const separationValue = $<HTMLSpanElement>("#separationValue");
const inclinationInput = $<HTMLInputElement>("#inclination");
const inclinationValue = $<HTMLSpanElement>("#inclinationValue");

const presetEqual = $<HTMLButtonElement>("#presetEqual");
const presetPlanet = $<HTMLButtonElement>("#presetPlanet");
const presetHalf = $<HTMLButtonElement>("#presetHalf");

const motionMode = $<HTMLSelectElement>("#motionMode");
const spectroscopySb2 = $<HTMLButtonElement>("#spectroscopySb2");
const spectroscopySb1 = $<HTMLButtonElement>("#spectroscopySb1");
const elementH = $<HTMLButtonElement>("#elementH");
const elementNa = $<HTMLButtonElement>("#elementNa");
const elementCa = $<HTMLButtonElement>("#elementCa");
const viewOrbit = $<HTMLButtonElement>("#viewOrbit");
const viewRv = $<HTMLButtonElement>("#viewRv");
const viewSpectrum = $<HTMLButtonElement>("#viewSpectrum");
const viewEnergy = $<HTMLButtonElement>("#viewEnergy");
const autoScaleLog = $<HTMLInputElement>("#autoScaleLog");
const showOmega = $<HTMLInputElement>("#showOmega");

const scalingCue = $<HTMLParagraphElement>("#scalingCue");
const energyScalingCue = $<HTMLParagraphElement>("#energyScalingCue");
const massRatioInsightTitle = $<HTMLDivElement>("#massRatioInsightTitle");
const massRatioInsightBody = $<HTMLParagraphElement>("#massRatioInsightBody");

const predictPanel = $<HTMLDivElement>("#predictPanel");
const startPrediction = $<HTMLButtonElement>("#startPrediction");
const predictPeriod = $<HTMLSelectElement>("#predictPeriod");
const predictV1 = $<HTMLSelectElement>("#predictV1");
const predictA1 = $<HTMLSelectElement>("#predictA1");
const revealPrediction = $<HTMLButtonElement>("#revealPrediction");
const predictionBaselineSummary = $<HTMLSpanElement>("#predictionBaselineSummary");
const predictionFeedback = $<HTMLParagraphElement>("#predictionFeedback");
const predictionOutcome = $<HTMLParagraphElement>("#predictionOutcome");

const rvChallengePanel = $<HTMLDivElement>("#rvChallengePanel");
const rvChallengeStart = $<HTMLButtonElement>("#rvChallengeStart");
const rvChallengeClear = $<HTMLButtonElement>("#rvChallengeClear");
const rvChallengeReveal = $<HTMLButtonElement>("#rvChallengeReveal");
const rvChallengeEnd = $<HTMLButtonElement>("#rvChallengeEnd");
const rvMeasuredK1Value = $<HTMLSpanElement>("#rvMeasuredK1Value");
const rvMeasuredK2Value = $<HTMLSpanElement>("#rvMeasuredK2Value");
const rvInferredQValue = $<HTMLSpanElement>("#rvInferredQValue");
const rvTargetQValue = $<HTMLSpanElement>("#rvTargetQValue");
const rvChallengeFeedback = $<HTMLParagraphElement>("#rvChallengeFeedback");
const rvChallengeLockHint = $<HTMLParagraphElement>("#rvChallengeLockHint");

const baryOffsetValue = $<HTMLSpanElement>("#baryOffsetValue");
const baryOffsetSecondaryValue = $<HTMLSpanElement>("#baryOffsetSecondaryValue");
const speedPrimaryValue = $<HTMLSpanElement>("#speedPrimaryValue");
const speedSecondaryValue = $<HTMLSpanElement>("#speedSecondaryValue");
const periodValue = $<HTMLSpanElement>("#periodValue");
const periodSharedCue = $<HTMLSpanElement>("#periodSharedCue");
const omegaReadout = $<HTMLDivElement>("#omegaReadout");
const omegaValue = $<HTMLSpanElement>("#omegaValue");
const momentumPrimaryValue = $<HTMLSpanElement>("#momentumPrimaryValue");
const momentumSecondaryValue = $<HTMLSpanElement>("#momentumSecondaryValue");
const momentumBadge = $<HTMLDivElement>("#momentumBadge");
const k1Value = $<HTMLSpanElement>("#k1Value");
const k2Value = $<HTMLSpanElement>("#k2Value");
const m1SiniValue = $<HTMLSpanElement>("#m1SiniValue");
const m2SiniValue = $<HTMLSpanElement>("#m2SiniValue");
const massFuncValue = $<HTMLSpanElement>("#massFuncValue");
const vsysValue = $<HTMLSpanElement>("#vsysValue");
const energyK1Value = $<HTMLSpanElement>("#energyK1Value");
const energyK2Value = $<HTMLSpanElement>("#energyK2Value");
const energyKTotalValue = $<HTMLSpanElement>("#energyKTotalValue");
const energyPotentialValue = $<HTMLSpanElement>("#energyPotentialValue");
const energyTotalValue = $<HTMLSpanElement>("#energyTotalValue");
const energyVirialValue = $<HTMLSpanElement>("#energyVirialValue");
const integritySumRow = $<HTMLDivElement>("#integritySumRow");
const integrityBaryRow = $<HTMLDivElement>("#integrityBaryRow");
const integrityRatioRow = $<HTMLDivElement>("#integrityRatioRow");
const integritySumValue = $<HTMLDivElement>("#integritySumValue");
const integrityBaryValue = $<HTMLDivElement>("#integrityBaryValue");
const integrityRatioValue = $<HTMLDivElement>("#integrityRatioValue");
const readoutA1 = $<HTMLDivElement>("#readoutA1");
const readoutA2 = $<HTMLDivElement>("#readoutA2");
const readoutV1 = $<HTMLDivElement>("#readoutV1");
const readoutV2 = $<HTMLDivElement>("#readoutV2");
const readoutK1 = $<HTMLDivElement>("#readoutK1");
const readoutK2 = $<HTMLDivElement>("#readoutK2");

const invariantSum = $<HTMLInputElement>("#invariantSum");
const invariantBary = $<HTMLInputElement>("#invariantBary");
const invariantSpeed = $<HTMLInputElement>("#invariantSpeed");
const invariantPeriod = $<HTMLInputElement>("#invariantPeriod");
const invariantEqualOffsets = $<HTMLInputElement>("#invariantEqualOffsets");
const invariantEqualRv = $<HTMLInputElement>("#invariantEqualRv");
const invariantLabelSum = $<HTMLLabelElement>("#invariantLabelSum");
const invariantLabelBary = $<HTMLLabelElement>("#invariantLabelBary");
const invariantLabelSpeed = $<HTMLLabelElement>("#invariantLabelSpeed");
const invariantLabelPeriod = $<HTMLLabelElement>("#invariantLabelPeriod");
const invariantLabelEqualOffsets = $<HTMLLabelElement>("#invariantLabelEqualOffsets");
const invariantLabelEqualRv = $<HTMLLabelElement>("#invariantLabelEqualRv");
const invariantCheck = $<HTMLButtonElement>("#invariantCheck");
const invariantFeedback = $<HTMLParagraphElement>("#invariantFeedback");

const orbitCanvas = $<HTMLCanvasElement>("#orbitCanvas");
const stagePrompt = $<HTMLParagraphElement>("#stagePrompt");
const rvPanel = $<HTMLDivElement>("#rvPanel");
const rvCanvas = $<HTMLCanvasElement>("#rvCanvas");
const spectrumPanel = $<HTMLDivElement>("#spectrumPanel");
const spectrumCanvas = $<HTMLCanvasElement>("#spectrumCanvas");
const energyPanel = $<HTMLDivElement>("#energyPanel");
const energyCanvas = $<HTMLCanvasElement>("#energyCanvas");

const stationModeButton = $<HTMLButtonElement>("#stationMode");
const helpButton = $<HTMLButtonElement>("#help");
const copyResults = $<HTMLButtonElement>("#copyResults");
const status = $<HTMLParagraphElement>("#status");

function get2dContext(canvas: HTMLCanvasElement, label: string): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(`Canvas 2D context unavailable for ${label}.`);
  return ctx;
}

const orbitCtx = get2dContext(orbitCanvas, "orbit view");
const rvCtx = get2dContext(rvCanvas, "RV view");
const spectrumCtx = get2dContext(spectrumCanvas, "spectrum view");
const energyCtx = get2dContext(energyCanvas, "energy view");

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

type MotionMode = "normalized" | "physical";
type SpectroscopyMode = "sb1" | "sb2";
type SpectrumElementKey = "H" | "Na" | "Ca";
type CurveMeasurementKey = "primary" | "secondary";

type SpectrumDomain = {
  minNm: number;
  maxNm: number;
};

type CurveMeasurement = {
  amplitudeKmPerS: number;
  phaseCycle: number;
  velocityKmPerS: number;
};

const YEARS_PER_SECOND_PHYSICAL = 0.06;
const NORMALIZED_ORBIT_SECONDS = 20;
const DEFAULT_MASS_RATIO = 1;
const DEFAULT_SEPARATION_AU = 4;
const DEFAULT_INCLINATION_DEG = 60;
const SPECTRUM_DOMAIN: SpectrumDomain = { minNm: 380, maxNm: 700 };
const RV_MEASUREMENT_DISTANCE_PX = 28;
const CONTROL_FLASH_MS = 1200;

const prefersReducedMotion =
  typeof window !== "undefined"
  && typeof window.matchMedia !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cssVar(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (value.length === 0) throw new Error(`Missing required CSS variable: ${name}`);
  return value;
}

function colorMix(primary: string, secondary: string, primaryFraction: number): string {
  const primaryPercent = Math.round(clamp(primaryFraction, 0, 1) * 100);
  return `color-mix(in srgb, ${primary} ${primaryPercent}%, ${secondary})`;
}

const canvasTheme = {
  glow: cssVar("--cp-glow-blue"),
  border: cssVar("--cp-border"),
  text: cssVar("--cp-text"),
  muted: cssVar("--cp-muted"),
  body1: cssVar("--cp-chart-1"),
  body2: cssVar("--cp-chart-2"),
  accent: cssVar("--cp-accent"),
};

const invariantInputs: Record<InvariantKey, HTMLInputElement> = {
  sum: invariantSum,
  barycenter: invariantBary,
  speedRatio: invariantSpeed,
  sharedPeriod: invariantPeriod,
  equalOffsetsAnyRatio: invariantEqualOffsets,
  equalRvAnyRatio: invariantEqualRv,
};

const invariantLabels: Record<InvariantKey, HTMLLabelElement> = {
  sum: invariantLabelSum,
  barycenter: invariantLabelBary,
  speedRatio: invariantLabelSpeed,
  sharedPeriod: invariantLabelPeriod,
  equalOffsetsAnyRatio: invariantLabelEqualOffsets,
  equalRvAnyRatio: invariantLabelEqualRv,
};

type BinaryOrbitState = ReturnType<typeof BinaryOrbitModel.circularState>;
type BinaryRvCurve = ReturnType<typeof BinaryOrbitModel.sampleRadialVelocityCurve>;
type BinaryEnergyBreakdown = ReturnType<typeof BinaryOrbitModel.energyBreakdownForState>;

type RvCacheEntry = {
  key: string;
  stateForRv: BinaryOrbitState;
  curve: BinaryRvCurve;
};

type EnergyCacheEntry = {
  key: string;
  breakdown: BinaryEnergyBreakdown;
};

const state: {
  view: StageView;
  autoScaleLog: boolean;
  showOmega: boolean;
  spectroscopyMode: SpectroscopyMode;
  selectedElement: SpectrumElementKey;
  scalingCue: ScalingCue | null;
  scalingCueActive: boolean;
  scalingCueTimeoutId: number | null;
  energyScalingCue: EnergyScaleCue | null;
  energyScalingCueActive: boolean;
  energyScalingCueTimeoutId: number | null;
  predictionBaseline: BinaryModel | null;
  lastPredictionOutcome: string;
  orbitFocusUntilMs: number;
  readoutFlashTimeoutId: number | null;
  rvChallenge: {
    active: boolean;
    revealed: boolean;
    measuredK1KmPerS: number | null;
    measuredK2KmPerS: number | null;
    primaryMeasurement: CurveMeasurement | null;
    secondaryMeasurement: CurveMeasurement | null;
    inferredQ: number | null;
    targetQ: number | null;
    score: ReturnType<typeof gradeRvInference> | null;
  };
  rvCache: RvCacheEntry | null;
  energyCache: EnergyCacheEntry | null;
  phaseRad: number;
} = {
  view: "orbit",
  autoScaleLog: true,
  showOmega: false,
  spectroscopyMode: "sb2",
  selectedElement: "H",
  scalingCue: null,
  scalingCueActive: false,
  scalingCueTimeoutId: null,
  energyScalingCue: null,
  energyScalingCueActive: false,
  energyScalingCueTimeoutId: null,
  predictionBaseline: null,
  lastPredictionOutcome: "",
  orbitFocusUntilMs: 0,
  readoutFlashTimeoutId: null,
  rvChallenge: {
    active: false,
    revealed: false,
    measuredK1KmPerS: null,
    measuredK2KmPerS: null,
    primaryMeasurement: null,
    secondaryMeasurement: null,
    inferredQ: null,
    targetQ: null,
    score: null,
  },
  rvCache: null,
  energyCache: null,
  phaseRad: 0,
};

function getMotionMode(): MotionMode {
  return motionMode.value === "physical" ? "physical" : "normalized";
}

function getStageModel(): BinaryModel {
  return computeModel(
    Number(massRatioInput.value),
    logSliderToValue(Number(separationInput.value), SEPARATION_MIN_AU, SEPARATION_MAX_AU),
    Number(inclinationInput.value),
  );
}

function rvChallengeStateLabel(): "inactive" | "active-hidden" | "revealed" {
  if (state.rvChallenge.active && !state.rvChallenge.revealed) return "active-hidden";
  if (state.rvChallenge.revealed) return "revealed";
  return "inactive";
}

function selectedElementLines() {
  const catalog = SpectralLineModel.elementLines({ element: state.selectedElement });
  return catalog.lines;
}

function wavelengthToFraction(wavelengthNm: number, domain: SpectrumDomain): number {
  return (wavelengthNm - domain.minNm) / (domain.maxNm - domain.minNm);
}

function spectrumTicks(domain: SpectrumDomain): number[] {
  const span = domain.maxNm - domain.minNm;
  const step = span <= 180 ? 40 : 50;
  const ticks: number[] = [];
  for (let tick = Math.ceil(domain.minNm / step) * step; tick < domain.maxNm; tick += step) {
    ticks.push(tick);
  }
  ticks.push(domain.maxNm);
  return ticks;
}

function currentTimeMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function stagePromptText(view: StageView): string {
  if (view === "orbit") {
    return "Use the barycenter and observer sightline to relate the true geometry to what an astronomer can project along the line of sight.";
  }
  if (view === "rv") {
    return state.rvChallenge.active && !state.rvChallenge.revealed
      ? "Challenge active: click near the highest or lowest points on each curve. Your largest |v_r| sample becomes the measured K."
      : "The RV plot shows the measurable line-of-sight velocity. Compare the projected amplitudes and read them directly from the graph.";
  }
  if (view === "spectrum") {
    return "The lab strip stays fixed while the observed strip wobbles with the same orbital phase. Switch between SB2 and SB1 to see how detectability changes.";
  }
  return "Read the sign of each energy term directly: kinetic energy is positive, gravitational binding energy is negative, and the virial balance keeps 2K + U near zero.";
}

function resizeCanvasToCssPixels(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): { width: number; height: number } {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const dpr = window.devicePixelRatio || 1;

  const nextWidth = Math.max(1, Math.round(width * dpr));
  const nextHeight = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function phaseFromElapsedSeconds(elapsedSec: number, model: BinaryModel): number {
  if (getMotionMode() === "normalized") {
    return (elapsedSec / NORMALIZED_ORBIT_SECONDS) * (2 * Math.PI);
  }
  const elapsedYears = elapsedSec * YEARS_PER_SECOND_PHYSICAL;
  return model.omegaRadPerYr * elapsedYears;
}

function drawOrbit(model: BinaryModel, phaseRad: number): void {
  const { width: w, height: h } = resizeCanvasToCssPixels(orbitCanvas, orbitCtx);
  const cx = w / 2;
  const cy = h / 2;

  orbitCtx.clearRect(0, 0, w, h);

  const glow = orbitCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
  glow.addColorStop(0, canvasTheme.glow);
  glow.addColorStop(1, "transparent");
  orbitCtx.fillStyle = glow;
  orbitCtx.fillRect(0, 0, w, h);

  const ppuBase = pixelsPerUnit(model.r1, model.r2, w, h);
  const ppu = state.autoScaleLog
    ? ppuBase * orbitAutoScaleLogFactor(model.separation, SEPARATION_MIN_AU, SEPARATION_MAX_AU)
    : ppuBase;
  const r1px = model.r1 * ppu;
  const r2px = model.r2 * ppu;

  orbitCtx.strokeStyle = canvasTheme.border;
  orbitCtx.lineWidth = 2;
  orbitCtx.beginPath();
  orbitCtx.arc(cx, cy, r1px, 0, Math.PI * 2);
  orbitCtx.stroke();
  orbitCtx.beginPath();
  orbitCtx.arc(cx, cy, r2px, 0, Math.PI * 2);
  orbitCtx.stroke();

  const { x1, y1, x2, y2 } = bodyPositions(cx, cy, r1px, r2px, phaseRad);

  orbitCtx.save();
  orbitCtx.setLineDash([7, 6]);
  orbitCtx.lineWidth = 1.4;
  orbitCtx.strokeStyle = colorMix(canvasTheme.text, canvasTheme.body1, 0.54);
  orbitCtx.beginPath();
  orbitCtx.moveTo(cx, cy);
  orbitCtx.lineTo(x1, y1);
  orbitCtx.stroke();
  orbitCtx.strokeStyle = colorMix(canvasTheme.text, canvasTheme.body2, 0.54);
  orbitCtx.beginPath();
  orbitCtx.moveTo(cx, cy);
  orbitCtx.lineTo(x2, y2);
  orbitCtx.stroke();
  orbitCtx.restore();

  orbitCtx.strokeStyle = canvasTheme.border;
  orbitCtx.lineWidth = 3;
  orbitCtx.beginPath();
  orbitCtx.moveTo(x1, y1);
  orbitCtx.lineTo(x2, y2);
  orbitCtx.stroke();

  orbitCtx.fillStyle = canvasTheme.text;
  orbitCtx.beginPath();
  orbitCtx.arc(cx, cy, 3, 0, Math.PI * 2);
  orbitCtx.fill();

  const emphasisRemaining = Math.max(0, state.orbitFocusUntilMs - currentTimeMs());
  if (emphasisRemaining > 0) {
    const pulseFraction = 1 - (emphasisRemaining / CONTROL_FLASH_MS);
    const pulseRadius = 10 + (pulseFraction * 26);
    orbitCtx.save();
    orbitCtx.strokeStyle = colorMix(canvasTheme.accent, canvasTheme.text, 0.72);
    orbitCtx.globalAlpha = 0.55 * (1 - pulseFraction);
    orbitCtx.lineWidth = 2.2;
    orbitCtx.beginPath();
    orbitCtx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    orbitCtx.stroke();
    orbitCtx.restore();
  }

  const base = Math.min(w, h) * 0.018;
  const radius1 = bodyRadius(model.m1, base);
  const radius2 = bodyRadius(model.m2, base);

  orbitCtx.fillStyle = canvasTheme.body1;
  orbitCtx.beginPath();
  orbitCtx.arc(x1, y1, radius1, 0, Math.PI * 2);
  orbitCtx.fill();

  orbitCtx.fillStyle = canvasTheme.body2;
  orbitCtx.beginPath();
  orbitCtx.arc(x2, y2, radius2, 0, Math.PI * 2);
  orbitCtx.fill();

  const midpoint = (ax: number, ay: number, bx: number, by: number) => ({
    x: ax + ((bx - ax) * 0.54),
    y: ay + ((by - ay) * 0.54),
  });
  const a1Label = midpoint(cx, cy, x1, y1);
  const a2Label = midpoint(cx, cy, x2, y2);
  orbitCtx.font = "12px var(--cp-font-sans, ui-sans-serif)";
  orbitCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.body1, 0.72);
  orbitCtx.fillText(`a1 = ${formatNumber(model.r1, 2)} AU`, a1Label.x - 42, a1Label.y - 6);
  orbitCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.body2, 0.74);
  orbitCtx.fillText(`a2 = ${formatNumber(model.r2, 2)} AU`, a2Label.x + 8, a2Label.y - 6);

  const sightlineInset = Math.min(w, h) * 0.12;
  const sightlineStartX = sightlineInset;
  const sightlineEndX = w - sightlineInset;
  const sightlineY = cy + Math.min(h * 0.24, 110);
  orbitCtx.save();
  orbitCtx.setLineDash([8, 6]);
  orbitCtx.strokeStyle = colorMix(canvasTheme.accent, canvasTheme.text, 0.65);
  orbitCtx.lineWidth = 1.6;
  orbitCtx.beginPath();
  orbitCtx.moveTo(sightlineStartX, sightlineY);
  orbitCtx.lineTo(sightlineEndX, sightlineY);
  orbitCtx.stroke();
  orbitCtx.restore();

  orbitCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.accent, 0.76);
  orbitCtx.beginPath();
  orbitCtx.moveTo(sightlineEndX, sightlineY);
  orbitCtx.lineTo(sightlineEndX - 12, sightlineY - 6);
  orbitCtx.lineTo(sightlineEndX - 12, sightlineY + 6);
  orbitCtx.closePath();
  orbitCtx.fill();

  orbitCtx.fillStyle = canvasTheme.text;
  orbitCtx.font = "13px var(--cp-font-sans, ui-sans-serif)";
  orbitCtx.fillText("observer line of sight", sightlineStartX, sightlineY - 10);
  orbitCtx.fillText(`i = ${formatNumber(model.inclinationDeg, 0)} deg`, sightlineStartX, sightlineY + 18);
  if (model.inclinationDeg <= 1) {
    orbitCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.body2, 0.72);
    orbitCtx.fillText("Face-on view: RV signal collapses toward zero.", sightlineStartX, sightlineY + 40);
  }
}

function getOrBuildRvCurve(model: BinaryModel): RvCacheEntry {
  const key = rvCacheKey(model, 180);
  if (state.rvCache && state.rvCache.key === key) return state.rvCache;

  const stateForRv = BinaryOrbitModel.circularState({
    primaryMassSolar: model.m1,
    secondaryMassSolar: model.m2,
    separationAu: model.separation,
    inclinationDeg: model.inclinationDeg,
  });
  const curve = BinaryOrbitModel.sampleRadialVelocityCurve({ state: stateForRv, sampleCount: 180 });

  state.rvCache = { key, stateForRv, curve };
  return state.rvCache;
}

function energyCacheKey(model: BinaryModel): string {
  return [model.m1, model.m2, model.separation]
    .map((value) => (Number.isFinite(value) ? value.toFixed(6) : "NaN"))
    .join("|");
}

function getOrBuildEnergyBreakdown(model: BinaryModel): BinaryEnergyBreakdown {
  const key = energyCacheKey(model);
  if (state.energyCache && state.energyCache.key === key) {
    return state.energyCache.breakdown;
  }

  const modelState = BinaryOrbitModel.circularState({
    primaryMassSolar: model.m1,
    secondaryMassSolar: model.m2,
    separationAu: model.separation,
    inclinationDeg: model.inclinationDeg,
  });
  const breakdown = BinaryOrbitModel.energyBreakdownForState(modelState);
  state.energyCache = { key, breakdown };
  return breakdown;
}

function drawRadialVelocity(model: BinaryModel, phaseRad: number): void {
  const { width: w, height: h } = resizeCanvasToCssPixels(rvCanvas, rvCtx);
  rvCtx.clearRect(0, 0, w, h);

  const margin = { left: 62, right: 28, top: 22, bottom: 42 };
  const plotW = Math.max(1, w - margin.left - margin.right);
  const plotH = Math.max(1, h - margin.top - margin.bottom);

  const rvData = getOrBuildRvCurve(model);
  const { stateForRv, curve } = rvData;

  const yMaxKmS = Math.max(1, Math.abs(model.k1KmPerS), Math.abs(model.k2KmPerS)) * 1.2;
  const xFromPhaseCycle = (phaseCycle: number) => margin.left + (phaseCycle / 2) * plotW;
  const yFromVelocity = (velocityKmS: number) => margin.top + ((yMaxKmS - velocityKmS) / (2 * yMaxKmS)) * plotH;

  const yZero = yFromVelocity(0);
  const velocityTicks = [-yMaxKmS, -yMaxKmS / 2, 0, yMaxKmS / 2, yMaxKmS];
  const phaseTicks = [0, 0.5, 1, 1.5, 2];

  rvCtx.strokeStyle = colorMix(canvasTheme.border, canvasTheme.text, 0.86);
  rvCtx.lineWidth = 1;
  velocityTicks.forEach((tick) => {
    const y = yFromVelocity(tick);
    rvCtx.beginPath();
    rvCtx.moveTo(margin.left, y);
    rvCtx.lineTo(margin.left + plotW, y);
    rvCtx.stroke();
  });
  phaseTicks.forEach((tick) => {
    const x = xFromPhaseCycle(tick);
    rvCtx.beginPath();
    rvCtx.moveTo(x, margin.top);
    rvCtx.lineTo(x, margin.top + plotH);
    rvCtx.stroke();
  });

  rvCtx.strokeStyle = canvasTheme.text;
  rvCtx.lineWidth = 1.6;
  rvCtx.beginPath();
  rvCtx.moveTo(margin.left, yZero);
  rvCtx.lineTo(margin.left + plotW, yZero);
  rvCtx.stroke();

  rvCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.muted, 0.82);
  rvCtx.font = "12px var(--cp-font-sans, ui-sans-serif)";
  velocityTicks.forEach((tick) => {
    const y = yFromVelocity(tick);
    rvCtx.fillText(`${tick > 0 ? "+" : ""}${formatNumber(tick, 1)}`, margin.left - 48, y + 4);
  });
  phaseTicks.forEach((tick) => {
    const x = xFromPhaseCycle(tick);
    const label = tick === 2 ? "2" : formatNumber(tick, 1).replace(".0", "");
    rvCtx.fillText(label, x - 8, margin.top + plotH + 20);
  });

  rvCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.body1, 0.68);
  rvCtx.fillText("receding", margin.left + 8, margin.top + 14);
  rvCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.body2, 0.72);
  rvCtx.fillText("approaching", margin.left + 8, margin.top + plotH - 8);
  rvCtx.fillStyle = canvasTheme.text;
  rvCtx.fillText("Orbital phase", margin.left + plotW - 78, margin.top + plotH + 20);
  rvCtx.save();
  rvCtx.translate(16, margin.top + plotH / 2);
  rvCtx.rotate(-Math.PI / 2);
  rvCtx.fillText("Radial velocity (km/s)", 0, 0);
  rvCtx.restore();

  const drawCurve = (target: CurveMeasurementKey, strokeStyle: string, dashed: boolean) => {
    rvCtx.save();
    rvCtx.strokeStyle = strokeStyle;
    rvCtx.lineWidth = 2.6;
    rvCtx.setLineDash(dashed ? [10, 8] : []);
    rvCtx.beginPath();
    [0, 1].forEach((cycleIndex) => {
      curve.forEach((sample, idx) => {
        const phaseCycle = cycleIndex + (sample.phaseRad / (2 * Math.PI));
        const x = xFromPhaseCycle(phaseCycle);
        const y = yFromVelocity(target === "primary" ? sample.rv1KmPerS : sample.rv2KmPerS);
        if (cycleIndex === 0 && idx === 0) rvCtx.moveTo(x, y);
        else rvCtx.lineTo(x, y);
      });
    });
    rvCtx.stroke();
    rvCtx.restore();
  };

  drawCurve("primary", canvasTheme.body1, false);
  drawCurve("secondary", canvasTheme.body2, true);

  const phaseCycle = (((phaseRad % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)) / (2 * Math.PI);
  const xPhase = xFromPhaseCycle(phaseCycle);
  const phaseSample = BinaryOrbitModel.radialVelocityAtPhase({ state: stateForRv, phaseRad: phaseCycle * 2 * Math.PI });

  rvCtx.save();
  rvCtx.setLineDash([6, 6]);
  rvCtx.strokeStyle = canvasTheme.accent;
  rvCtx.lineWidth = 1.4;
  rvCtx.beginPath();
  rvCtx.moveTo(xPhase, margin.top);
  rvCtx.lineTo(xPhase, margin.top + plotH);
  rvCtx.stroke();
  rvCtx.restore();

  rvCtx.fillStyle = canvasTheme.body1;
  rvCtx.beginPath();
  rvCtx.arc(xPhase, yFromVelocity(phaseSample.rv1KmPerS), 4.2, 0, Math.PI * 2);
  rvCtx.fill();

  rvCtx.fillStyle = canvasTheme.body2;
  rvCtx.beginPath();
  rvCtx.arc(xPhase, yFromVelocity(phaseSample.rv2KmPerS), 4.2, 0, Math.PI * 2);
  rvCtx.fill();

  const annotateAmplitude = (label: string, amplitudeKmPerS: number, strokeStyle: string, x: number) => {
    const yPeak = yFromVelocity(amplitudeKmPerS);
    rvCtx.strokeStyle = strokeStyle;
    rvCtx.lineWidth = 1.4;
    rvCtx.beginPath();
    rvCtx.moveTo(x, yZero);
    rvCtx.lineTo(x, yPeak);
    rvCtx.stroke();
    rvCtx.beginPath();
    rvCtx.moveTo(x - 6, yZero);
    rvCtx.lineTo(x + 6, yZero);
    rvCtx.moveTo(x - 6, yPeak);
    rvCtx.lineTo(x + 6, yPeak);
    rvCtx.stroke();
    rvCtx.fillStyle = strokeStyle;
    rvCtx.fillText(label, x + 10, yPeak + (amplitudeKmPerS > 0 ? -4 : 14));
  };

  annotateAmplitude("K1", model.k1KmPerS, canvasTheme.body1, margin.left + plotW * 0.88);
  annotateAmplitude("K2", model.k2KmPerS, canvasTheme.body2, margin.left + plotW * 0.95);

  const drawMeasurementMarker = (measurement: CurveMeasurement | null, strokeStyle: string, label: string) => {
    if (!measurement) return;
    rvCtx.save();
    rvCtx.strokeStyle = strokeStyle;
    rvCtx.fillStyle = strokeStyle;
    rvCtx.lineWidth = 2;
    rvCtx.beginPath();
    rvCtx.arc(
      xFromPhaseCycle(measurement.phaseCycle),
      yFromVelocity(measurement.velocityKmPerS),
      6,
      0,
      Math.PI * 2,
    );
    rvCtx.stroke();
    rvCtx.fillText(
      `${label} ${formatNumber(measurement.amplitudeKmPerS, 2)} km/s`,
      xFromPhaseCycle(measurement.phaseCycle) + 10,
      yFromVelocity(measurement.velocityKmPerS) - 10,
    );
    rvCtx.restore();
  };

  drawMeasurementMarker(state.rvChallenge.primaryMeasurement, canvasTheme.body1, "Measured K1");
  drawMeasurementMarker(state.rvChallenge.secondaryMeasurement, canvasTheme.body2, "Measured K2");
}

function drawEnergyView(model: BinaryModel): void {
  const { width: w, height: h } = resizeCanvasToCssPixels(energyCanvas, energyCtx);
  energyCtx.clearRect(0, 0, w, h);

  const margin = { left: 72, right: 24, top: 24, bottom: 44 };
  const plotW = Math.max(1, w - margin.left - margin.right);
  const plotH = Math.max(1, h - margin.top - margin.bottom);
  const breakdown = getOrBuildEnergyBreakdown(model);
  const maxMagnitude = Math.max(1e-6, breakdown.maxMagnitudeSolarAu2PerYr2);
  const baselineY = margin.top + (maxMagnitude / (2 * maxMagnitude)) * plotH;

  const bars = [
    { label: "K1", value: model.kinetic1SolarAu2PerYr2, color: canvasTheme.body1 },
    { label: "K2", value: model.kinetic2SolarAu2PerYr2, color: canvasTheme.body2 },
    { label: "K", value: model.kineticTotalSolarAu2PerYr2, color: canvasTheme.accent },
    { label: "U", value: model.potentialSolarAu2PerYr2, color: colorMix(canvasTheme.text, canvasTheme.body2, 0.58) },
    { label: "E", value: model.totalEnergySolarAu2PerYr2, color: colorMix(canvasTheme.text, canvasTheme.accent, 0.7) },
  ];

  const yFromEnergy = (value: number) => margin.top + ((maxMagnitude - value) / (2 * maxMagnitude)) * plotH;
  const ticks = [maxMagnitude, maxMagnitude / 2, 0, -maxMagnitude / 2, -maxMagnitude];

  energyCtx.strokeStyle = colorMix(canvasTheme.border, canvasTheme.text, 0.84);
  energyCtx.lineWidth = 1;
  ticks.forEach((tick) => {
    const y = yFromEnergy(tick);
    energyCtx.beginPath();
    energyCtx.moveTo(margin.left, y);
    energyCtx.lineTo(margin.left + plotW, y);
    energyCtx.stroke();
    energyCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.muted, 0.82);
    energyCtx.font = "12px var(--cp-font-sans, ui-sans-serif)";
    energyCtx.fillText(formatNumber(tick, 2), margin.left - 60, y + 4);
  });

  energyCtx.strokeStyle = canvasTheme.text;
  energyCtx.lineWidth = 1.5;
  energyCtx.beginPath();
  energyCtx.moveTo(margin.left, yFromEnergy(0));
  energyCtx.lineTo(margin.left + plotW, yFromEnergy(0));
  energyCtx.stroke();

  const slotW = plotW / bars.length;
  const barW = slotW * 0.58;
  bars.forEach((bar, idx) => {
    const x = margin.left + idx * slotW + (slotW - barW) / 2;
    const y = yFromEnergy(Math.max(0, bar.value));
    const zeroY = yFromEnergy(0);
    const endY = yFromEnergy(bar.value);
    energyCtx.fillStyle = bar.color;
    energyCtx.fillRect(x, Math.min(zeroY, endY), barW, Math.max(2, Math.abs(endY - zeroY)));

    energyCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.muted, 0.82);
    energyCtx.font = "12px var(--cp-font-sans, ui-sans-serif)";
    energyCtx.textAlign = "center";
    energyCtx.fillText(bar.label, x + barW / 2, yFromEnergy(-maxMagnitude) + plotH + 20);
    energyCtx.fillText(formatNumber(bar.value, 2), x + barW / 2, endY + (bar.value >= 0 ? -8 : 18));
  });

  energyCtx.textAlign = "left";
  energyCtx.fillStyle = canvasTheme.text;
  energyCtx.fillText("Signed orbital energy (M_sun AU^2/yr^2)", margin.left, margin.top - 6);

  const virialNearZero = Math.abs(model.virialResidualSolarAu2PerYr2) < maxMagnitude * 0.04;
  energyCtx.fillStyle = virialNearZero
    ? colorMix(canvasTheme.text, canvasTheme.accent, 0.74)
    : colorMix(canvasTheme.text, canvasTheme.body2, 0.72);
  energyCtx.fillText(
    `Virial check: 2K + U = ${formatNumber(model.virialResidualSolarAu2PerYr2, 3)}`,
    margin.left,
    h - 10,
  );
}

function drawSpectrum(model: BinaryModel, phaseRad: number): void {
  const { width: w, height: h } = resizeCanvasToCssPixels(spectrumCanvas, spectrumCtx);
  spectrumCtx.clearRect(0, 0, w, h);

  const margin = { left: 56, right: 24, top: 24, bottom: 36 };
  const plotW = Math.max(1, w - margin.left - margin.right);
  const stripHeight = Math.round((h - margin.top - margin.bottom - 34) * 0.28);
  const topY = margin.top + 18;
  const observedY = topY + stripHeight + 44;
  const lines = selectedElementLines();
  const domain = SPECTRUM_DOMAIN;
  const curveState = BinaryOrbitModel.circularState({
    primaryMassSolar: model.m1,
    secondaryMassSolar: model.m2,
    separationAu: model.separation,
    inclinationDeg: model.inclinationDeg,
  });
  const phaseWrapped = ((phaseRad % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
  const rvSample = BinaryOrbitModel.radialVelocityAtPhase({ state: curveState, phaseRad: phaseWrapped });
  const shiftedPrimary = DopplerShiftModel.shiftLines({ lines, velocityKmS: rvSample.rv1KmPerS, relativistic: false });
  const shiftedSecondary = DopplerShiftModel.shiftLines({ lines, velocityKmS: rvSample.rv2KmPerS, relativistic: false });

  const drawStripBackground = (y: number, label: string, accentColor: string) => {
    spectrumCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.glow, 0.18);
    spectrumCtx.fillRect(margin.left, y, plotW, stripHeight);
    spectrumCtx.strokeStyle = colorMix(canvasTheme.border, accentColor, 0.72);
    spectrumCtx.lineWidth = 1;
    spectrumCtx.strokeRect(margin.left, y, plotW, stripHeight);
    spectrumCtx.fillStyle = colorMix(canvasTheme.text, accentColor, 0.74);
    spectrumCtx.font = "12px var(--cp-font-sans, ui-sans-serif)";
    spectrumCtx.fillText(label, 10, y + stripHeight / 2 + 4);
  };

  drawStripBackground(topY, "Lab", canvasTheme.text);
  drawStripBackground(observedY, "Observed", canvasTheme.accent);

  const drawLineSet = (
    shiftedLines: Array<{ wavelengthNm: number; shiftedNm: number; relativeIntensity?: number; label?: string }>,
    y: number,
    strokeStyle: string,
    dashed: boolean,
  ) => {
    spectrumCtx.save();
    spectrumCtx.strokeStyle = strokeStyle;
    spectrumCtx.setLineDash(dashed ? [6, 5] : []);
    shiftedLines.forEach((line) => {
      if (line.shiftedNm < domain.minNm || line.shiftedNm > domain.maxNm) return;
      const x = margin.left + wavelengthToFraction(line.shiftedNm, domain) * plotW;
      spectrumCtx.lineWidth = 1.6 + ((line.relativeIntensity ?? 0.4) * 2.1);
      spectrumCtx.beginPath();
      spectrumCtx.moveTo(x, y + 3);
      spectrumCtx.lineTo(x, y + stripHeight - 3);
      spectrumCtx.stroke();
    });
    spectrumCtx.restore();
  };

  lines.forEach((line) => {
    if (line.wavelengthNm < domain.minNm || line.wavelengthNm > domain.maxNm) return;
    const x = margin.left + wavelengthToFraction(line.wavelengthNm, domain) * plotW;
    spectrumCtx.strokeStyle = colorMix(canvasTheme.text, canvasTheme.border, 0.86);
    spectrumCtx.lineWidth = 1.5 + ((line.relativeIntensity ?? 0.4) * 2.1);
    spectrumCtx.beginPath();
    spectrumCtx.moveTo(x, topY + 3);
    spectrumCtx.lineTo(x, topY + stripHeight - 3);
    spectrumCtx.stroke();
  });

  drawLineSet(shiftedPrimary, observedY, canvasTheme.body1, false);
  if (state.spectroscopyMode === "sb2") {
    drawLineSet(shiftedSecondary, observedY, canvasTheme.body2, true);
  }

  const representative = shiftedPrimary.find(
    (line) => line.wavelengthNm >= domain.minNm && line.wavelengthNm <= domain.maxNm
      && line.shiftedNm >= domain.minNm && line.shiftedNm <= domain.maxNm,
  );
  if (representative) {
    const restX = margin.left + wavelengthToFraction(representative.wavelengthNm, domain) * plotW;
    const obsX = margin.left + wavelengthToFraction(representative.shiftedNm, domain) * plotW;
    const arrowY = topY + stripHeight + 20;
    spectrumCtx.strokeStyle = canvasTheme.body1;
    spectrumCtx.fillStyle = canvasTheme.body1;
    spectrumCtx.lineWidth = 1.2;
    spectrumCtx.beginPath();
    spectrumCtx.moveTo(restX, arrowY);
    spectrumCtx.lineTo(obsX, arrowY);
    spectrumCtx.stroke();
    const dir = obsX >= restX ? 1 : -1;
    spectrumCtx.beginPath();
    spectrumCtx.moveTo(obsX, arrowY);
    spectrumCtx.lineTo(obsX - (7 * dir), arrowY - 4);
    spectrumCtx.lineTo(obsX - (7 * dir), arrowY + 4);
    spectrumCtx.closePath();
    spectrumCtx.fill();
    spectrumCtx.fillText(
      `Primary Delta lambda = ${formatNumber(representative.shiftedNm - representative.wavelengthNm, 3)} nm`,
      Math.min(restX, obsX) + 8,
      arrowY - 6,
    );
  }

  const ticks = spectrumTicks(domain);
  const axisY = observedY + stripHeight + 18;
  spectrumCtx.strokeStyle = colorMix(canvasTheme.border, canvasTheme.text, 0.84);
  spectrumCtx.lineWidth = 1;
  spectrumCtx.beginPath();
  spectrumCtx.moveTo(margin.left, axisY);
  spectrumCtx.lineTo(margin.left + plotW, axisY);
  spectrumCtx.stroke();
  spectrumCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.muted, 0.82);
  spectrumCtx.font = "11px var(--cp-font-sans, ui-sans-serif)";
  ticks.forEach((tick) => {
    const x = margin.left + wavelengthToFraction(tick, domain) * plotW;
    spectrumCtx.beginPath();
    spectrumCtx.moveTo(x, axisY - 4);
    spectrumCtx.lineTo(x, axisY + 4);
    spectrumCtx.stroke();
    spectrumCtx.fillText(`${Math.round(tick)}`, x - 10, axisY + 14);
  });
  spectrumCtx.fillText("Wavelength (nm)", margin.left + plotW - 82, axisY + 14);

  spectrumCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.body1, 0.72);
  spectrumCtx.fillText(`Primary RV = ${formatNumber(rvSample.rv1KmPerS, 2)} km/s`, margin.left, h - 10);
  if (state.spectroscopyMode === "sb2") {
    spectrumCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.body2, 0.72);
    spectrumCtx.fillText(`Secondary RV = ${formatNumber(rvSample.rv2KmPerS, 2)} km/s`, margin.left + 220, h - 10);
  } else {
    spectrumCtx.fillStyle = colorMix(canvasTheme.text, canvasTheme.muted, 0.8);
    spectrumCtx.fillText("SB1 mode: secondary lines hidden from the observed strip.", margin.left + 220, h - 10);
  }
}

function predictionChoicesFromInputs(): PredictionChoices {
  return {
    periodTrend: predictPeriod.value as TrendDirection,
    v1Trend: predictV1.value as TrendDirection,
    a1Trend: predictA1.value as TrendDirection,
  };
}

function renderPredictionOutcome(): void {
  predictionOutcome.textContent = state.lastPredictionOutcome;
}

function clearPredictionOutcome(): void {
  state.lastPredictionOutcome = "";
  renderPredictionOutcome();
}

function updatePredictionUi(model: BinaryModel): void {
  predictPanel.hidden = false;
  startPrediction.textContent = state.predictionBaseline ? "Recapture baseline" : "Capture current state";
  revealPrediction.disabled = state.predictionBaseline === null;
  if (!state.predictionBaseline) {
    predictionBaselineSummary.textContent = "No baseline captured yet.";
    return;
  }
  predictionBaselineSummary.textContent =
    `q = ${formatNumber(state.predictionBaseline.massRatio, 3)}, `
    + `a = ${formatNumber(state.predictionBaseline.separation, 2)} AU, `
    + `i = ${formatNumber(state.predictionBaseline.inclinationDeg, 0)} deg, `
    + `current q = ${formatNumber(model.massRatio, 3)}.`;
}

function updateMassRatioInsight(model: BinaryModel): void {
  const inverseMassRatio = model.massRatio > 0 ? 1 / model.massRatio : Number.POSITIVE_INFINITY;
  if (Math.abs(model.massRatio - 1) < 1e-3) {
    massRatioInsightTitle.textContent = "Equal masses keep the system balanced.";
    massRatioInsightBody.textContent =
      "At q = 1, both stars sit the same distance from the barycenter and share equal speeds and RV amplitudes.";
    return;
  }

  if (model.massRatio <= 0.01) {
    massRatioInsightTitle.textContent = "Planet-limit regime: the primary barely budges.";
    massRatioInsightBody.textContent =
      `The lighter companion is about ${formatNumber(inverseMassRatio, 0)}x farther and faster about the barycenter, so the host star's wobble becomes the observable.`;
    return;
  }

  massRatioInsightTitle.textContent = "Lighter body -> farther orbit, faster motion.";
  massRatioInsightBody.textContent =
    `Right now a2/a1 = ${formatNumber(model.r2 / model.r1, 2)} and K2/K1 = ${formatNumber(model.k2KmPerS / model.k1KmPerS, 2)}, `
    + `so the lower-mass companion sweeps the larger, faster orbit while both bodies keep one shared period.`;
}

function setIntegrityRow(args: {
  row: HTMLDivElement;
  value: HTMLDivElement;
  check: IntegrityCheck;
  formatter: (check: IntegrityCheck) => string;
}): void {
  args.row.classList.toggle("is-passed", args.check.passed);
  args.value.textContent = args.formatter(args.check);
}

function updateIntegrityPanel(model: BinaryModel): void {
  const [sumCheck, barycenterCheck, ratioCheck] = evaluateIntegrityChecks(model);
  setIntegrityRow({
    row: integritySumRow,
    value: integritySumValue,
    check: sumCheck,
    formatter: (check) => `${formatNumber(check.lhs, 3)} vs ${formatNumber(check.rhs, 3)} AU`,
  });
  setIntegrityRow({
    row: integrityBaryRow,
    value: integrityBaryValue,
    check: barycenterCheck,
    formatter: (check) => `${formatNumber(check.lhs, 3)} vs ${formatNumber(check.rhs, 3)} M_sun AU`,
  });
  setIntegrityRow({
    row: integrityRatioRow,
    value: integrityRatioValue,
    check: ratioCheck,
    formatter: (check) => `${formatNumber(check.lhs, 3)} vs ${formatNumber(check.rhs, 3)}`,
  });
}

function flashReadoutGroup(targets: HTMLElement[]): void {
  targets.forEach((target) => target.classList.add("is-live-changed"));
  if (state.readoutFlashTimeoutId !== null) {
    window.clearTimeout(state.readoutFlashTimeoutId);
  }
  state.readoutFlashTimeoutId = window.setTimeout(() => {
    targets.forEach((target) => target.classList.remove("is-live-changed"));
    state.readoutFlashTimeoutId = null;
  }, CONTROL_FLASH_MS);
}

function handleLiveControlChange(control: "massRatio" | "separation" | "inclination"): void {
  if (state.predictionBaseline) {
    predictionFeedback.textContent = "Baseline captured. The live model has updated; compare your prediction whenever you're ready.";
    clearPredictionOutcome();
  }
  if (control === "massRatio") {
    state.orbitFocusUntilMs = currentTimeMs() + CONTROL_FLASH_MS;
    flashReadoutGroup([readoutA1, readoutA2, readoutV1, readoutV2, readoutK1, readoutK2]);
    setScalingCue("massRatio");
  } else if (control === "separation") {
    setScalingCue("separation");
  }
  renderStatic();
}

function capturePredictionBaseline(): void {
  state.predictionBaseline = getStageModel();
  predictionFeedback.textContent =
    "Baseline captured. Change the controls, keep watching the live system, then compare your prediction.";
  clearPredictionOutcome();
  setLiveRegionText(status, "Prediction baseline captured.");
  renderStatic();
}

function comparePredictionAgainstCurrent(): void {
  if (!state.predictionBaseline) {
    predictionFeedback.textContent = "Capture a baseline first so the comparison has a before-state.";
    setLiveRegionText(status, "Capture a prediction baseline first.");
    return;
  }

  const result = evaluatePredictionChoices({
    before: state.predictionBaseline,
    after: getStageModel(),
    predicted: predictionChoicesFromInputs(),
  });

  const correctnessLabel = result.allCorrect ? "All predictions matched." : "Some predictions need revision.";
  const outcome = `${correctnessLabel} Actual changes: P ${result.actual.periodTrend}, v1 ${result.actual.v1Trend}, a1 ${result.actual.a1Trend}.`;
  predictionFeedback.textContent = outcome;
  state.lastPredictionOutcome = outcome;
  setLiveRegionText(status, correctnessLabel);
  renderStatic();
}

function updateRvChallengeUi(currentModel: BinaryModel): void {
  const challengeLocked = isRvChallengeLocked({
    active: state.rvChallenge.active,
    revealed: state.rvChallenge.revealed,
  });
  rvChallengePanel.hidden = false;
  rvChallengeStart.hidden = state.rvChallenge.active || state.rvChallenge.revealed;
  rvChallengeClear.disabled = !state.rvChallenge.active;
  rvChallengeReveal.disabled = !state.rvChallenge.active;
  rvChallengeEnd.hidden = !state.rvChallenge.active && !state.rvChallenge.revealed;
  rvChallengeLockHint.hidden = !challengeLocked;

  rvMeasuredK1Value.textContent = state.rvChallenge.measuredK1KmPerS === null
    ? "\u2014"
    : formatNumber(state.rvChallenge.measuredK1KmPerS, 3);
  rvMeasuredK2Value.textContent = state.rvChallenge.measuredK2KmPerS === null
    ? "\u2014"
    : formatNumber(state.rvChallenge.measuredK2KmPerS, 3);
  rvInferredQValue.textContent = state.rvChallenge.inferredQ === null
    ? "\u2014"
    : formatNumber(state.rvChallenge.inferredQ, 3);
  rvTargetQValue.textContent = state.rvChallenge.revealed && state.rvChallenge.targetQ !== null
    ? formatNumber(state.rvChallenge.targetQ, 3)
    : "hidden";

  if (!state.rvChallenge.active && !state.rvChallenge.revealed) {
    rvChallengeFeedback.textContent = "Start challenge to infer q from measured RV amplitudes.";
    return;
  }

  if (state.rvChallenge.active && !state.rvChallenge.revealed) {
    state.rvChallenge.targetQ = currentModel.massRatio;
    rvChallengeFeedback.textContent =
      "Challenge active: click near the highest or lowest point on each curve. The largest |v_r| sample on each curve becomes your measured K.";
    return;
  }

  if (state.rvChallenge.revealed && state.rvChallenge.score && state.rvChallenge.inferredQ !== null && state.rvChallenge.targetQ !== null) {
    rvChallengeFeedback.textContent =
      `Inferred q = ${formatNumber(state.rvChallenge.inferredQ, 3)} vs true q = ${formatNumber(state.rvChallenge.targetQ, 3)}; `
      + `absolute error ${formatNumber(state.rvChallenge.score.absoluteError, 3)}, `
      + `percent error ${formatNumber(state.rvChallenge.score.percentError, 2)}%.`;
  }
}

function captureRvAmplitudeFromCanvasClick(event: MouseEvent): void {
  if (!isRvChallengeLocked({ active: state.rvChallenge.active, revealed: state.rvChallenge.revealed })) return;
  if (state.view !== "rv") return;

  const model = getStageModel();
  const { width: w, height: h } = resizeCanvasToCssPixels(rvCanvas, rvCtx);
  const rect = rvCanvas.getBoundingClientRect();
  const xPx = event.clientX - rect.left;
  const yPx = event.clientY - rect.top;

  const margin = { left: 62, right: 28, top: 22, bottom: 42 };
  const plotW = Math.max(1, w - margin.left - margin.right);
  const plotH = Math.max(1, h - margin.top - margin.bottom);
  const phaseCycle = clamp(((xPx - margin.left) / plotW) * 2, 0, 2);
  const phase = phaseCycle * 2 * Math.PI;

  const rvData = getOrBuildRvCurve(model);
  const sample = BinaryOrbitModel.radialVelocityAtPhase({ state: rvData.stateForRv, phaseRad: phase });
  const yMaxKmS = Math.max(1, Math.abs(model.k1KmPerS), Math.abs(model.k2KmPerS)) * 1.2;
  const yFromVelocity = (velocityKmS: number) => margin.top + ((yMaxKmS - velocityKmS) / (2 * yMaxKmS)) * plotH;
  const velocityFromY = (pixelY: number) => {
    const clampedY = clamp(pixelY, margin.top, margin.top + plotH);
    const fraction = (clampedY - margin.top) / plotH;
    return yMaxKmS - (fraction * 2 * yMaxKmS);
  };
  const dist1 = Math.abs(yPx - yFromVelocity(sample.rv1KmPerS));
  const dist2 = Math.abs(yPx - yFromVelocity(sample.rv2KmPerS));

  const clickedVelocityKmPerS = velocityFromY(yPx);
  const target: CurveMeasurementKey = dist1 <= dist2 ? "primary" : "secondary";
  const targetDistance = target === "primary" ? dist1 : dist2;
  if (targetDistance > RV_MEASUREMENT_DISTANCE_PX) {
    setLiveRegionText(status, "Click closer to one of the RV curves to sample a velocity.");
    return;
  }

  const amplitudeKmPerS = Math.abs(clickedVelocityKmPerS);
  if (target === "primary") {
    if (state.rvChallenge.measuredK1KmPerS === null || amplitudeKmPerS >= state.rvChallenge.measuredK1KmPerS) {
      state.rvChallenge.measuredK1KmPerS = amplitudeKmPerS;
      state.rvChallenge.primaryMeasurement = {
        amplitudeKmPerS,
        phaseCycle,
        velocityKmPerS: clickedVelocityKmPerS,
      };
    }
    setLiveRegionText(status, `Sampled primary curve at |v_r| = ${formatNumber(amplitudeKmPerS, 2)} km/s.`);
  } else {
    if (state.rvChallenge.measuredK2KmPerS === null || amplitudeKmPerS >= state.rvChallenge.measuredK2KmPerS) {
      state.rvChallenge.measuredK2KmPerS = amplitudeKmPerS;
      state.rvChallenge.secondaryMeasurement = {
        amplitudeKmPerS,
        phaseCycle,
        velocityKmPerS: clickedVelocityKmPerS,
      };
    }
    setLiveRegionText(status, `Sampled secondary curve at |v_r| = ${formatNumber(amplitudeKmPerS, 2)} km/s.`);
  }

  if (
    state.rvChallenge.measuredK1KmPerS !== null
    && state.rvChallenge.measuredK2KmPerS !== null
  ) {
    const inferred = BinaryOrbitModel.inferMassRatioFromRvAmplitudes({
      k1KmPerS: state.rvChallenge.measuredK1KmPerS,
      k2KmPerS: state.rvChallenge.measuredK2KmPerS,
    });
    state.rvChallenge.inferredQ = inferred.valid ? inferred.massRatioEstimate : null;
  }

  renderStatic();
}

function bindButtonRadioGroup(args: {
  buttons: HTMLButtonElement[];
  getSelectedIndex: () => number;
  setSelectedIndex: (index: number) => void;
}): void {
  const { buttons, getSelectedIndex, setSelectedIndex } = args;
  const handleKeyDown = (event: KeyboardEvent) => {
    let nextIndex: number | null = null;
    const selectedIndex = getSelectedIndex();
    const maxIndex = buttons.length - 1;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = selectedIndex >= maxIndex ? 0 : selectedIndex + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = selectedIndex <= 0 ? maxIndex : selectedIndex - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = maxIndex;
        break;
      default:
        break;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    setSelectedIndex(nextIndex);
    buttons[nextIndex].focus();
  };
  for (const button of buttons) {
    button.addEventListener("keydown", handleKeyDown);
  }
}

function markInvariantTruths(model: BinaryModel): void {
  const checks = evaluateInvariants(model);
  const selectedKeys = checks
    .map((check) => check.key)
    .filter((key) => invariantInputs[key].checked);
  const grade = gradeInvariantSelection({ checks, selectedKeys });

  checks.forEach((check) => {
    const selected = invariantInputs[check.key].checked;
    invariantLabels[check.key].classList.toggle("is-true", check.mustBeTrue);
    invariantLabels[check.key].classList.toggle("is-false-selected", selected && !check.mustBeTrue);
  });

  const selectedCount = selectedKeys.length;
  if (grade.allTrueSelected && !grade.anyFalseSelected) {
    invariantFeedback.textContent = `Great: all ${grade.trueRequiredCount} must-hold statements selected with no distractors.`;
    return;
  }
  invariantFeedback.textContent = `${grade.trueSelectedCount}/${grade.trueRequiredCount} must-hold statements selected. ${grade.falseSelectedCount} distractor statement(s) selected. (${selectedCount} selected)`;
}

function updateReadouts(model: BinaryModel): void {
  const minimumMasses = BinaryOrbitModel.minimumMassesSolar({
    k1KmPerS: model.k1KmPerS,
    k2KmPerS: model.k2KmPerS,
    periodYr: model.periodYr,
  });
  const massFunction = BinaryOrbitModel.massFunctionSolar({
    k1KmPerS: model.k1KmPerS,
    periodYr: model.periodYr,
  });

  massRatioValue.textContent = formatNumber(model.massRatio, 3);
  separationValue.textContent = formatNumber(model.separation, 2);
  inclinationValue.textContent = formatNumber(model.inclinationDeg, 0);

  baryOffsetValue.textContent = formatNumber(model.r1, 3);
  baryOffsetSecondaryValue.textContent = formatNumber(model.r2, 3);
  speedPrimaryValue.textContent = formatNumber(model.v1AuPerYr, 3);
  speedSecondaryValue.textContent = formatNumber(model.v2AuPerYr, 3);
  periodValue.textContent = formatNumber(model.periodYr, 3);
  periodSharedCue.textContent = "P1 = P2 (shared period)";

  omegaValue.textContent = formatNumber(model.omegaRadPerYr, 3);
  momentumPrimaryValue.textContent = formatNumber(model.p1SolarAuPerYr, 4);
  momentumSecondaryValue.textContent = formatNumber(model.p2SolarAuPerYr, 4);

  const balanced = model.momentumDifferenceSolarAuPerYr < 1e-9;
  momentumBadge.textContent = balanced
    ? "Net momentum vector = 0 in barycentric frame (equal and opposite momenta)."
    : "Momentum mismatch detected (check rounding/inputs).";
  momentumBadge.classList.toggle("is-balanced", balanced);

  k1Value.textContent = formatNumber(model.k1KmPerS, 3);
  k2Value.textContent = formatNumber(model.k2KmPerS, 3);
  m1SiniValue.textContent = formatNumber(minimumMasses.primaryMinimumMassSolar, 3);
  m2SiniValue.textContent = formatNumber(minimumMasses.secondaryMinimumMassSolar, 3);
  massFuncValue.textContent = formatNumber(massFunction, 3);
  vsysValue.textContent = formatNumber(0, 1);
  energyK1Value.textContent = formatNumber(model.kinetic1SolarAu2PerYr2, 3);
  energyK2Value.textContent = formatNumber(model.kinetic2SolarAu2PerYr2, 3);
  energyKTotalValue.textContent = formatNumber(model.kineticTotalSolarAu2PerYr2, 3);
  energyPotentialValue.textContent = formatNumber(model.potentialSolarAu2PerYr2, 3);
  energyTotalValue.textContent = formatNumber(model.totalEnergySolarAu2PerYr2, 3);
  energyVirialValue.textContent = formatNumber(model.virialResidualSolarAu2PerYr2, 3);

  omegaReadout.hidden = !state.showOmega;
}

function updateStagePrompt(): void {
  stagePrompt.textContent = stagePromptText(state.view);
}

function updateSpectroscopyControls(): void {
  const spectroscopyButtons = [
    { button: spectroscopySb2, selected: state.spectroscopyMode === "sb2" },
    { button: spectroscopySb1, selected: state.spectroscopyMode === "sb1" },
  ];
  spectroscopyButtons.forEach(({ button, selected }) => {
    button.setAttribute("aria-checked", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });

  const elementButtons = [
    { button: elementH, selected: state.selectedElement === "H" },
    { button: elementNa, selected: state.selectedElement === "Na" },
    { button: elementCa, selected: state.selectedElement === "Ca" },
  ];
  elementButtons.forEach(({ button, selected }) => {
    button.setAttribute("aria-checked", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

function updateScalingCue(): void {
  if (!state.scalingCue) {
    scalingCue.textContent = "";
    scalingCue.classList.remove("is-active");
  } else {
    scalingCue.textContent = `${state.scalingCue.equation} — ${state.scalingCue.message}`;
    scalingCue.classList.toggle("is-active", state.scalingCueActive);
  }

  if (!state.energyScalingCue) {
    energyScalingCue.textContent = "";
    energyScalingCue.classList.remove("is-active");
    return;
  }
  energyScalingCue.textContent = `${state.energyScalingCue.equation} — ${state.energyScalingCue.message}`;
  energyScalingCue.classList.toggle("is-active", state.energyScalingCueActive);
}

function updateViewControls(): void {
  const selectedIndex =
    state.view === "orbit" ? 0 : state.view === "rv" ? 1 : state.view === "spectrum" ? 2 : 3;
  const buttons = [viewOrbit, viewRv, viewSpectrum, viewEnergy];
  buttons.forEach((button, index) => {
    const selected = index === selectedIndex;
    button.setAttribute("aria-checked", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });

  orbitCanvas.hidden = state.view !== "orbit";
  rvPanel.hidden = state.view !== "rv";
  spectrumPanel.hidden = state.view !== "spectrum";
  energyPanel.hidden = state.view !== "energy";
}

function renderAtPhase(phaseRad: number): void {
  state.phaseRad = phaseRad;
  const model = getStageModel();

  updateReadouts(model);
  updateMassRatioInsight(model);
  updateIntegrityPanel(model);
  updatePredictionUi(model);
  updateScalingCue();
  updateStagePrompt();
  updateSpectroscopyControls();
  updateViewControls();
  renderPredictionOutcome();
  updateRvChallengeUi(model);

  if (state.view === "orbit") {
    drawOrbit(model, phaseRad);
  } else if (state.view === "rv") {
    drawRadialVelocity(model, phaseRad);
  } else if (state.view === "spectrum") {
    drawSpectrum(model, phaseRad);
  } else {
    drawEnergyView(model);
  }
}

function renderStatic(): void {
  renderAtPhase(state.phaseRad);
}

function setScalingCue(control: "separation" | "massRatio"): void {
  state.scalingCue = scalingCueForControl(control);
  state.scalingCueActive = true;
  if (state.scalingCueTimeoutId !== null) {
    window.clearTimeout(state.scalingCueTimeoutId);
  }
  state.scalingCueTimeoutId = window.setTimeout(() => {
    state.scalingCueActive = false;
    renderStatic();
  }, 1200);

  state.energyScalingCue = energyScaleCueForControl(control);
  state.energyScalingCueActive = true;
  if (state.energyScalingCueTimeoutId !== null) {
    window.clearTimeout(state.energyScalingCueTimeoutId);
  }
  state.energyScalingCueTimeoutId = window.setTimeout(() => {
    state.energyScalingCueActive = false;
    renderStatic();
  }, 1200);
}

function startRvChallenge(): void {
  state.rvChallenge.active = true;
  state.rvChallenge.revealed = false;
  state.rvChallenge.measuredK1KmPerS = null;
  state.rvChallenge.measuredK2KmPerS = null;
  state.rvChallenge.primaryMeasurement = null;
  state.rvChallenge.secondaryMeasurement = null;
  state.rvChallenge.inferredQ = null;
  state.rvChallenge.targetQ = getStageModel().massRatio;
  state.rvChallenge.score = null;
  state.view = "rv";
  setLiveRegionText(status, "RV inference challenge started. Measure both amplitudes, then reveal.");
  renderStatic();
}

function clearRvMeasurements(): void {
  if (!state.rvChallenge.active) return;
  state.rvChallenge.measuredK1KmPerS = null;
  state.rvChallenge.measuredK2KmPerS = null;
  state.rvChallenge.primaryMeasurement = null;
  state.rvChallenge.secondaryMeasurement = null;
  state.rvChallenge.inferredQ = null;
  state.rvChallenge.score = null;
  setLiveRegionText(status, "Cleared RV amplitude measurements.");
  renderStatic();
}

function revealRvChallenge(): void {
  if (!state.rvChallenge.active) return;
  if (state.rvChallenge.measuredK1KmPerS === null || state.rvChallenge.measuredK2KmPerS === null) {
    setLiveRegionText(status, "Measure both RV amplitudes before reveal.");
    return;
  }

  const inferred = BinaryOrbitModel.inferMassRatioFromRvAmplitudes({
    k1KmPerS: state.rvChallenge.measuredK1KmPerS,
    k2KmPerS: state.rvChallenge.measuredK2KmPerS,
  });
  if (!inferred.valid) {
    setLiveRegionText(status, inferred.reason ?? "RV inference failed.");
    return;
  }

  const targetQ = getStageModel().massRatio;
  state.rvChallenge.targetQ = targetQ;
  state.rvChallenge.inferredQ = inferred.massRatioEstimate;
  state.rvChallenge.score = gradeRvInference({
    inferredQ: inferred.massRatioEstimate,
    trueQ: targetQ,
  });
  state.rvChallenge.revealed = true;
  setLiveRegionText(status, "RV challenge revealed. Compare inferred q with the model q.");
  renderStatic();
}

function endRvChallenge(): void {
  state.rvChallenge.active = false;
  state.rvChallenge.revealed = false;
  state.rvChallenge.measuredK1KmPerS = null;
  state.rvChallenge.measuredK2KmPerS = null;
  state.rvChallenge.primaryMeasurement = null;
  state.rvChallenge.secondaryMeasurement = null;
  state.rvChallenge.inferredQ = null;
  state.rvChallenge.targetQ = null;
  state.rvChallenge.score = null;
  setLiveRegionText(status, "RV challenge ended.");
  renderStatic();
}

function handleMassRatioChange(): void {
  handleLiveControlChange("massRatio");
}

function setMassRatio(value: number): void {
  const clamped = Math.min(MASS_RATIO_MAX, Math.max(MASS_RATIO_MIN, value));
  massRatioInput.value = formatNumber(clamped, 3);
  handleMassRatioChange();
}

massRatioInput.min = String(MASS_RATIO_MIN);
massRatioInput.max = String(MASS_RATIO_MAX);
massRatioInput.step = "0.001";
massRatioInput.value = formatNumber(DEFAULT_MASS_RATIO, 3);

separationInput.value = String(
  valueToLogSlider(DEFAULT_SEPARATION_AU, SEPARATION_MIN_AU, SEPARATION_MAX_AU),
);
inclinationInput.min = String(INCLINATION_MIN_DEG);
inclinationInput.max = String(INCLINATION_MAX_DEG);
inclinationInput.value = String(DEFAULT_INCLINATION_DEG);

state.autoScaleLog = autoScaleLog.checked;
predictionFeedback.textContent = "Capture a baseline before you change controls if you want to run a prediction check.";

massRatioInput.addEventListener("input", handleMassRatioChange);

separationInput.addEventListener("input", () => {
  handleLiveControlChange("separation");
});

inclinationInput.addEventListener("input", () => {
  handleLiveControlChange("inclination");
});

showOmega.addEventListener("change", () => {
  state.showOmega = showOmega.checked;
  renderStatic();
});

autoScaleLog.addEventListener("change", () => {
  state.autoScaleLog = autoScaleLog.checked;
  renderStatic();
  setLiveRegionText(
    status,
    state.autoScaleLog
      ? "Auto-scale enabled: orbit camera uses logarithmic visual scaling."
      : "Auto-scale disabled: orbit camera uses fixed visual scaling.",
  );
});

viewOrbit.addEventListener("click", () => {
  state.view = "orbit";
  renderStatic();
});

viewRv.addEventListener("click", () => {
  state.view = "rv";
  renderStatic();
});

viewSpectrum.addEventListener("click", () => {
  state.view = "spectrum";
  renderStatic();
});

viewEnergy.addEventListener("click", () => {
  state.view = "energy";
  renderStatic();
});

bindButtonRadioGroup({
  buttons: [viewOrbit, viewRv, viewSpectrum, viewEnergy],
  getSelectedIndex: () => (state.view === "orbit" ? 0 : state.view === "rv" ? 1 : state.view === "spectrum" ? 2 : 3),
  setSelectedIndex: (index) => {
    state.view = index === 0 ? "orbit" : index === 1 ? "rv" : index === 2 ? "spectrum" : "energy";
    renderStatic();
  },
});

spectroscopySb2.addEventListener("click", () => {
  state.spectroscopyMode = "sb2";
  renderStatic();
});

spectroscopySb1.addEventListener("click", () => {
  state.spectroscopyMode = "sb1";
  renderStatic();
});

bindButtonRadioGroup({
  buttons: [spectroscopySb2, spectroscopySb1],
  getSelectedIndex: () => (state.spectroscopyMode === "sb2" ? 0 : 1),
  setSelectedIndex: (index) => {
    state.spectroscopyMode = index === 0 ? "sb2" : "sb1";
    renderStatic();
  },
});

elementH.addEventListener("click", () => {
  state.selectedElement = "H";
  renderStatic();
});

elementNa.addEventListener("click", () => {
  state.selectedElement = "Na";
  renderStatic();
});

elementCa.addEventListener("click", () => {
  state.selectedElement = "Ca";
  renderStatic();
});

bindButtonRadioGroup({
  buttons: [elementH, elementNa, elementCa],
  getSelectedIndex: () => (state.selectedElement === "H" ? 0 : state.selectedElement === "Na" ? 1 : 2),
  setSelectedIndex: (index) => {
    state.selectedElement = index === 0 ? "H" : index === 1 ? "Na" : "Ca";
    renderStatic();
  },
});

motionMode.addEventListener("change", () => {
  renderStatic();
  const modeLabel =
    getMotionMode() === "normalized"
      ? "Normalized motion mode enabled."
      : "Physical Kepler motion mode enabled.";
  setLiveRegionText(status, modeLabel);
});

presetEqual.addEventListener("click", () => {
  setMassRatio(1);
});

presetPlanet.addEventListener("click", () => {
  setMassRatio(0.001);
});

presetHalf.addEventListener("click", () => {
  setMassRatio(0.5);
});

revealPrediction.addEventListener("click", () => {
  comparePredictionAgainstCurrent();
});

startPrediction.addEventListener("click", () => {
  capturePredictionBaseline();
});

rvChallengeStart.addEventListener("click", () => {
  startRvChallenge();
});

rvChallengeClear.addEventListener("click", () => {
  clearRvMeasurements();
});

rvChallengeReveal.addEventListener("click", () => {
  revealRvChallenge();
});

rvChallengeEnd.addEventListener("click", () => {
  endRvChallenge();
});

rvCanvas.addEventListener("click", (event) => {
  captureRvAmplitudeFromCanvasClick(event);
});

invariantCheck.addEventListener("click", () => {
  markInvariantTruths(getStageModel());
  setLiveRegionText(status, "Invariant checks highlighted.");
});

if (prefersReducedMotion) {
  renderStatic();
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => {
      renderStatic();
    });
    ro.observe(orbitCanvas);
    ro.observe(rvCanvas);
    ro.observe(spectrumCanvas);
    ro.observe(energyCanvas);
  } else {
    window.addEventListener("resize", () => {
      renderStatic();
    });
  }
} else {
  const start = performance.now();
  const frame = (now: number) => {
    const model = getStageModel();
    const elapsed = (now - start) / 1000;
    renderAtPhase(phaseFromElapsedSeconds(elapsed, model));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:binary-orbits:mode",
  url: new URL(window.location.href),
});

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
        ],
      },
      {
        heading: "Model",
        type: "bullets",
        items: [
          "This is a circular two-body model in teaching units (AU / yr / $M_{\\odot}$).",
          "Both bodies share one angular frequency $\\omega = 2\\pi/P$ and satisfy momentum balance $M_1v_1 = M_2v_2$.",
          "RV amplitudes project as $K = v\\sin i$, linking barycentric motion to spectroscopic observables.",
          "Spectrum view maps those RVs onto Doppler-shifted absorption lines for H, Na, and Ca in SB1 or SB2 mode.",
          "Energy view uses signed bars so you can compare positive kinetic terms against negative bound-energy terms directly.",
          "Period uses the Kepler teaching normalization: $P^2 = \\frac{a^3}{M_1 + M_2}$.",
        ],
      },
    ],
  },
  station: {
    title: "Station Mode: Binary Orbits",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Set a mass ratio, separation, and inclination.",
      "Optionally capture a baseline, predict trend changes, then compare against the live readouts.",
      "Use the stage tabs to compare the same system in orbit, RV, spectrum, and energy views.",
      "Use invariants, spectroscopy, and energy decomposition to explain why both periods match while observables change.",
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "massRatio", label: "$M_2/M_1$" },
      { key: "separationAu", label: "Separation $a$ (AU)" },
      { key: "inclinationDeg", label: "Inclination $i$ (deg)" },
      { key: "spectroscopyMode", label: "Mode" },
      { key: "element", label: "Element" },
      { key: "a1Au", label: "$a_1$ (AU)" },
      { key: "a2Au", label: "$a_2$ (AU)" },
      { key: "omegaRadPerYr", label: "$\\omega$ (rad/yr)" },
      { key: "v1AuPerYr", label: "$v_1$ (AU/yr)" },
      { key: "v2AuPerYr", label: "$v_2$ (AU/yr)" },
      { key: "k1KmPerS", label: "$K_1$ (km/s)" },
      { key: "k2KmPerS", label: "$K_2$ (km/s)" },
      { key: "massFunctionSolar", label: "$f(m)$ ($M_{\\odot}$)" },
      { key: "primaryMinimumMassSolar", label: "$M_1\\sin^3 i$" },
      { key: "secondaryMinimumMassSolar", label: "$M_2\\sin^3 i$" },
      { key: "totalEnergy", label: "$E$ ($M_{\\odot}$ AU$^2$/yr$^2$)" },
      { key: "momentumDelta", label: "$|M_1v_1-M_2v_2|$" },
      { key: "periodYr", label: "Period $P$ (yr)" },
    ],
    getSnapshotRow() {
      if (isRvChallengeLocked({ active: state.rvChallenge.active, revealed: state.rvChallenge.revealed })) {
        setLiveRegionText(status, "Finish or reveal the RV challenge before adding snapshot row.");
        return null;
      }
      const model = getStageModel();
      const minimumMasses = BinaryOrbitModel.minimumMassesSolar({
        k1KmPerS: model.k1KmPerS,
        k2KmPerS: model.k2KmPerS,
        periodYr: model.periodYr,
      });
      return {
        case: "Snapshot",
        massRatio: formatNumber(model.massRatio, 3),
        separationAu: formatNumber(model.separation, 2),
        inclinationDeg: formatNumber(model.inclinationDeg, 0),
        spectroscopyMode: state.spectroscopyMode.toUpperCase(),
        element: state.selectedElement,
        a1Au: formatNumber(model.r1, 3),
        a2Au: formatNumber(model.r2, 3),
        omegaRadPerYr: formatNumber(model.omegaRadPerYr, 3),
        v1AuPerYr: formatNumber(model.v1AuPerYr, 3),
        v2AuPerYr: formatNumber(model.v2AuPerYr, 3),
        k1KmPerS: formatNumber(model.k1KmPerS, 3),
        k2KmPerS: formatNumber(model.k2KmPerS, 3),
        massFunctionSolar: formatNumber(BinaryOrbitModel.massFunctionSolar({
          k1KmPerS: model.k1KmPerS,
          periodYr: model.periodYr,
        }), 3),
        primaryMinimumMassSolar: formatNumber(minimumMasses.primaryMinimumMassSolar, 3),
        secondaryMinimumMassSolar: formatNumber(minimumMasses.secondaryMinimumMassSolar, 3),
        totalEnergy: formatNumber(model.totalEnergySolarAu2PerYr2, 3),
        momentumDelta: formatNumber(model.momentumDifferenceSolarAuPerYr, 6),
        periodYr: formatNumber(model.periodYr, 3),
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add comparison set",
        getRows() {
          const cases = [
            { label: "Equal masses", massRatio: 1, separation: 4, inclinationDeg: 60 },
            { label: "Planet limit", massRatio: 0.001, separation: 4, inclinationDeg: 60 },
            { label: "Half ratio", massRatio: 0.5, separation: 4, inclinationDeg: 60 },
          ];

          return cases.map((c) => {
            const model = computeModel(c.massRatio, c.separation, c.inclinationDeg);
            const minimumMasses = BinaryOrbitModel.minimumMassesSolar({
              k1KmPerS: model.k1KmPerS,
              k2KmPerS: model.k2KmPerS,
              periodYr: model.periodYr,
            });
            return {
              case: c.label,
              massRatio: formatNumber(model.massRatio, 3),
              separationAu: formatNumber(model.separation, 2),
              inclinationDeg: formatNumber(model.inclinationDeg, 0),
              spectroscopyMode: "SB2",
              element: state.selectedElement,
              a1Au: formatNumber(model.r1, 3),
              a2Au: formatNumber(model.r2, 3),
              omegaRadPerYr: formatNumber(model.omegaRadPerYr, 3),
              v1AuPerYr: formatNumber(model.v1AuPerYr, 3),
              v2AuPerYr: formatNumber(model.v2AuPerYr, 3),
              k1KmPerS: formatNumber(model.k1KmPerS, 3),
              k2KmPerS: formatNumber(model.k2KmPerS, 3),
              massFunctionSolar: formatNumber(BinaryOrbitModel.massFunctionSolar({
                k1KmPerS: model.k1KmPerS,
                periodYr: model.periodYr,
              }), 3),
              primaryMinimumMassSolar: formatNumber(minimumMasses.primaryMinimumMassSolar, 3),
              secondaryMinimumMassSolar: formatNumber(minimumMasses.secondaryMinimumMassSolar, 3),
              totalEnergy: formatNumber(model.totalEnergySolarAu2PerYr2, 3),
              momentumDelta: formatNumber(model.momentumDifferenceSolarAuPerYr, 6),
              periodYr: formatNumber(model.periodYr, 3),
            };
          });
        },
      },
    ],
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> Use momentum balance and one observable ($K_1$ or $K_2$) to explain why period is shared but speeds differ.</p>",
  },
});

demoModes.bindButtons({
  helpButton,
  stationButton: stationModeButton,
});

function exportResults(): ExportPayloadV1 {
  const model = getStageModel();
  const checks = evaluateInvariants(model);
  const integrityChecks = evaluateIntegrityChecks(model);
  const minimumMasses = BinaryOrbitModel.minimumMassesSolar({
    k1KmPerS: model.k1KmPerS,
    k2KmPerS: model.k2KmPerS,
    periodYr: model.periodYr,
  });
  const massFunction = BinaryOrbitModel.massFunctionSolar({
    k1KmPerS: model.k1KmPerS,
    periodYr: model.periodYr,
  });
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Secondary mass ratio (M2/M1)", value: formatNumber(model.massRatio, 3) },
      { name: "Separation a (AU)", value: formatNumber(model.separation, 2) },
      { name: "Inclination i (deg)", value: formatNumber(model.inclinationDeg, 0) },
      {
        name: "Motion mode",
        value: getMotionMode() === "normalized" ? "normalized-20s-cycle" : "physical-kepler",
      },
      { name: "Auto-scale (log)", value: state.autoScaleLog ? "on" : "off" },
      { name: "View", value: state.view },
      { name: "Spectroscopy mode", value: state.spectroscopyMode },
      { name: "Spectrum element", value: state.selectedElement },
      { name: "RV challenge state", value: rvChallengeStateLabel() },
    ],
    readouts: [
      { name: "Barycenter offset from M1 (a1, AU)", value: formatNumber(model.r1, 3) },
      { name: "Barycenter offset from M2 (a2, AU)", value: formatNumber(model.r2, 3) },
      { name: "Angular frequency omega (rad/yr)", value: formatNumber(model.omegaRadPerYr, 3) },
      { name: "Orbital speed of M1 (AU/yr)", value: formatNumber(model.v1AuPerYr, 3) },
      { name: "Orbital speed of M2 (AU/yr)", value: formatNumber(model.v2AuPerYr, 3) },
      { name: "Momentum M1v1 (M_sun AU/yr)", value: formatNumber(model.p1SolarAuPerYr, 4) },
      { name: "Momentum M2v2 (M_sun AU/yr)", value: formatNumber(model.p2SolarAuPerYr, 4) },
      {
        name: "Momentum difference |M1v1 - M2v2| (M_sun AU/yr)",
        value: formatNumber(model.momentumDifferenceSolarAuPerYr, 6),
      },
      { name: "RV semi-amplitude K1 (km/s)", value: formatNumber(model.k1KmPerS, 3) },
      { name: "RV semi-amplitude K2 (km/s)", value: formatNumber(model.k2KmPerS, 3) },
      { name: "Primary minimum mass M1 sin^3(i) (M_sun)", value: formatNumber(minimumMasses.primaryMinimumMassSolar, 3) },
      { name: "Secondary minimum mass M2 sin^3(i) (M_sun)", value: formatNumber(minimumMasses.secondaryMinimumMassSolar, 3) },
      { name: "Mass function f(m) (M_sun)", value: formatNumber(massFunction, 3) },
      { name: "System velocity v_sys (km/s)", value: formatNumber(0, 1) },
      { name: "Kinetic energy K1 (M_sun AU^2/yr^2)", value: formatNumber(model.kinetic1SolarAu2PerYr2, 3) },
      { name: "Kinetic energy K2 (M_sun AU^2/yr^2)", value: formatNumber(model.kinetic2SolarAu2PerYr2, 3) },
      { name: "Total kinetic energy K (M_sun AU^2/yr^2)", value: formatNumber(model.kineticTotalSolarAu2PerYr2, 3) },
      { name: "Potential energy U (M_sun AU^2/yr^2)", value: formatNumber(model.potentialSolarAu2PerYr2, 3) },
      { name: "Total orbital energy E (M_sun AU^2/yr^2)", value: formatNumber(model.totalEnergySolarAu2PerYr2, 3) },
      { name: "Virial residual 2K+U (M_sun AU^2/yr^2)", value: formatNumber(model.virialResidualSolarAu2PerYr2, 3) },
      { name: "Orbital period P (yr)", value: formatNumber(model.periodYr, 3) },
      {
        name: "Integrity check a1 + a2 vs a",
        value: `${formatNumber(integrityChecks[0].lhs, 3)} vs ${formatNumber(integrityChecks[0].rhs, 3)}`,
      },
      {
        name: "Integrity check M1 a1 vs M2 a2",
        value: `${formatNumber(integrityChecks[1].lhs, 3)} vs ${formatNumber(integrityChecks[1].rhs, 3)}`,
      },
      {
        name: "Integrity check K1 / K2 vs q",
        value: `${formatNumber(integrityChecks[2].lhs, 3)} vs ${formatNumber(integrityChecks[2].rhs, 3)}`,
      },
    ],
    notes: [
      "Assumes circular, coplanar two-body motion with point masses in barycentric frame.",
      "Uses AU/yr/Msun teaching units with G = 4*pi^2, so P^2 = a^3/(M1+M2).",
      "RV amplitudes project with inclination through K = v sin(i).",
      `Spectrum mode: ${state.spectroscopyMode.toUpperCase()} using ${state.selectedElement} absorption lines in a shared ${SPECTRUM_DOMAIN.minNm}-${SPECTRUM_DOMAIN.maxNm} nm window.`,
      `RV challenge inferred q: ${state.rvChallenge.inferredQ === null ? "n/a" : formatNumber(state.rvChallenge.inferredQ, 3)}, `
        + `target q: ${state.rvChallenge.targetQ === null ? "n/a" : formatNumber(state.rvChallenge.targetQ, 3)}.`,
      `Invariant truth flags: ${checks.map((check) => `${check.statement}:${check.isTrue ? "true" : "false"}`).join(", ")}`,
    ],
  };
}

(window as Window & { __cp?: unknown }).__cp = {
  slug: "binary-orbits",
  mode: runtime.mode,
  exportResults,
};

copyResults.addEventListener("click", () => {
  if (isRvChallengeLocked({ active: state.rvChallenge.active, revealed: state.rvChallenge.revealed })) {
    setLiveRegionText(status, "Finish or reveal the RV challenge before copying results.");
    return;
  }
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults())
    .then(() => {
      setLiveRegionText(status, "Copied results to clipboard.");
    })
    .catch((err) => {
      setLiveRegionText(
        status,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.",
      );
    });
});

initMath(document);

const demoRoot = document.querySelector<HTMLElement>("#cp-demo");
if (demoRoot) initPopovers(demoRoot);
