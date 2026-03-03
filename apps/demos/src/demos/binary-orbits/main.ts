import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  setLiveRegionText,
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { BinaryOrbitModel } from "@cosmic/physics";
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
  evaluateInvariants,
  evaluatePredictionChoices,
  formatNumber,
  gradeRvInference,
  gradeInvariantSelection,
  isPredictionLocked,
  isRvChallengeLocked,
  logSliderToValue,
  orbitAutoScaleLogFactor,
  pixelsPerUnit,
  rvCacheKey,
  scalingCueForControl,
  selectDisplayModel,
  type BinaryModel,
  type EnergyScaleCue,
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
const viewOrbit = $<HTMLButtonElement>("#viewOrbit");
const viewRv = $<HTMLButtonElement>("#viewRv");
const viewEnergy = $<HTMLButtonElement>("#viewEnergy");
const autoScaleLog = $<HTMLInputElement>("#autoScaleLog");
const showOmega = $<HTMLInputElement>("#showOmega");

const scalingCue = $<HTMLParagraphElement>("#scalingCue");
const energyScalingCue = $<HTMLParagraphElement>("#energyScalingCue");

const predictPanel = $<HTMLDivElement>("#predictPanel");
const predictPeriod = $<HTMLSelectElement>("#predictPeriod");
const predictV1 = $<HTMLSelectElement>("#predictV1");
const predictA1 = $<HTMLSelectElement>("#predictA1");
const revealPrediction = $<HTMLButtonElement>("#revealPrediction");
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
const energyK1Value = $<HTMLSpanElement>("#energyK1Value");
const energyK2Value = $<HTMLSpanElement>("#energyK2Value");
const energyKTotalValue = $<HTMLSpanElement>("#energyKTotalValue");
const energyPotentialValue = $<HTMLSpanElement>("#energyPotentialValue");
const energyTotalValue = $<HTMLSpanElement>("#energyTotalValue");
const energyVirialValue = $<HTMLSpanElement>("#energyVirialValue");

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
const rvPanel = $<HTMLDivElement>("#rvPanel");
const rvCanvas = $<HTMLCanvasElement>("#rvCanvas");
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
const energyCtx = get2dContext(energyCanvas, "energy view");

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

type MotionMode = "normalized" | "physical";

const YEARS_PER_SECOND_PHYSICAL = 0.06;
const NORMALIZED_ORBIT_SECONDS = 20;
const DEFAULT_MASS_RATIO = 1;
const DEFAULT_SEPARATION_AU = 4;
const DEFAULT_INCLINATION_DEG = 60;

