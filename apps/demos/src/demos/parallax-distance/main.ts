import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  initTabs,
  setLiveRegionText
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { ParallaxDistanceModel } from "@cosmic/physics";
import { nearbyStars } from "@cosmic/data-astr101";
import { setMathText } from "../../shared/mathText";
import {
  addVec2,
  applyAxisNoiseToOffset,
  clamp,
  computeCaptureInference,
  deterministicAxisNoiseMas,
  detectorTrueOffsetMasFromPosition,
  detectorTrueOffsetMasFromPhase,
  dotVec2,
  errorRadiusPx,
  formatNumber,
  normalizePhaseDeg,
  offsetPx,
  parallaxArcsecFromMas,
  phaseSeparationDeg,
  scaleVec2,
  type Basis2D,
  type CaptureInference,
  type Vec2
} from "./logic";

function requireEl<T extends Element>(element: T | null, name: string): T {
  if (!element) {
    throw new Error(`Missing required element: ${name}`);
  }
  return element;
}

type DetectorMode = "overlay" | "difference";

type CaptureEpoch = "A" | "B";

type Capture = {
  phaseDeg: number;
  earthPosAU: Vec2;
  detectorTrueMas: Vec2;
  detectorMeasMas: Vec2;
  epochLabel: CaptureEpoch;
};

type DemoState = {
  distancePc: number;
  sigmaMas: number;
  exaggerationVisual: number;
  showBaseline: boolean;
  detectorMode: DetectorMode;
  blinkMode: boolean;
  isPlaying: boolean;
  orbitPhaseDegNow: number;
  captureA: Capture | null;
  captureB: Capture | null;
  starDirHat: Vec2;
  axisHat: Vec2;
};

type Snapshot = {
  distancePcTrue: number;
  distanceLyTrue: number;
  parallaxMasTrue: number;
  parallaxArcsecTrue: number;
  nowPhaseDeg: number;
  nowEarthPosAu: Vec2;
  nowDetectorTrueMas: Vec2;
  inference: CaptureInference;
  distancePcHat: number | null;
  distanceLyHat: number | null;
  parallaxMasHat: number | null;
  parallaxArcsecHat: number | null;
};

const DISTANCE_PC_MIN = 1;
const DISTANCE_PC_MAX = 5000;
const SIGMA_MAS_MIN = 0.1;
const SIGMA_MAS_MAX = 20;
const EXAGGERATION_MIN = 1;
const EXAGGERATION_MAX = 40;
const MIN_EFFECTIVE_BASELINE_AU = 0.2;

// The orbit view is a schematic: the star is drawn 2 AU from the Sun, behind a "not to
// scale" break; at 10 pc it is really about 2 million AU away.
const ORBIT_CENTER = { x: 280, y: 262 };
const ORBIT_RADIUS_PX = 110;
const STAR_DISTANCE_PX = 222;
const AXIS_HALF_LEN_PX = 130;
const EARTH_LABEL_OFFSET_PX = 24;
// Two Earth markers closer than this (in degrees of orbit) share one label position.
const LABEL_MERGE_DEG = 16;
const AU_PER_PC = 648000 / Math.PI;

const DETECTOR_CENTER = { x: 280, y: 210 };
const DETECTOR_AXIS_HALF_LEN_PX = 208;
const DETECTOR_PX_PER_MAS = 0.012;
const DETECTOR_RANGE_PX = 182;
const DETECTOR_TICK_HALF_PX = 6;
const DETECTOR_TICK_LABEL_DY = 24;
const DETECTOR_CAPTURE_LABEL_DY = -14;
// 26 units above the capture labels: enough for the 22-unit phone font's text boxes.
const DETECTOR_NOW_LABEL_DY = -40;
// Capture labels closer than this along the axis are pushed apart.
const DETECTOR_LABEL_MIN_GAP_PX = 18;

const ORBIT_RATE_DEG_PER_SEC = 14;
const BLINK_INTERVAL_MS = 420;

const SCATTER_TEMPLATES: Array<{ angleDeg: number; radiusScale: number }> = [
  { angleDeg: 18, radiusScale: 0.35 },
  { angleDeg: 56, radiusScale: 0.62 },
  { angleDeg: 102, radiusScale: 0.78 },
  { angleDeg: 148, radiusScale: 0.94 },
  { angleDeg: 206, radiusScale: 0.58 },
  { angleDeg: 252, radiusScale: 0.86 },
  { angleDeg: 298, radiusScale: 0.44 },
  { angleDeg: 332, radiusScale: 0.72 }
];

const SVG_NS = "http://www.w3.org/2000/svg";

