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
import {
  addVec2,
  applyAxisNoiseToOffset,
  buildParallaxBasis,
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
  scaleVec2,
  signalToNoise,
  subVec2,
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

const ORBIT_CENTER = { x: 280, y: 220 };
const ORBIT_RADIUS_PX = 138;
const STAR_RADIUS_PX = 148;
const AXIS_HALF_LEN_PX = 168;

const DETECTOR_CENTER = { x: 280, y: 210 };
const DETECTOR_AXIS_HALF_LEN_PX = 208;
const DETECTOR_PX_PER_MAS = 0.012;
const DETECTOR_RANGE_PX = 182;

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

const basis = buildParallaxBasis({ x: 0, y: 1 });

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
const targetDirectionLabel = requireEl(
  document.querySelector<SVGTextElement>("#targetDirectionLabel"),
  "#targetDirectionLabel"
);
const parallaxAxisLabel = requireEl(
  document.querySelector<SVGTextElement>("#parallaxAxisLabel"),
  "#parallaxAxisLabel"
);
const targetStar = requireEl(
  document.querySelector<SVGCircleElement>("#targetStar"),
  "#targetStar"
);
const targetStarLabel = requireEl(
  document.querySelector<SVGTextElement>("#targetStarLabel"),
  "#targetStarLabel"
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
const baselineLabel = requireEl(
  document.querySelector<SVGTextElement>("#baselineLabel"),
  "#baselineLabel"
);

const detectorPanel = requireEl(
  document.querySelector<HTMLElement>("#detectorPanel"),
  "#detectorPanel"
);
const detectorMeasurementAxis = requireEl(
  document.querySelector<SVGLineElement>("#detectorMeasurementAxis"),
  "#detectorMeasurementAxis"
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
  document.querySelector<HTMLElement>("#sigmaPHatMas"),
  "#sigmaPHatMas"
);
const sigmaDHatPcValue = requireEl(
  document.querySelector<HTMLElement>("#sigmaDHatPc"),
  "#sigmaDHatPc"
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

function orbitToScreen(earthPosAu: Vec2): Vec2 {
  return {
    x: ORBIT_CENTER.x + earthPosAu.x * ORBIT_RADIUS_PX,
    y: ORBIT_CENTER.y + earthPosAu.y * ORBIT_RADIUS_PX
  };
}

function detectorToScreen(offsetMas: Vec2): Vec2 {
  const scalarMas = dotVec2(offsetMas, state.axisHat);
  const scalarPx = clamp(
    offsetPx(scalarMas, state.exaggerationVisual, DETECTOR_PX_PER_MAS),
    -DETECTOR_RANGE_PX,
    DETECTOR_RANGE_PX
  );
  return {
    x: DETECTOR_CENTER.x + state.axisHat.x * scalarPx,
    y: DETECTOR_CENTER.y + state.axisHat.y * scalarPx
  };
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
  const starPos = addVec2(ORBIT_CENTER, scaleVec2(state.starDirHat, STAR_RADIUS_PX));
  const axisStart = addVec2(ORBIT_CENTER, scaleVec2(state.axisHat, -AXIS_HALF_LEN_PX));
  const axisEnd = addVec2(ORBIT_CENTER, scaleVec2(state.axisHat, AXIS_HALF_LEN_PX));

  setLine(targetDirectionLine, ORBIT_CENTER, starPos);
  setLine(parallaxAxisLine, axisStart, axisEnd);

  targetDirectionLabel.textContent = "Target direction";
  parallaxAxisLabel.textContent = "Parallax axis";

  setCircle(targetStar, starPos);
  setLabel(targetStarLabel, starPos, -6);

  const nowPos = orbitToScreen(snap.nowEarthPosAu);
  setCircle(earthNow, nowPos);
  setLabel(earthNowLabel, nowPos, 28);
  earthNowLabel.textContent = `Now ${formatNumber(snap.nowPhaseDeg, 0)}deg`;

  setLine(rayNow, nowPos, starPos);

  if (state.captureA) {
    const posA = orbitToScreen(state.captureA.earthPosAU);
    setCircle(earthCaptureA, posA);
    setLabel(earthCaptureALabel, posA, 28);
    earthCaptureALabel.textContent = `A ${formatNumber(state.captureA.phaseDeg, 0)}deg`;
    setLine(rayCaptureA, posA, starPos);
    setVisibility(earthCaptureA, true);
    setVisibility(earthCaptureALabel, true);
    setVisibility(rayCaptureA, true);
  } else {
    setVisibility(earthCaptureA, false);
    setVisibility(earthCaptureALabel, false);
    setVisibility(rayCaptureA, false);
  }

  if (state.captureB) {
    const posB = orbitToScreen(state.captureB.earthPosAU);
    setCircle(earthCaptureB, posB);
    setLabel(earthCaptureBLabel, posB, 28);
    earthCaptureBLabel.textContent = `B ${formatNumber(state.captureB.phaseDeg, 0)}deg`;
    setLine(rayCaptureB, posB, starPos);
    setVisibility(earthCaptureB, true);
    setVisibility(earthCaptureBLabel, true);
    setVisibility(rayCaptureB, true);
  } else {
    setVisibility(earthCaptureB, false);
    setVisibility(earthCaptureBLabel, false);
    setVisibility(rayCaptureB, false);
  }

  const hasBaseline = state.captureA && state.captureB && state.showBaseline;
  if (hasBaseline) {
    const a = orbitToScreen(state.captureA!.earthPosAU);
    const b = orbitToScreen(state.captureB!.earthPosAU);
    setLine(baseline, a, b);
    baselineLabel.textContent = `Chord ${formatNumber(
      snap.inference.baselineChordAu,
      2
    )} AU, Beff ${formatNumber(snap.inference.baselineEffAu, 2)} AU`;
    setVisibility(baseline, true);
    setVisibility(baselineLabel, true);
  } else {
    baselineLabel.textContent = "Baseline pending captures";
    setVisibility(baseline, false);
    setVisibility(baselineLabel, false);
  }
}

function renderDetector(snap: Snapshot) {
  const axisStart = addVec2(
    DETECTOR_CENTER,
    scaleVec2(state.axisHat, -DETECTOR_AXIS_HALF_LEN_PX)
  );
  const axisEnd = addVec2(
    DETECTOR_CENTER,
    scaleVec2(state.axisHat, DETECTOR_AXIS_HALF_LEN_PX)
  );
  setLine(detectorMeasurementAxis, axisStart, axisEnd);

  const nowPoint = detectorToScreen(snap.nowDetectorTrueMas);
  setCircle(detectorNow, nowPoint);
  setLabel(detectorNowLabel, nowPoint, 22);

  const hasA = !!state.captureA;
  const hasB = !!state.captureB;

  let pointA: Vec2 | null = null;
  let pointB: Vec2 | null = null;

  if (state.captureA) {
    pointA = detectorToScreen(state.captureA.detectorMeasMas);
    setCircle(detectorMarkerEpochA, pointA);
    setLabel(detectorEpochALabel, pointA, 22);
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
    setLabel(detectorEpochBLabel, pointB, 22);
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
  } else {
    setVisibility(differenceVector, false);
  }

  if (state.detectorMode === "difference") {
    detectorModeLabel.textContent = "Difference mode: read signed A to B shift along the axis.";
  } else {
    detectorModeLabel.textContent = "Overlay mode: compare captured positions directly.";
  }

  if (snap.inference.computable) {
    detectorSeparationLabel.textContent = `Measured shift deltaTheta = ${formatNumber(
      snap.inference.deltaThetaMas,
      2
    )} mas`;
    degenerateWarningLabel.textContent = "";
  } else if (snap.inference.reason === "baseline_too_small") {
    detectorSeparationLabel.textContent = "Effective baseline too small for stable inference.";
    degenerateWarningLabel.textContent = "Increase capture separation along the parallax axis.";
  } else {
    detectorSeparationLabel.textContent = "Capture A and B to compute measured shift deltaTheta.";
    degenerateWarningLabel.textContent = "";
  }

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

  sigmaPHatMasValue.textContent =
    snap.inference.sigmaPHatMas !== null
      ? formatNumber(snap.inference.sigmaPHatMas, 3)
      : "\u2014";
  sigmaDHatPcValue.textContent =
    snap.inference.sigmaDHatPc !== null
      ? formatDistance(snap.inference.sigmaDHatPc)
      : "\u2014";
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