const prefersReducedMotion =
  typeof window !== "undefined"
  && typeof window.matchMedia !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cssVar(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (value.length === 0) throw new Error(`Missing required CSS variable: ${name}`);
  return value;
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
  scalingCue: ScalingCue | null;
  scalingCueActive: boolean;
  scalingCueTimeoutId: number | null;
  energyScalingCue: EnergyScaleCue | null;
  energyScalingCueActive: boolean;
  energyScalingCueTimeoutId: number | null;
  predictionPending: boolean;
  revealedModel: BinaryModel;
  lastPredictionOutcome: string;
  rvChallenge: {
    active: boolean;
    revealed: boolean;
    measuredK1KmPerS: number | null;
    measuredK2KmPerS: number | null;
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
  scalingCue: null,
  scalingCueActive: false,
  scalingCueTimeoutId: null,
  energyScalingCue: null,
  energyScalingCueActive: false,
  energyScalingCueTimeoutId: null,
  predictionPending: false,
  revealedModel: computeModel(DEFAULT_MASS_RATIO, DEFAULT_SEPARATION_AU, DEFAULT_INCLINATION_DEG),
  lastPredictionOutcome: "",
  rvChallenge: {
    active: false,
    revealed: false,
    measuredK1KmPerS: null,
    measuredK2KmPerS: null,
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

  const margin = { left: 44, right: 14, top: 16, bottom: 32 };
  const plotW = Math.max(1, w - margin.left - margin.right);
  const plotH = Math.max(1, h - margin.top - margin.bottom);

  const rvData = getOrBuildRvCurve(model);
  const { stateForRv, curve } = rvData;

  const yMaxKmS = Math.max(1, Math.abs(model.k1KmPerS), Math.abs(model.k2KmPerS)) * 1.2;

  const xFromPhase = (phase: number) => margin.left + (phase / (2 * Math.PI)) * plotW;
  const yFromVelocity = (velocityKmS: number) => margin.top + ((yMaxKmS - velocityKmS) / (2 * yMaxKmS)) * plotH;

  const yZero = yFromVelocity(0);

  rvCtx.strokeStyle = canvasTheme.border;
  rvCtx.lineWidth = 1.5;
  rvCtx.beginPath();
  rvCtx.moveTo(margin.left, yZero);
  rvCtx.lineTo(margin.left + plotW, yZero);
  rvCtx.stroke();

  rvCtx.beginPath();
  rvCtx.moveTo(margin.left, margin.top);
  rvCtx.lineTo(margin.left, margin.top + plotH);
  rvCtx.stroke();

  rvCtx.fillStyle = canvasTheme.muted;
  rvCtx.font = "12px var(--cp-font-ui)";
  rvCtx.fillText("0", margin.left - 12, yZero + 4);
  rvCtx.fillText(`+${formatNumber(yMaxKmS, 1)}`, margin.left - 36, margin.top + 10);
  rvCtx.fillText(`${formatNumber(-yMaxKmS, 1)}`, margin.left - 36, margin.top + plotH - 4);
  rvCtx.fillText("phase", margin.left + plotW - 32, margin.top + plotH + 20);

  rvCtx.strokeStyle = canvasTheme.body1;
  rvCtx.lineWidth = 2.2;
  rvCtx.beginPath();
  curve.forEach((sample, idx) => {
    const x = xFromPhase(sample.phaseRad);
    const y = yFromVelocity(sample.rv1KmPerS);
    if (idx === 0) rvCtx.moveTo(x, y);
    else rvCtx.lineTo(x, y);
  });
  rvCtx.stroke();

  rvCtx.strokeStyle = canvasTheme.body2;
  rvCtx.lineWidth = 2.2;
  rvCtx.beginPath();
  curve.forEach((sample, idx) => {
    const x = xFromPhase(sample.phaseRad);
    const y = yFromVelocity(sample.rv2KmPerS);
    if (idx === 0) rvCtx.moveTo(x, y);
    else rvCtx.lineTo(x, y);
  });
  rvCtx.stroke();

  const phaseWrapped = ((phaseRad % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
  const xPhase = xFromPhase(phaseWrapped);
  const phaseSample = BinaryOrbitModel.radialVelocityAtPhase({ state: stateForRv, phaseRad: phaseWrapped });

  rvCtx.strokeStyle = canvasTheme.accent;
  rvCtx.lineWidth = 1.5;
  rvCtx.beginPath();
  rvCtx.moveTo(xPhase, margin.top);
  rvCtx.lineTo(xPhase, margin.top + plotH);
  rvCtx.stroke();

  rvCtx.fillStyle = canvasTheme.body1;
  rvCtx.beginPath();
  rvCtx.arc(xPhase, yFromVelocity(phaseSample.rv1KmPerS), 3.5, 0, Math.PI * 2);
  rvCtx.fill();

  rvCtx.fillStyle = canvasTheme.body2;
  rvCtx.beginPath();
  rvCtx.arc(xPhase, yFromVelocity(phaseSample.rv2KmPerS), 3.5, 0, Math.PI * 2);
  rvCtx.fill();
}

function drawEnergyView(model: BinaryModel): void {
  const { width: w, height: h } = resizeCanvasToCssPixels(energyCanvas, energyCtx);
  energyCtx.clearRect(0, 0, w, h);

  const margin = { left: 60, right: 24, top: 20, bottom: 34 };
  const plotW = Math.max(1, w - margin.left - margin.right);
  const plotH = Math.max(1, h - margin.top - margin.bottom);
  const baselineY = margin.top + plotH;

  const breakdown = getOrBuildEnergyBreakdown(model);
  const bars = [
    { label: "K1", normalized: breakdown.normalized.kinetic1, color: canvasTheme.body1 },
    { label: "K2", normalized: breakdown.normalized.kinetic2, color: canvasTheme.body2 },
    { label: "K", normalized: breakdown.normalized.kineticTotal, color: canvasTheme.accent },
    { label: "|U|", normalized: breakdown.normalized.potentialMagnitude, color: canvasTheme.border },
  ];

  energyCtx.strokeStyle = canvasTheme.border;
  energyCtx.lineWidth = 1.25;
  energyCtx.beginPath();
  energyCtx.moveTo(margin.left, baselineY);
  energyCtx.lineTo(margin.left + plotW, baselineY);
  energyCtx.stroke();

  const slotW = plotW / bars.length;
  const barW = slotW * 0.58;
  bars.forEach((bar, idx) => {
    const barHeight = Math.max(2, bar.normalized * plotH);
    const x = margin.left + idx * slotW + (slotW - barW) / 2;
    const y = baselineY - barHeight;
    energyCtx.fillStyle = bar.color;
    energyCtx.fillRect(x, y, barW, barHeight);

    energyCtx.fillStyle = canvasTheme.muted;
    energyCtx.font = "12px var(--cp-font-ui)";
    energyCtx.textAlign = "center";
    energyCtx.fillText(bar.label, x + barW / 2, baselineY + 18);
  });

  const markerX = margin.left + plotW + 12;
  const markerY = baselineY - ((breakdown.normalized.totalEnergySigned + 1) * 0.5) * plotH;
  energyCtx.strokeStyle = canvasTheme.text;
  energyCtx.lineWidth = 1.5;
  energyCtx.beginPath();
  energyCtx.moveTo(markerX - 10, markerY);
  energyCtx.lineTo(markerX + 10, markerY);
  energyCtx.stroke();

  energyCtx.fillStyle = canvasTheme.text;
  energyCtx.font = "12px var(--cp-font-ui)";
  energyCtx.textAlign = "left";
  energyCtx.fillText("E", markerX + 12, markerY + 4);

  energyCtx.fillStyle = canvasTheme.muted;
  energyCtx.textAlign = "left";
  energyCtx.fillText("Decomposition in M_sun AU^2/yr^2", margin.left, margin.top - 4);
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

function updateRvChallengeUi(currentModel: BinaryModel): void {
  const challengeLocked = isRvChallengeLocked({
    active: state.rvChallenge.active,
    revealed: state.rvChallenge.revealed,
  });
  rvChallengePanel.hidden = !(state.rvChallenge.active || state.rvChallenge.revealed);
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
    rvChallengeFeedback.textContent = "Challenge active: click each RV curve to measure K1 and K2, then reveal.";
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

  const margin = { left: 44, right: 14, top: 16, bottom: 32 };
  const plotW = Math.max(1, w - margin.left - margin.right);
  const plotH = Math.max(1, h - margin.top - margin.bottom);
  const phase = clamp(((xPx - margin.left) / plotW) * 2 * Math.PI, 0, 2 * Math.PI);

  const rvData = getOrBuildRvCurve(model);
  const sample = BinaryOrbitModel.radialVelocityAtPhase({ state: rvData.stateForRv, phaseRad: phase });
  const yMaxKmS = Math.max(1, Math.abs(model.k1KmPerS), Math.abs(model.k2KmPerS)) * 1.2;
  const yFromVelocity = (velocityKmS: number) => margin.top + ((yMaxKmS - velocityKmS) / (2 * yMaxKmS)) * plotH;
  const dist1 = Math.abs(yPx - yFromVelocity(sample.rv1KmPerS));
  const dist2 = Math.abs(yPx - yFromVelocity(sample.rv2KmPerS));

  const preferK1 = dist1 <= dist2;
  if (preferK1) {
    if (state.rvChallenge.measuredK1KmPerS !== null && state.rvChallenge.measuredK2KmPerS === null) {
      state.rvChallenge.measuredK2KmPerS = Math.abs(model.k2KmPerS);
      setLiveRegionText(status, "Captured K2 from RV curve.");
    } else {
      state.rvChallenge.measuredK1KmPerS = Math.abs(model.k1KmPerS);
      setLiveRegionText(status, "Captured K1 from RV curve.");
    }
  } else if (state.rvChallenge.measuredK2KmPerS !== null && state.rvChallenge.measuredK1KmPerS === null) {
    state.rvChallenge.measuredK1KmPerS = Math.abs(model.k1KmPerS);
    setLiveRegionText(status, "Captured K1 from RV curve.");
  } else {
    state.rvChallenge.measuredK2KmPerS = Math.abs(model.k2KmPerS);
    setLiveRegionText(status, "Captured K2 from RV curve.");
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

function updateReadouts(controlModel: BinaryModel, displayModel: BinaryModel): void {
  massRatioValue.textContent = formatNumber(controlModel.massRatio, 3);
  separationValue.textContent = formatNumber(controlModel.separation, 2);
  inclinationValue.textContent = formatNumber(controlModel.inclinationDeg, 0);

  baryOffsetValue.textContent = formatNumber(displayModel.r1, 3);
  baryOffsetSecondaryValue.textContent = formatNumber(displayModel.r2, 3);
  speedPrimaryValue.textContent = formatNumber(displayModel.v1AuPerYr, 3);
  speedSecondaryValue.textContent = formatNumber(displayModel.v2AuPerYr, 3);
  periodValue.textContent = formatNumber(displayModel.periodYr, 3);
  periodSharedCue.textContent = "P1 = P2 (shared period)";

  omegaValue.textContent = formatNumber(displayModel.omegaRadPerYr, 3);
  momentumPrimaryValue.textContent = formatNumber(displayModel.p1SolarAuPerYr, 4);
  momentumSecondaryValue.textContent = formatNumber(displayModel.p2SolarAuPerYr, 4);

  const balanced = displayModel.momentumDifferenceSolarAuPerYr < 1e-9;
  momentumBadge.textContent = balanced
    ? "Net momentum vector = 0 in barycentric frame (equal and opposite momenta)."
    : "Momentum mismatch detected (check rounding/inputs).";
  momentumBadge.classList.toggle("is-balanced", balanced);

  k1Value.textContent = formatNumber(displayModel.k1KmPerS, 3);
  k2Value.textContent = formatNumber(displayModel.k2KmPerS, 3);
  energyK1Value.textContent = formatNumber(displayModel.kinetic1SolarAu2PerYr2, 3);
  energyK2Value.textContent = formatNumber(displayModel.kinetic2SolarAu2PerYr2, 3);
  energyKTotalValue.textContent = formatNumber(displayModel.kineticTotalSolarAu2PerYr2, 3);
  energyPotentialValue.textContent = formatNumber(displayModel.potentialSolarAu2PerYr2, 3);
  energyTotalValue.textContent = formatNumber(displayModel.totalEnergySolarAu2PerYr2, 3);
  energyVirialValue.textContent = formatNumber(displayModel.virialResidualSolarAu2PerYr2, 3);

  omegaReadout.hidden = !state.showOmega;
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
  const selectedIndex = state.view === "orbit" ? 0 : state.view === "rv" ? 1 : 2;
  const buttons = [viewOrbit, viewRv, viewEnergy];
  buttons.forEach((button, index) => {
    const selected = index === selectedIndex;
    button.setAttribute("aria-checked", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });

  orbitCanvas.hidden = state.view !== "orbit";
  rvPanel.hidden = state.view !== "rv";
  energyPanel.hidden = state.view !== "energy";
}

function renderAtPhase(phaseRad: number): void {
  state.phaseRad = phaseRad;
  const currentModel = getStageModel();
  const displayModel = selectDisplayModel({
    predictionPending: state.predictionPending,
    revealedModel: state.revealedModel,
    currentModel,
  });

  updateReadouts(currentModel, displayModel);
  updateScalingCue();
  updateViewControls();
  renderPredictionOutcome();
  updateRvChallengeUi(currentModel);

  if (state.view === "orbit") {
    drawOrbit(currentModel, phaseRad);
  } else if (state.view === "rv") {
    drawRadialVelocity(currentModel, phaseRad);
  } else {
    drawEnergyView(currentModel);
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

function beginPredictionGate(): void {
  state.predictionPending = true;
  predictPanel.hidden = false;
  predictionFeedback.textContent = "Make your predictions, then click reveal to update readouts.";
  clearPredictionOutcome();
}

function resolvePredictionGate(): void {
  const before = state.revealedModel;
  const after = getStageModel();
  const result = evaluatePredictionChoices({
    before,
    after,
    predicted: predictionChoicesFromInputs(),
  });

  const correctnessLabel = result.allCorrect ? "All predictions matched." : "Some predictions need revision.";
  const outcome = `${correctnessLabel} Actual changes: P ${result.actual.periodTrend}, v1 ${result.actual.v1Trend}, a1 ${result.actual.a1Trend}.`;
  predictionFeedback.textContent = outcome;

  state.revealedModel = after;
  state.predictionPending = false;
  state.lastPredictionOutcome = outcome;
  predictPanel.hidden = true;

  setLiveRegionText(status, correctnessLabel);
  renderStatic();
}

function startRvChallenge(): void {
  state.rvChallenge.active = true;
  state.rvChallenge.revealed = false;
  state.rvChallenge.measuredK1KmPerS = null;
  state.rvChallenge.measuredK2KmPerS = null;
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
  state.rvChallenge.inferredQ = null;
  state.rvChallenge.targetQ = null;
  state.rvChallenge.score = null;
  setLiveRegionText(status, "RV challenge ended.");
  renderStatic();
}

function handleMassRatioChange(): void {
  const currentModel = getStageModel();
  const changedSinceReveal = Math.abs(currentModel.massRatio - state.revealedModel.massRatio) > 1e-9;

  if (changedSinceReveal) {
    beginPredictionGate();
    setLiveRegionText(status, "Prediction checkpoint: choose trends, then reveal readouts.");
  }

  setScalingCue("massRatio");
  renderStatic();
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

state.revealedModel = getStageModel();
state.autoScaleLog = autoScaleLog.checked;

massRatioInput.addEventListener("input", handleMassRatioChange);

separationInput.addEventListener("input", () => {
  setScalingCue("separation");
  renderStatic();
});

inclinationInput.addEventListener("input", () => {
  renderStatic();
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

viewEnergy.addEventListener("click", () => {
  state.view = "energy";
  renderStatic();
});

bindButtonRadioGroup({
  buttons: [viewOrbit, viewRv, viewEnergy],
  getSelectedIndex: () => (state.view === "orbit" ? 0 : state.view === "rv" ? 1 : 2),
  setSelectedIndex: (index) => {
    state.view = index === 0 ? "orbit" : index === 1 ? "rv" : "energy";
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
  if (!state.predictionPending) return;
  resolvePredictionGate();
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
          "Energy view decomposes $K_1$, $K_2$, $K$, $U$, and $E$ in $M_{\\odot}\\,\\mathrm{AU}^2/\\mathrm{yr}^2$.",
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
      "Predict trend changes before reveal, then compare to readouts.",
      "Use invariants, energy decomposition, and RV amplitudes to explain why both periods match.",
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "massRatio", label: "$M_2/M_1$" },
      { key: "separationAu", label: "Separation $a$ (AU)" },
      { key: "inclinationDeg", label: "Inclination $i$ (deg)" },
      { key: "a1Au", label: "$a_1$ (AU)" },
      { key: "a2Au", label: "$a_2$ (AU)" },
      { key: "omegaRadPerYr", label: "$\\omega$ (rad/yr)" },
      { key: "v1AuPerYr", label: "$v_1$ (AU/yr)" },
      { key: "v2AuPerYr", label: "$v_2$ (AU/yr)" },
      { key: "k1KmPerS", label: "$K_1$ (km/s)" },
      { key: "k2KmPerS", label: "$K_2$ (km/s)" },
      { key: "totalEnergy", label: "$E$ ($M_{\\odot}$ AU$^2$/yr$^2$)" },
      { key: "momentumDelta", label: "$|M_1v_1-M_2v_2|$" },
      { key: "periodYr", label: "Period $P$ (yr)" },
    ],
    getSnapshotRow() {
      if (isPredictionLocked({ predictionPending: state.predictionPending })) {
        setLiveRegionText(status, "Reveal prediction before adding snapshot row.");
        return null;
      }
      if (isRvChallengeLocked({ active: state.rvChallenge.active, revealed: state.rvChallenge.revealed })) {
        setLiveRegionText(status, "Finish or reveal the RV challenge before adding snapshot row.");
        return null;
      }
      const model = selectDisplayModel({
        predictionPending: state.predictionPending,
        revealedModel: state.revealedModel,
        currentModel: getStageModel(),
      });
      return {
        case: "Snapshot",
        massRatio: formatNumber(model.massRatio, 3),
        separationAu: formatNumber(model.separation, 2),
        inclinationDeg: formatNumber(model.inclinationDeg, 0),
        a1Au: formatNumber(model.r1, 3),
        a2Au: formatNumber(model.r2, 3),
        omegaRadPerYr: formatNumber(model.omegaRadPerYr, 3),
        v1AuPerYr: formatNumber(model.v1AuPerYr, 3),
        v2AuPerYr: formatNumber(model.v2AuPerYr, 3),
        k1KmPerS: formatNumber(model.k1KmPerS, 3),
        k2KmPerS: formatNumber(model.k2KmPerS, 3),
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
            return {
              case: c.label,
              massRatio: formatNumber(model.massRatio, 3),
              separationAu: formatNumber(model.separation, 2),
              inclinationDeg: formatNumber(model.inclinationDeg, 0),
              a1Au: formatNumber(model.r1, 3),
              a2Au: formatNumber(model.r2, 3),
              omegaRadPerYr: formatNumber(model.omegaRadPerYr, 3),
              v1AuPerYr: formatNumber(model.v1AuPerYr, 3),
              v2AuPerYr: formatNumber(model.v2AuPerYr, 3),
              k1KmPerS: formatNumber(model.k1KmPerS, 3),
              k2KmPerS: formatNumber(model.k2KmPerS, 3),
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
  const model = selectDisplayModel({
    predictionPending: state.predictionPending,
    revealedModel: state.revealedModel,
    currentModel: getStageModel(),
  });
  const checks = evaluateInvariants(model);
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
      { name: "Kinetic energy K1 (M_sun AU^2/yr^2)", value: formatNumber(model.kinetic1SolarAu2PerYr2, 3) },
      { name: "Kinetic energy K2 (M_sun AU^2/yr^2)", value: formatNumber(model.kinetic2SolarAu2PerYr2, 3) },
      { name: "Total kinetic energy K (M_sun AU^2/yr^2)", value: formatNumber(model.kineticTotalSolarAu2PerYr2, 3) },
      { name: "Potential energy U (M_sun AU^2/yr^2)", value: formatNumber(model.potentialSolarAu2PerYr2, 3) },
      { name: "Total orbital energy E (M_sun AU^2/yr^2)", value: formatNumber(model.totalEnergySolarAu2PerYr2, 3) },
      { name: "Virial residual 2K+U (M_sun AU^2/yr^2)", value: formatNumber(model.virialResidualSolarAu2PerYr2, 3) },
      { name: "Orbital period P (yr)", value: formatNumber(model.periodYr, 3) },
    ],
    notes: [
      "Assumes circular, coplanar two-body motion with point masses in barycentric frame.",
      "Uses AU/yr/Msun teaching units with G = 4*pi^2, so P^2 = a^3/(M1+M2).",
      "RV amplitudes project with inclination through K = v sin(i).",
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
  if (isPredictionLocked({ predictionPending: state.predictionPending })) {
    setLiveRegionText(status, "Reveal prediction before copying results.");
    return;
  }
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