function prefersReducedMotionEnabled(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Geometry lives in an ecliptic frame in AU with y up and toward the star. screenDir()
// flips y for SVG, which is what makes Earth run counter-clockwise (the view from
// ecliptic north) and puts the star at the top. The parallax axis is the star direction
// turned 90 degrees clockwise -- screen-right -- so a positive offset or signed shift
// reads rightward. (logic.ts's buildParallaxBasis turns it the other way; it is unused here.)
const basis: Basis2D = { starDirHat: { x: 0, y: 1 }, axisHat: { x: 1, y: 0 } };

const state: DemoState = {
  distancePc: 10,
  sigmaMas: 1,
  exaggerationVisual: 15,
  showBaseline: true,
  detectorMode: "overlay",
  blinkMode: false,
  isPlaying: !prefersReducedMotionEnabled(),
  orbitPhaseDegNow: 0,
  captureA: null,
  captureB: null,
  starDirHat: basis.starDirHat,
  axisHat: basis.axisHat
};

let orbitFrame: number | null = null;
let orbitLastMs: number | null = null;
let blinkTimer: number | null = null;
let blinkShowA = true;

const starPreset = requireEl(
  document.querySelector<HTMLSelectElement>("#starPreset"),
  "#starPreset"
);
const distancePcInput = requireEl(
  document.querySelector<HTMLInputElement>("#distancePcInput"),
  "#distancePcInput"
);
const distanceLyInput = requireEl(
  document.querySelector<HTMLInputElement>("#distanceLyInput"),
  "#distanceLyInput"
);
const distancePcRange = requireEl(
  document.querySelector<HTMLInputElement>("#distancePcRange"),
  "#distancePcRange"
);
const distancePcValue = requireEl(
  document.querySelector<HTMLElement>("#distancePcValue"),
  "#distancePcValue"
);

const playPauseOrbit = requireEl(
  document.querySelector<HTMLButtonElement>("#playPauseOrbit"),
  "#playPauseOrbit"
);
const captureEpochAButton = requireEl(
  document.querySelector<HTMLButtonElement>("#captureEpochA"),
  "#captureEpochA"
);
const captureEpochBButton = requireEl(
  document.querySelector<HTMLButtonElement>("#captureEpochB"),
  "#captureEpochB"
);
const swapCapturesButton = requireEl(
  document.querySelector<HTMLButtonElement>("#swapCaptures"),
  "#swapCaptures"
);
const clearCapturesButton = requireEl(
  document.querySelector<HTMLButtonElement>("#clearCaptures"),
  "#clearCaptures"
);
const orbitPhaseScrub = requireEl(
  document.querySelector<HTMLInputElement>("#orbitPhaseScrub"),
  "#orbitPhaseScrub"
);
const orbitPhaseValue = requireEl(
  document.querySelector<HTMLElement>("#orbitPhaseValue"),
  "#orbitPhaseValue"
);
const captureSummary = requireEl(
  document.querySelector<HTMLElement>("#captureSummary"),
  "#captureSummary"
);

const stepSetDistance = requireEl(
  document.querySelector<HTMLElement>("#stepSetDistance"),
  "#stepSetDistance"
);
const stepCaptureA = requireEl(
  document.querySelector<HTMLElement>("#stepCaptureA"),
  "#stepCaptureA"
);
const stepCaptureB = requireEl(
  document.querySelector<HTMLElement>("#stepCaptureB"),
  "#stepCaptureB"
);

const showBaseline = requireEl(
  document.querySelector<HTMLInputElement>("#showBaseline"),
  "#showBaseline"
);

const detectorModeOverlay = requireEl(
  document.querySelector<HTMLButtonElement>("#detectorModeOverlay"),
  "#detectorModeOverlay"
);
const detectorModeDifference = requireEl(
  document.querySelector<HTMLButtonElement>("#detectorModeDifference"),
  "#detectorModeDifference"
);
const blinkMode = requireEl(
  document.querySelector<HTMLInputElement>("#blinkMode"),
  "#blinkMode"
);

const sigmaMas = requireEl(
  document.querySelector<HTMLInputElement>("#sigmaMas"),
  "#sigmaMas"
);
const sigmaMasValue = requireEl(
  document.querySelector<HTMLElement>("#sigmaMasValue"),
  "#sigmaMasValue"
);

const exaggeration = requireEl(
  document.querySelector<HTMLInputElement>("#exaggeration"),
  "#exaggeration"
);
const exaggerationValue = requireEl(
  document.querySelector<HTMLElement>("#exaggerationValue"),
  "#exaggerationValue"
);

const stationModeButton = requireEl(
  document.querySelector<HTMLButtonElement>("#stationMode"),
  "#stationMode"
);
const helpButton = requireEl(
  document.querySelector<HTMLButtonElement>("#help"),
  "#help"
);
const copyResults = requireEl(
  document.querySelector<HTMLButtonElement>("#copyResults"),
  "#copyResults"
);
const status = requireEl(
  document.querySelector<HTMLParagraphElement>("#status"),
  "#status"
);

const orbitSvg = requireEl(
  document.querySelector<SVGSVGElement>("#orbitSvg"),
  "#orbitSvg"
);

const targetDirectionLine = requireEl(
  document.querySelector<SVGLineElement>("#targetDirectionLine"),
  "#targetDirectionLine"
);
const parallaxAxisLine = requireEl(
  document.querySelector<SVGLineElement>("#parallaxAxisLine"),
  "#parallaxAxisLine"
);
const targetStar = requireEl(
  document.querySelector<SVGCircleElement>("#targetStar"),
  "#targetStar"
);
const scaleNote = requireEl(
  document.querySelector<SVGTextElement>("#scaleNote"),
  "#scaleNote"
);

const earthNow = requireEl(
  document.querySelector<SVGCircleElement>("#earthNow"),
  "#earthNow"
);
const earthNowLabel = requireEl(
  document.querySelector<SVGTextElement>("#earthNowLabel"),
  "#earthNowLabel"
);
const earthCaptureA = requireEl(
  document.querySelector<SVGCircleElement>("#earthCaptureA"),
  "#earthCaptureA"
);
const earthCaptureALabel = requireEl(
  document.querySelector<SVGTextElement>("#earthCaptureALabel"),
  "#earthCaptureALabel"
);
const earthCaptureB = requireEl(
  document.querySelector<SVGCircleElement>("#earthCaptureB"),
  "#earthCaptureB"
);
const earthCaptureBLabel = requireEl(
  document.querySelector<SVGTextElement>("#earthCaptureBLabel"),
  "#earthCaptureBLabel"
);

const rayNow = requireEl(
  document.querySelector<SVGLineElement>("#rayNow"),
  "#rayNow"
);
const rayCaptureA = requireEl(
  document.querySelector<SVGLineElement>("#rayCaptureA"),
  "#rayCaptureA"
);
const rayCaptureB = requireEl(
  document.querySelector<SVGLineElement>("#rayCaptureB"),
  "#rayCaptureB"
);

const baseline = requireEl(
  document.querySelector<SVGLineElement>("#baseline"),
  "#baseline"
);

const detectorPanel = requireEl(
  document.querySelector<HTMLElement>("#detectorPanel"),
  "#detectorPanel"
);
const detectorMeasurementAxis = requireEl(
  document.querySelector<SVGLineElement>("#detectorMeasurementAxis"),
  "#detectorMeasurementAxis"
);
const detectorTicks = requireEl(
  document.querySelector<SVGGElement>("#detectorTicks"),
  "#detectorTicks"
);
const detectorScaleNote = requireEl(
  document.querySelector<SVGTextElement>("#detectorScaleNote"),
  "#detectorScaleNote"
);
const offscaleLeft = requireEl(
  document.querySelector<SVGGElement>("#offscaleLeft"),
  "#offscaleLeft"
);
const offscaleRight = requireEl(
  document.querySelector<SVGGElement>("#offscaleRight"),
  "#offscaleRight"
);
const offscaleLeftLabel = requireEl(
  document.querySelector<SVGTextElement>("#offscaleLeftLabel"),
  "#offscaleLeftLabel"
);
const offscaleRightLabel = requireEl(
  document.querySelector<SVGTextElement>("#offscaleRightLabel"),
  "#offscaleRightLabel"
);
const detectorNow = requireEl(
  document.querySelector<SVGCircleElement>("#detectorNow"),
  "#detectorNow"
);
const detectorNowLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorNowLabel"),
  "#detectorNowLabel"
);
const detectorMarkerEpochA = requireEl(
  document.querySelector<SVGCircleElement>("#detectorMarkerEpochA"),
  "#detectorMarkerEpochA"
);
const detectorMarkerEpochB = requireEl(
  document.querySelector<SVGCircleElement>("#detectorMarkerEpochB"),
  "#detectorMarkerEpochB"
);
const detectorEpochALabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorEpochALabel"),
  "#detectorEpochALabel"
);
const detectorEpochBLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorEpochBLabel"),
  "#detectorEpochBLabel"
);
const differenceVector = requireEl(
  document.querySelector<SVGLineElement>("#differenceVector"),
  "#differenceVector"
);

const errorCircleEpochA = requireEl(
  document.querySelector<SVGCircleElement>("#errorCircleEpochA"),
  "#errorCircleEpochA"
);
const errorCircleEpochB = requireEl(
  document.querySelector<SVGCircleElement>("#errorCircleEpochB"),
  "#errorCircleEpochB"
);
const scatterEpochA = requireEl(
  document.querySelector<SVGGElement>("#scatterEpochA"),
  "#scatterEpochA"
);
const scatterEpochB = requireEl(
  document.querySelector<SVGGElement>("#scatterEpochB"),
  "#scatterEpochB"
);

const detectorModeLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorModeLabel"),
  "#detectorModeLabel"
);
const detectorSeparationLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorSeparationLabel"),
  "#detectorSeparationLabel"
);
const degenerateWarningLabel = requireEl(
  document.querySelector<SVGTextElement>("#degenerateWarningLabel"),
  "#degenerateWarningLabel"
);

const deltaThetaMasValue = requireEl(
  document.querySelector<HTMLElement>("#deltaThetaMas"),
  "#deltaThetaMas"
);
const deltaThetaSignedMasValue = requireEl(
  document.querySelector<HTMLElement>("#deltaThetaSignedMas"),
  "#deltaThetaSignedMas"
);
const baselineEffAuValue = requireEl(
  document.querySelector<HTMLElement>("#baselineEffAu"),
  "#baselineEffAu"
);
const baselineChordAuValue = requireEl(
  document.querySelector<HTMLElement>("#baselineChordAu"),
  "#baselineChordAu"
);
const phaseSepDegValue = requireEl(
  document.querySelector<HTMLElement>("#phaseSepDeg"),
  "#phaseSepDeg"
);
const parallaxMasValue = requireEl(
  document.querySelector<HTMLElement>("#parallaxMas"),
  "#parallaxMas"
);
const parallaxArcsecValue = requireEl(
  document.querySelector<HTMLElement>("#parallaxArcsec"),
  "#parallaxArcsec"
);
const equivalentShiftMasValue = requireEl(
  document.querySelector<HTMLElement>("#equivalentShiftMas"),
  "#equivalentShiftMas"
);
const distancePcTrueValue = requireEl(
  document.querySelector<HTMLElement>("#distancePcTrue"),
  "#distancePcTrue"
);
const distanceLyTrueValue = requireEl(
  document.querySelector<HTMLElement>("#distanceLyTrue"),
  "#distanceLyTrue"
);
const distancePcReadout = requireEl(
  document.querySelector<HTMLElement>("#distancePc"),
  "#distancePc"
);
const distanceLyReadout = requireEl(
  document.querySelector<HTMLElement>("#distanceLy"),
  "#distanceLy"
);
const snrValue = requireEl(document.querySelector<HTMLElement>("#snr"), "#snr");
const snrQualityValue = requireEl(
  document.querySelector<HTMLElement>("#snrQuality"),
  "#snrQuality"
);
const sigmaPHatMasValue = requireEl(
  document.querySelector<HTMLElement>("#parallaxMasPm"),
  "#parallaxMasPm"
);
const sigmaDHatPcValue = requireEl(
  document.querySelector<HTMLElement>("#distancePcPm"),
  "#distancePcPm"
);

function setVisibility(element: Element, visible: boolean) {
  element.setAttribute("visibility", visible ? "visible" : "hidden");
}

function setChipPressed(button: HTMLButtonElement, pressed: boolean) {
  button.classList.toggle("is-active", pressed);
  button.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function formatDistance(valuePc: number): string {
  if (!Number.isFinite(valuePc)) return "\u2014";
  return valuePc >= 100 ? formatNumber(valuePc, 1) : formatNumber(valuePc, 2);
}

// SVG y points down; the AU frame's y points up.
function screenDir(vector: Vec2): Vec2 {
  return { x: vector.x, y: -vector.y };
}

function orbitToScreen(earthPosAu: Vec2): Vec2 {
  return addVec2(ORBIT_CENTER, scaleVec2(screenDir(earthPosAu), ORBIT_RADIUS_PX));
}

function detectorPxFromMas(scalarMas: number): number {
  return clamp(
    offsetPx(scalarMas, state.exaggerationVisual, DETECTOR_PX_PER_MAS),
    -DETECTOR_RANGE_PX,
    DETECTOR_RANGE_PX
  );
}

function detectorToScreen(offsetMas: Vec2): Vec2 {
  const scalarPx = detectorPxFromMas(dotVec2(offsetMas, state.axisHat));
  return addVec2(DETECTOR_CENTER, scaleVec2(screenDir(state.axisHat), scalarPx));
}

/** Largest 1, 2 or 5 x 10^n step that still puts at least `minTicks` ticks per side. */
function detectorTickStepMas(rangeMas: number, minTicks = 2): number {
  const target = rangeMas / minTicks;
  const decade = 10 ** Math.floor(Math.log10(target));
  for (const mantissa of [5, 2, 1]) {
    if (mantissa * decade <= target) return mantissa * decade;
  }
  return decade;
}

function formatTickMas(valueMas: number, stepMas: number): string {
  const decimals = stepMas >= 1 ? 0 : Math.ceil(-Math.log10(stepMas));
  return valueMas.toFixed(decimals);
}

/** Distance in AU as words a student can read: "2.1 million AU". */
function formatAuInWords(distanceAu: number): string {
  const scales: Array<[number, string]> = [
    [1e9, " billion"],
    [1e6, " million"],
    [1e3, " thousand"]
  ];
  for (const [scale, word] of scales) {
    if (distanceAu >= scale) return `${Number((distanceAu / scale).toPrecision(2))}${word} AU`;
  }
  return `${Number(distanceAu.toPrecision(2))} AU`;
}

/** Puts a label just outside the orbit, along the Sun->Earth direction. */
function setEarthLabel(label: SVGTextElement, earthPosAu: Vec2) {
  const point = orbitToScreen(
    scaleVec2(earthPosAu, (ORBIT_RADIUS_PX + EARTH_LABEL_OFFSET_PX) / ORBIT_RADIUS_PX)
  );
  label.setAttribute("x", point.x.toFixed(2));
  // +4 centres 12-13px text on the point.
  label.setAttribute("y", (point.y + 4).toFixed(2));
}

function phasesClose(phaseA: number, phaseB: number): boolean {
  return phaseSeparationDeg(phaseA, phaseB) < LABEL_MERGE_DEG;
}

function setLine(line: SVGLineElement, p1: Vec2, p2: Vec2) {
  line.setAttribute("x1", p1.x.toFixed(2));
  line.setAttribute("y1", p1.y.toFixed(2));
  line.setAttribute("x2", p2.x.toFixed(2));
  line.setAttribute("y2", p2.y.toFixed(2));
}

function setCircle(circle: SVGCircleElement, point: Vec2) {
  circle.setAttribute("cx", point.x.toFixed(2));
  circle.setAttribute("cy", point.y.toFixed(2));
}

function setLabel(label: SVGTextElement, point: Vec2, dy = 24) {
  label.setAttribute("x", point.x.toFixed(2));
  label.setAttribute("y", (point.y + dy).toFixed(2));
}

function renderScatter(group: SVGGElement, center: Vec2, radius: number) {
  group.replaceChildren();

  for (const template of SCATTER_TEMPLATES) {
    const angleRad = (template.angleDeg * Math.PI) / 180;
    const x = center.x + Math.cos(angleRad) * radius * template.radiusScale;
    const y = center.y + Math.sin(angleRad) * radius * template.radiusScale;
    const point = document.createElementNS(SVG_NS, "circle");
    point.setAttribute("cx", x.toFixed(2));
    point.setAttribute("cy", y.toFixed(2));
    point.setAttribute("r", "1.8");
    group.appendChild(point);
  }
}

function syncDistanceControls() {
  const distanceLy = ParallaxDistanceModel.distanceLyFromParsec(state.distancePc);
  distancePcRange.value = formatNumber(state.distancePc, 1);
  distancePcInput.value = formatNumber(state.distancePc, 2);
  distanceLyInput.value = formatNumber(distanceLy, 2);
  distancePcValue.textContent = `${formatDistance(state.distancePc)} pc`;
}

function clearCaptures(announce = true) {
  state.captureA = null;
  state.captureB = null;
  blinkShowA = true;
  updateBlinkTimer();
  if (announce) {
    setLiveRegionText(status, "Cleared captures.");
  }
}

function makeCapture(epochLabel: CaptureEpoch): Capture {
  const phaseDeg = normalizePhaseDeg(state.orbitPhaseDegNow);
  const earthPosAU = {
    x: Math.cos((phaseDeg * Math.PI) / 180),
    y: Math.sin((phaseDeg * Math.PI) / 180)
  };

  const parallaxMasTrue = ParallaxDistanceModel.parallaxMasFromDistanceParsec(state.distancePc);
  const detectorTrueMas = detectorTrueOffsetMasFromPosition(
    parallaxMasTrue,
    earthPosAU,
    state.axisHat
  );

  const axisNoiseMas = deterministicAxisNoiseMas({
    epochLabel,
    phaseDeg,
    distancePc: state.distancePc,
    sigmaMas: state.sigmaMas
  });

  const detectorMeasMas = applyAxisNoiseToOffset(
    detectorTrueMas,
    state.axisHat,
    axisNoiseMas
  );

  return {
    phaseDeg,
    earthPosAU,
    detectorTrueMas,
    detectorMeasMas,
    epochLabel
  };
}

function currentPresetLabel(): string {
  const selected = starPreset.selectedOptions[0];
  return selected ? selected.textContent?.trim() || "Custom distance" : "Custom distance";
}

function snapshot(): Snapshot {
  const distancePcTrue = state.distancePc;
  const distanceLyTrue = ParallaxDistanceModel.distanceLyFromParsec(distancePcTrue);
  const parallaxMasTrue = ParallaxDistanceModel.parallaxMasFromDistanceParsec(distancePcTrue);
  const parallaxArcsecTrue = parallaxArcsecFromMas(parallaxMasTrue);

  const nowPhaseDeg = normalizePhaseDeg(state.orbitPhaseDegNow);
  const nowEarthPosAu = {
    x: Math.cos((nowPhaseDeg * Math.PI) / 180),
    y: Math.sin((nowPhaseDeg * Math.PI) / 180)
  };

  const nowDetectorTrueMas = detectorTrueOffsetMasFromPhase(
    parallaxMasTrue,
    nowPhaseDeg,
    state.axisHat
  );

  const inference = computeCaptureInference({
    earthPosAuA: state.captureA?.earthPosAU ?? null,
    earthPosAuB: state.captureB?.earthPosAU ?? null,
    detectorMeasMasA: state.captureA?.detectorMeasMas ?? null,
    detectorMeasMasB: state.captureB?.detectorMeasMas ?? null,
    phaseDegA: state.captureA?.phaseDeg ?? null,
    phaseDegB: state.captureB?.phaseDeg ?? null,
    axisHat: state.axisHat,
    sigmaEpochMas: state.sigmaMas,
    minEffectiveBaselineAu: MIN_EFFECTIVE_BASELINE_AU
  });

  const parallaxMasHat = inference.pHatMas;
  const parallaxArcsecHat =
    parallaxMasHat !== null ? parallaxArcsecFromMas(parallaxMasHat) : null;
  const distancePcHat = inference.dHatPc;
  const distanceLyHat =
    distancePcHat !== null
      ? ParallaxDistanceModel.distanceLyFromParsec(distancePcHat)
      : null;

  return {
    distancePcTrue,
    distanceLyTrue,
    parallaxMasTrue,
    parallaxArcsecTrue,
    nowPhaseDeg,
    nowEarthPosAu,
    nowDetectorTrueMas,
    inference,
    distancePcHat,
    distanceLyHat,
    parallaxMasHat,
    parallaxArcsecHat
  };
}

function workflowState() {
  const hasA = state.captureA !== null;
  const hasB = state.captureB !== null;

  stepSetDistance.dataset.stepState = "complete";
  stepCaptureA.dataset.stepState = hasA ? "complete" : "current";
  stepCaptureB.dataset.stepState = hasB ? "complete" : hasA ? "current" : "pending";

  captureEpochAButton.classList.toggle("is-next", !hasA);
  captureEpochBButton.classList.toggle("is-next", hasA && !hasB);
  captureEpochBButton.disabled = !hasA;
  swapCapturesButton.disabled = !(hasA && hasB);
  clearCapturesButton.disabled = !(hasA || hasB);
}

function renderControls(snap: Snapshot) {
  syncDistanceControls();

  orbitPhaseScrub.value = String(Math.round(snap.nowPhaseDeg));
  orbitPhaseValue.textContent = `Now: ${Math.round(snap.nowPhaseDeg)} deg`;

  sigmaMas.value = formatNumber(state.sigmaMas, 1);
  sigmaMasValue.textContent = `${formatNumber(state.sigmaMas, 1)} mas`;

  exaggeration.value = formatNumber(state.exaggerationVisual, 1);
  exaggerationValue.textContent = `${formatNumber(state.exaggerationVisual, 1)}x`;

  setChipPressed(playPauseOrbit, state.isPlaying);
  playPauseOrbit.textContent = state.isPlaying ? "Pause orbit" : "Play orbit";

  showBaseline.checked = state.showBaseline;
  blinkMode.checked = state.blinkMode;

  setChipPressed(detectorModeOverlay, state.detectorMode === "overlay");
  setChipPressed(detectorModeDifference, state.detectorMode === "difference");

  if (state.captureA && state.captureB) {
    captureSummary.textContent = `Captured A at ${formatNumber(
      state.captureA.phaseDeg,
      1
    )} deg and B at ${formatNumber(state.captureB.phaseDeg, 1)} deg.`;
  } else if (state.captureA) {
    captureSummary.textContent = `Captured A at ${formatNumber(
      state.captureA.phaseDeg,
      1
    )} deg. Capture B next.`;
  } else {
    captureSummary.textContent = "Capture two moments to infer parallax.";
  }

  workflowState();
}

function renderOrbit(snap: Snapshot) {
  const starPos = addVec2(ORBIT_CENTER, scaleVec2(screenDir(state.starDirHat), STAR_DISTANCE_PX));
  const axisScreen = screenDir(state.axisHat);
  const axisStart = addVec2(ORBIT_CENTER, scaleVec2(axisScreen, -AXIS_HALF_LEN_PX));
  const axisEnd = addVec2(ORBIT_CENTER, scaleVec2(axisScreen, AXIS_HALF_LEN_PX));

  setLine(targetDirectionLine, ORBIT_CENTER, starPos);
  setLine(parallaxAxisLine, axisStart, axisEnd);
  setCircle(targetStar, starPos);
  scaleNote.textContent = `${formatAuInWords(snap.distancePcTrue * AU_PER_PC)} away`;

  const nowPos = orbitToScreen(snap.nowEarthPosAu);
  setCircle(earthNow, nowPos);
  setEarthLabel(earthNowLabel, snap.nowEarthPosAu);
  setLine(rayNow, nowPos, starPos);

  const { captureA, captureB } = state;
  // One label per spot on the orbit: a capture's label wins over "Now", and A and B
  // taken close together share "A, B".
  const nowNearCapture =
    (captureA !== null && phasesClose(snap.nowPhaseDeg, captureA.phaseDeg)) ||
    (captureB !== null && phasesClose(snap.nowPhaseDeg, captureB.phaseDeg));
  const capturesTogether =
    captureA !== null && captureB !== null && phasesClose(captureA.phaseDeg, captureB.phaseDeg);
  setVisibility(earthNowLabel, !nowNearCapture);

  if (captureA) {
    const posA = orbitToScreen(captureA.earthPosAU);
    setCircle(earthCaptureA, posA);
    setEarthLabel(earthCaptureALabel, captureA.earthPosAU);
    earthCaptureALabel.textContent = capturesTogether ? "A, B" : "A";
    setLine(rayCaptureA, posA, starPos);
  }
  setVisibility(earthCaptureA, captureA !== null);
  setVisibility(earthCaptureALabel, captureA !== null);
  setVisibility(rayCaptureA, captureA !== null);

  if (captureB) {
    const posB = orbitToScreen(captureB.earthPosAU);
    setCircle(earthCaptureB, posB);
    setEarthLabel(earthCaptureBLabel, captureB.earthPosAU);
    setLine(rayCaptureB, posB, starPos);
  }
  setVisibility(earthCaptureB, captureB !== null);
  setVisibility(earthCaptureBLabel, captureB !== null && !capturesTogether);
  setVisibility(rayCaptureB, captureB !== null);

  if (captureA && captureB && state.showBaseline) {
    setLine(baseline, orbitToScreen(captureA.earthPosAU), orbitToScreen(captureB.earthPosAU));
    setVisibility(baseline, true);
  } else {
    setVisibility(baseline, false);
  }
}

/**
 * Pinned dots, per side of the axis. The axis is horizontal on screen, so "left" is the
 * negative end of axisHat = (1, 0). Each entry carries the TRUE offset (measured for
 * captures), which the drawing can no longer show.
 */
function renderOffscaleMarkers(entries: ReadonlyArray<{ name: string; offsetMas: Vec2 }>) {
  const sides = { left: [] as string[], right: [] as string[] };
  for (const { name, offsetMas } of entries) {
    const scalarMas = dotVec2(offsetMas, state.axisHat);
    const drawnPx = offsetPx(scalarMas, state.exaggerationVisual, DETECTOR_PX_PER_MAS);
    if (Math.abs(drawnPx) <= DETECTOR_RANGE_PX) continue;
    const value = formatNumber(scalarMas, Math.abs(scalarMas) >= 100 ? 0 : 1);
    sides[drawnPx < 0 ? "left" : "right"].push(`${name} ${scalarMas > 0 ? "+" : ""}${value}`);
  }
  const apply = (group: SVGGElement, label: SVGTextElement, items: string[]) => {
    setVisibility(group, items.length > 0);
    setVisibility(label, items.length > 0);
    label.textContent = items.length > 0 ? `Off scale: ${items.join(", ")} mas` : "";
  };
  apply(offscaleLeft, offscaleLeftLabel, sides.left);
  apply(offscaleRight, offscaleRightLabel, sides.right);
}

function renderDetectorTicks() {
  const pxPerMas = offsetPx(1, state.exaggerationVisual, DETECTOR_PX_PER_MAS);
  if (!(pxPerMas > 0)) {
    detectorTicks.replaceChildren();
    return;
  }
  const rangeMas = DETECTOR_RANGE_PX / pxPerMas;
  const stepMas = detectorTickStepMas(rangeMas);
  const count = Math.floor(rangeMas / stepMas + 1e-9);
  const axisScreen = screenDir(state.axisHat);
  const nodes: SVGElement[] = [];

  for (let i = -count; i <= count; i += 1) {
    const valueMas = i * stepMas;
    const point = addVec2(DETECTOR_CENTER, scaleVec2(axisScreen, detectorPxFromMas(valueMas)));
    // Zero is the star's direction as seen from the Sun; give it the long tick.
    const half = i === 0 ? DETECTOR_TICK_HALF_PX * 2 : DETECTOR_TICK_HALF_PX;

    const tick = document.createElementNS(SVG_NS, "line");
    tick.setAttribute("x1", point.x.toFixed(2));
    tick.setAttribute("x2", point.x.toFixed(2));
    tick.setAttribute("y1", (point.y - half).toFixed(2));
    tick.setAttribute("y2", (point.y + half).toFixed(2));
    tick.setAttribute("class", i === 0 ? "detector__tick detector__tick--zero" : "detector__tick");
    nodes.push(tick);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", point.x.toFixed(2));
    label.setAttribute("y", (point.y + DETECTOR_TICK_LABEL_DY).toFixed(2));
    label.setAttribute(
      "class",
      i % 2 === 0 ? "detector__tick-label" : "detector__tick-label detector__tick-label--odd",
    );
    label.textContent = formatTickMas(valueMas, stepMas);
    nodes.push(label);
  }
  detectorTicks.replaceChildren(...nodes);

  const exaggeration = state.exaggerationVisual;
  detectorScaleNote.textContent =
    exaggeration === 1
      ? "Offsets in mas, drawn at true size"
      : `Offsets in mas; shifts drawn ${formatNumber(exaggeration, exaggeration % 1 === 0 ? 0 : 1)} times true size`;
}

function renderDetector(snap: Snapshot) {
  const axisStart = addVec2(
    DETECTOR_CENTER,
    scaleVec2(screenDir(state.axisHat), -DETECTOR_AXIS_HALF_LEN_PX)
  );
  const axisEnd = addVec2(
    DETECTOR_CENTER,
    scaleVec2(screenDir(state.axisHat), DETECTOR_AXIS_HALF_LEN_PX)
  );
  setLine(detectorMeasurementAxis, axisStart, axisEnd);
  renderDetectorTicks();

  // Tick labels sit below the axis, so every dot label goes above it: captures just
  // over their dots, the live "Now" one row higher so the three never collide.
  const nowPoint = detectorToScreen(snap.nowDetectorTrueMas);
  setCircle(detectorNow, nowPoint);
  setLabel(detectorNowLabel, nowPoint, DETECTOR_NOW_LABEL_DY);

  const hasA = !!state.captureA;
  const hasB = !!state.captureB;

  let pointA: Vec2 | null = null;
  let pointB: Vec2 | null = null;

  if (state.captureA) {
    pointA = detectorToScreen(state.captureA.detectorMeasMas);
    setCircle(detectorMarkerEpochA, pointA);
    setLabel(detectorEpochALabel, pointA, DETECTOR_CAPTURE_LABEL_DY);
    setVisibility(detectorMarkerEpochA, true);
    setVisibility(detectorEpochALabel, true);

    const radius = errorRadiusPx(
      state.sigmaMas,
      state.exaggerationVisual,
      DETECTOR_PX_PER_MAS,
      3,
      46
    );
    setCircle(errorCircleEpochA, pointA);
    errorCircleEpochA.setAttribute("r", radius.toFixed(2));
    renderScatter(scatterEpochA, pointA, radius);
    setVisibility(errorCircleEpochA, true);
    setVisibility(scatterEpochA, true);
  } else {
    setVisibility(detectorMarkerEpochA, false);
    setVisibility(detectorEpochALabel, false);
    setVisibility(errorCircleEpochA, false);
    setVisibility(scatterEpochA, false);
  }

  if (state.captureB) {
    pointB = detectorToScreen(state.captureB.detectorMeasMas);
    setCircle(detectorMarkerEpochB, pointB);
    setLabel(detectorEpochBLabel, pointB, DETECTOR_CAPTURE_LABEL_DY);
    setVisibility(detectorMarkerEpochB, true);
    setVisibility(detectorEpochBLabel, true);

    const radius = errorRadiusPx(
      state.sigmaMas,
      state.exaggerationVisual,
      DETECTOR_PX_PER_MAS,
      3,
      46
    );
    setCircle(errorCircleEpochB, pointB);
    errorCircleEpochB.setAttribute("r", radius.toFixed(2));
    renderScatter(scatterEpochB, pointB, radius);
    setVisibility(errorCircleEpochB, true);
    setVisibility(scatterEpochB, true);
  } else {
    setVisibility(detectorMarkerEpochB, false);
    setVisibility(detectorEpochBLabel, false);
    setVisibility(errorCircleEpochB, false);
    setVisibility(scatterEpochB, false);
  }

  detectorPanel.dataset.detectorMode = state.detectorMode;

  const blinkEnabled =
    state.blinkMode && !prefersReducedMotionEnabled() && hasA && hasB;
  detectorPanel.dataset.blink = blinkEnabled ? "on" : "off";

  if (pointA && pointB) {
    setLine(differenceVector, pointA, pointB);
    setVisibility(differenceVector, true);

    const gap = pointB.x - pointA.x;
    if (Math.abs(gap) < DETECTOR_LABEL_MIN_GAP_PX) {
      const midX = (pointA.x + pointB.x) / 2;
      const half = DETECTOR_LABEL_MIN_GAP_PX / 2;
      const aLeft = gap >= 0;
      detectorEpochALabel.setAttribute("x", (midX + (aLeft ? -half : half)).toFixed(2));
      detectorEpochBLabel.setAttribute("x", (midX + (aLeft ? half : -half)).toFixed(2));
    }
  } else {
    setVisibility(differenceVector, false);
  }

  if (state.detectorMode === "difference") {
    detectorModeLabel.textContent = "Difference mode: read signed A to B shift along the axis.";
  } else {
    detectorModeLabel.textContent = "Overlay mode: compare captured positions directly.";
  }

  if (snap.inference.computable) {
    detectorSeparationLabel.textContent = `Measured shift: ${formatNumber(
      snap.inference.deltaThetaMas,
      2
    )} mas`;
    degenerateWarningLabel.textContent = "";
  } else if (snap.inference.reason === "baseline_too_small") {
    detectorSeparationLabel.textContent = "Effective baseline too small for stable inference.";
    degenerateWarningLabel.textContent = "Increase capture separation along the parallax axis.";
  } else {
    detectorSeparationLabel.textContent = "Capture A and B to measure the shift.";
    degenerateWarningLabel.textContent = "";
  }

  renderOffscaleMarkers([
    { name: "Now", offsetMas: snap.nowDetectorTrueMas },
    ...(state.captureA ? [{ name: "A", offsetMas: state.captureA.detectorMeasMas }] : []),
    ...(state.captureB ? [{ name: "B", offsetMas: state.captureB.detectorMeasMas }] : [])
  ]);

  if (blinkEnabled && hasA && hasB) {
    setVisibility(detectorMarkerEpochA, blinkShowA);
    setVisibility(detectorEpochALabel, blinkShowA);
    setVisibility(errorCircleEpochA, blinkShowA);
    setVisibility(scatterEpochA, blinkShowA);

    setVisibility(detectorMarkerEpochB, !blinkShowA);
    setVisibility(detectorEpochBLabel, !blinkShowA);
    setVisibility(errorCircleEpochB, !blinkShowA);
    setVisibility(scatterEpochB, !blinkShowA);
  }
}

function renderReadouts(snap: Snapshot) {
  deltaThetaMasValue.textContent = snap.inference.computable
    ? formatNumber(snap.inference.deltaThetaMas, 3)
    : "\u2014";
  deltaThetaSignedMasValue.textContent = snap.inference.computable
    ? formatNumber(snap.inference.deltaThetaSignedMas, 3)
    : "\u2014";

  baselineEffAuValue.textContent = formatNumber(snap.inference.baselineEffAu, 3);
  baselineChordAuValue.textContent = formatNumber(snap.inference.baselineChordAu, 3);
  phaseSepDegValue.textContent = formatNumber(snap.inference.phaseSepDeg, 1);

  parallaxMasValue.textContent =
    snap.parallaxMasHat !== null ? formatNumber(snap.parallaxMasHat, 3) : "\u2014";
  parallaxArcsecValue.textContent =
    snap.parallaxArcsecHat !== null ? formatNumber(snap.parallaxArcsecHat, 6) : "\u2014";
  equivalentShiftMasValue.textContent =
    snap.inference.equivalentSixMonthShiftMas !== null
      ? formatNumber(snap.inference.equivalentSixMonthShiftMas, 3)
      : "\u2014";

  distancePcTrueValue.textContent = formatDistance(snap.distancePcTrue);
  distanceLyTrueValue.textContent = formatDistance(snap.distanceLyTrue);

  distancePcReadout.textContent =
    snap.distancePcHat !== null ? formatDistance(snap.distancePcHat) : "\u2014";
  distanceLyReadout.textContent =
    snap.distanceLyHat !== null ? formatDistance(snap.distanceLyHat) : "\u2014";

  snrValue.textContent =
    snap.inference.snrPHat !== null ? formatNumber(snap.inference.snrPHat, 2) : "\u2014";
  snrQualityValue.textContent = snap.inference.quality;

  // Inline "+/- sigma" beside the value it belongs to. Empty rather than an em dash when
  // there is no inference yet, so the value does not read as "12.4 +/- nothing".
  setMathText(
    sigmaPHatMasValue,
    snap.inference.sigmaPHatMas !== null
      ? ` $\\pm$ ${formatNumber(snap.inference.sigmaPHatMas, 3)}`
      : ""
  );
  setMathText(
    sigmaDHatPcValue,
    snap.inference.sigmaDHatPc !== null
      ? ` $\\pm$ ${formatDistance(snap.inference.sigmaDHatPc)}`
      : ""
  );
}

function render() {
  const snap = snapshot();
  renderControls(snap);
  renderOrbit(snap);
  renderDetector(snap);
  renderReadouts(snap);
}

function setDistancePc(nextDistancePc: number, source: "preset" | "manual" = "manual") {
  if (!Number.isFinite(nextDistancePc)) return;
  state.distancePc = clamp(nextDistancePc, DISTANCE_PC_MIN, DISTANCE_PC_MAX);
  if (source === "manual" && starPreset.value !== "") {
    starPreset.value = "";
  }
  clearCaptures(false);
  render();
  setLiveRegionText(status, "Distance updated. Capture A and B again.");
}

function setPlaying(nextIsPlaying: boolean, announce = true) {
  state.isPlaying = nextIsPlaying;
  if (state.isPlaying) {
    startOrbitLoop();
  } else {
    stopOrbitLoop();
  }
  render();
  if (announce) {
    setLiveRegionText(status, state.isPlaying ? "Orbit playing." : "Orbit paused.");
  }
}

function captureEpoch(label: CaptureEpoch) {
  const capture = makeCapture(label);
  if (label === "A") {
    state.captureA = capture;
    if (state.captureB) {
      state.captureB.epochLabel = "B";
    }
    setLiveRegionText(
      status,
      `Captured A at ${formatNumber(capture.phaseDeg, 1)} deg.`
    );
  } else {
    state.captureB = capture;
    setLiveRegionText(
      status,
      `Captured B at ${formatNumber(capture.phaseDeg, 1)} deg.`
    );
  }
  updateBlinkTimer();
  render();
}

function swapCaptures() {
  if (!state.captureA || !state.captureB) return;
  const prevA = state.captureA;
  const prevB = state.captureB;
  state.captureA = { ...prevB, epochLabel: "A" };
  state.captureB = { ...prevA, epochLabel: "B" };
  blinkShowA = !blinkShowA;
  updateBlinkTimer();
  render();
  setLiveRegionText(status, "Swapped captures A and B.");
}

function populatePresetSelect() {
  starPreset.innerHTML = "";

  const custom = document.createElement("option");
  custom.value = "";
  custom.textContent = "Custom distance";
  starPreset.appendChild(custom);

  for (const star of nearbyStars) {
    const option = document.createElement("option");
    const distancePc = ParallaxDistanceModel.distanceParsecFromParallaxMas(star.parallaxMas);
    option.value = star.name;
    option.dataset.distancePc = formatNumber(distancePc, 6);
    option.textContent = `${star.name} (${formatNumber(distancePc, 2)} pc)`;
    starPreset.appendChild(option);
  }

  starPreset.value = "";
}

function updateBlinkTimer() {
  const shouldAnimate =
    state.blinkMode &&
    !prefersReducedMotionEnabled() &&
    state.captureA !== null &&
    state.captureB !== null;

  if (shouldAnimate && blinkTimer === null) {
    blinkTimer = window.setInterval(() => {
      blinkShowA = !blinkShowA;
      render();
    }, BLINK_INTERVAL_MS);
  }

  if (!shouldAnimate && blinkTimer !== null) {
    window.clearInterval(blinkTimer);
    blinkTimer = null;
    blinkShowA = true;
  }
}

function orbitTick(timestampMs: number) {
  if (!state.isPlaying) {
    orbitFrame = null;
    orbitLastMs = null;
    return;
  }

  if (orbitLastMs === null) {
    orbitLastMs = timestampMs;
  }

  const dtSec = (timestampMs - orbitLastMs) / 1000;
  orbitLastMs = timestampMs;

  state.orbitPhaseDegNow = normalizePhaseDeg(
    state.orbitPhaseDegNow + ORBIT_RATE_DEG_PER_SEC * dtSec
  );
  render();

  orbitFrame = window.requestAnimationFrame(orbitTick);
}

function startOrbitLoop() {
  if (orbitFrame !== null) return;
  orbitLastMs = null;
  orbitFrame = window.requestAnimationFrame(orbitTick);
}

function stopOrbitLoop() {
  if (orbitFrame !== null) {
    window.cancelAnimationFrame(orbitFrame);
    orbitFrame = null;
  }
  orbitLastMs = null;
}

function exportResults(): ExportPayloadV1 {
  const snap = snapshot();

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Preset", value: currentPresetLabel() },
      { name: "Distance true d_true (pc)", value: formatNumber(state.distancePc, 4) },
      { name: "Orbit phase now (deg)", value: formatNumber(snap.nowPhaseDeg, 3) },
      {
        name: "Capture A phase (deg)",
        value: state.captureA ? formatNumber(state.captureA.phaseDeg, 3) : "\u2014"
      },
      {
        name: "Capture B phase (deg)",
        value: state.captureB ? formatNumber(state.captureB.phaseDeg, 3) : "\u2014"
      },
      { name: "Measurement uncertainty sigma_meas (mas)", value: formatNumber(state.sigmaMas, 3) },
      { name: "Exaggeration (visual only)", value: formatNumber(state.exaggerationVisual, 2) },
      { name: "Detector mode", value: state.detectorMode },
      { name: "Blink", value: state.blinkMode ? "on" : "off" }
    ],
    readouts: [
      {
        name: "Measured shift deltaTheta (mas)",
        value: snap.inference.computable ? formatNumber(snap.inference.deltaThetaMas, 6) : "\u2014"
      },
      {
        name: "Measured signed shift deltaTheta_signed (mas)",
        value: snap.inference.computable
          ? formatNumber(snap.inference.deltaThetaSignedMas, 6)
          : "\u2014"
      },
      { name: "Effective baseline B_eff (AU)", value: formatNumber(snap.inference.baselineEffAu, 6) },
      { name: "Baseline chord |rB-rA| (AU)", value: formatNumber(snap.inference.baselineChordAu, 6) },
      {
        name: "Inferred parallax p_hat (mas)",
        value: snap.parallaxMasHat !== null ? formatNumber(snap.parallaxMasHat, 6) : "\u2014"
      },
      {
        name: "Inferred distance d_hat (pc)",
        value: snap.distancePcHat !== null ? formatNumber(snap.distancePcHat, 6) : "\u2014"
      },
      {
        name: "Inferred distance d_hat (ly)",
        value: snap.distanceLyHat !== null ? formatNumber(snap.distanceLyHat, 6) : "\u2014"
      },
      {
        name: "Equivalent Jan-Jul shift 2p_hat (mas)",
        value:
          snap.inference.equivalentSixMonthShiftMas !== null
            ? formatNumber(snap.inference.equivalentSixMonthShiftMas, 6)
            : "\u2014"
      },
      {
        name: "Signal-to-noise p_hat/sigma_p_hat (inferred)",
        value: snap.inference.snrPHat !== null ? formatNumber(snap.inference.snrPHat, 6) : "\u2014"
      },
      { name: "Measurement quality", value: snap.inference.quality }
    ],
    notes: [
      "Parallax relation: d(pc) = 1 / p(arcsec).",
      "General two-capture inference uses projected detector shift along the parallax axis.",
      "Effective baseline B_eff is used for inference; chord length is reported for geometry context.",
      "Exaggeration affects visualization only, not inferred p_hat or d_hat."
    ]
  };
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:parallax-distance:mode",
  url: new URL(window.location.href)
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
          { key: "Space", action: "Play/pause orbit" },
          { key: "a", action: "Capture A" },
          { key: "b", action: "Capture B" }
        ]
      },
      {
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Set true distance first, then run orbit motion.",
          "Capture A and B to measure deltaTheta and infer p_hat and d_hat.",
          "Control sigma_meas sets per-capture measurement uncertainty; readouts report inferred sigma_p_hat and sigma_d_hat.",
          "If B_eff is tiny, captures are ill-conditioned for inference."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Parallax Distance",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Set true distance d_true and capture A and B.",
      "Record measured deltaTheta and effective baseline B_eff.",
      "Compare inferred d_hat to d_true and explain how measurement uncertainty (sigma_meas) propagates into inferred uncertainty."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "preset", label: "Preset" },
      { key: "dTruePc", label: "d_true (pc)" },
      { key: "phasePair", label: "Capture phases A/B (deg)" },
      { key: "deltaThetaMas", label: "Measured deltaTheta (mas)" },
      { key: "bEffAu", label: "B_eff (AU)" },
      { key: "pHatMas", label: "Inferred p_hat (mas)" },
      { key: "dHatPc", label: "Inferred d_hat (pc)" },
      { key: "snr", label: "p_hat/sigma_p_hat (inferred)" }
    ],
    getSnapshotRow() {
      const snap = snapshot();
      return {
        case: "Snapshot",
        preset: currentPresetLabel(),
        dTruePc: formatNumber(state.distancePc, 3),
        phasePair:
          state.captureA && state.captureB
            ? `${formatNumber(state.captureA.phaseDeg, 1)}/${formatNumber(
                state.captureB.phaseDeg,
                1
              )}`
            : "\u2014",
        deltaThetaMas: snap.inference.computable
          ? formatNumber(snap.inference.deltaThetaMas, 3)
          : "\u2014",
        bEffAu: formatNumber(snap.inference.baselineEffAu, 3),
        pHatMas:
          snap.parallaxMasHat !== null ? formatNumber(snap.parallaxMasHat, 3) : "\u2014",
        dHatPc:
          snap.distancePcHat !== null ? formatNumber(snap.distancePcHat, 3) : "\u2014",
        snr:
          snap.inference.snrPHat !== null
            ? formatNumber(snap.inference.snrPHat, 2)
            : "\u2014"
      };
    },
    snapshotLabel: "Add row (snapshot)",
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> Explain how baseline geometry and measurement uncertainty shape inferred uncertainty and parallax inference quality.</p>"
  }
});

demoModes.bindButtons({
  helpButton,
  stationButton: stationModeButton
});

populatePresetSelect();

starPreset.addEventListener("change", () => {
  const selected = starPreset.selectedOptions[0];
  const distanceText = selected?.dataset.distancePc;
  if (distanceText) {
    setDistancePc(Number(distanceText), "preset");
  }
});

distancePcRange.addEventListener("input", () => {
  setDistancePc(Number(distancePcRange.value));
});

distancePcInput.addEventListener("input", () => {
  if (distancePcInput.value.trim() === "") return;
  setDistancePc(Number(distancePcInput.value));
});

distanceLyInput.addEventListener("input", () => {
  if (distanceLyInput.value.trim() === "") return;
  const valueLy = Number(distanceLyInput.value);
  if (!Number.isFinite(valueLy)) return;
  setDistancePc(ParallaxDistanceModel.distanceParsecFromLy(valueLy));
});

playPauseOrbit.addEventListener("click", () => {
  setPlaying(!state.isPlaying);
});

orbitPhaseScrub.addEventListener("input", () => {
  state.orbitPhaseDegNow = normalizePhaseDeg(Number(orbitPhaseScrub.value));
  if (state.isPlaying) {
    setPlaying(false, false);
    setLiveRegionText(status, "Orbit paused for manual scrub.");
  }
  render();
});

captureEpochAButton.addEventListener("click", () => {
  captureEpoch("A");
});

captureEpochBButton.addEventListener("click", () => {
  if (!state.captureA) {
    setLiveRegionText(status, "Capture A before capturing B.");
    return;
  }
  captureEpoch("B");
});

swapCapturesButton.addEventListener("click", () => {
  swapCaptures();
});

clearCapturesButton.addEventListener("click", () => {
  clearCaptures(true);
  render();
});

showBaseline.addEventListener("change", () => {
  state.showBaseline = showBaseline.checked;
  render();
});

detectorModeOverlay.addEventListener("click", () => {
  state.detectorMode = "overlay";
  render();
});

detectorModeDifference.addEventListener("click", () => {
  state.detectorMode = "difference";
  render();
});

blinkMode.addEventListener("change", () => {
  state.blinkMode = blinkMode.checked;
  updateBlinkTimer();
  render();
});

sigmaMas.addEventListener("input", () => {
  state.sigmaMas = clamp(Number(sigmaMas.value), SIGMA_MAS_MIN, SIGMA_MAS_MAX);
  clearCaptures(false);
  render();
  setLiveRegionText(status, "Measurement uncertainty updated. Capture A and B again.");
});

exaggeration.addEventListener("input", () => {
  state.exaggerationVisual = clamp(Number(exaggeration.value), EXAGGERATION_MIN, EXAGGERATION_MAX);
  render();
});

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying...");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((err) =>
      setLiveRegionText(
        status,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
      )
    );
});

window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  const target = event.target as HTMLElement | null;
  const inEditable = !!target?.closest("input, select, textarea");
  if (inEditable) return;

  if (event.key === " ") {
    event.preventDefault();
    setPlaying(!state.isPlaying);
    return;
  }

  if (event.key.toLowerCase() === "a") {
    event.preventDefault();
    captureEpoch("A");
    return;
  }

  if (event.key.toLowerCase() === "b") {
    event.preventDefault();
    if (!state.captureA) {
      setLiveRegionText(status, "Capture A before capturing B.");
      return;
    }
    captureEpoch("B");
  }
});

initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

if (typeof window.matchMedia === "function") {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange = () => {
    if (media.matches) {
      state.blinkMode = false;
      blinkMode.checked = false;
      setPlaying(false, false);
    }
    updateBlinkTimer();
    render();
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onChange);
  } else if (typeof media.addListener === "function") {
    media.addListener(onChange);
  }
}

render();
updateBlinkTimer();

if (state.isPlaying) {
  startOrbitLoop();
}
